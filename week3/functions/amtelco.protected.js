const https = require('https');
const axios = require('axios');
const qs = require('qs');

exports.handler = async function (context, event, callback) {
    let sessionCookie;
    
    // Validate required environment variables
    const requiredVars = {
        'AMTELCO_BASE_URL': context.AMTELCO_BASE_URL,
        'AMTELCO_USERNAME': context.AMTELCO_USERNAME,
        'AMTELCO_PASSWORD': context.AMTELCO_PASSWORD,
        'AMTELCO_CLIENTID': context.AMTELCO_CLIENTID,
        'AMTELCO_LISTID': context.AMTELCO_LISTID
    };

    // Check for missing variables
    const missingVars = Object.entries(requiredVars)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

    if (missingVars.length > 0) {
        const error = `Missing required environment variables: ${missingVars.join(', ')}`;
        console.error(error);
        return callback(error);
    }

    console.log('Configuration:', {
        baseUrl: context.AMTELCO_BASE_URL,
        username: context.AMTELCO_USERNAME,
        clientId: context.AMTELCO_CLIENTID,
        listId: context.AMTELCO_LISTID
    });

    try {
        const baseUrl = context.AMTELCO_BASE_URL;
        const username = context.AMTELCO_USERNAME;
        const password = context.AMTELCO_PASSWORD;
        const clientId = context.AMTELCO_CLIENTID;
        const listId = context.AMTELCO_LISTID;

        console.log('Incoming event data:', {
            ...event,
            request: '[REMOVED]' // Don't log request object
        });

        // Create axios instance with cookie handling
        const axiosInstance = axios.create({
            baseURL: baseUrl,
            withCredentials: true
        });

        // Add cookie jar to store cookies between requests
        let cookieJar = '';

        // Add interceptors to handle cookies
        axiosInstance.interceptors.response.use(response => {
            // Capture Set-Cookie header
            const setCookie = response.headers['set-cookie'];
            if (setCookie) {
                cookieJar = setCookie;
                console.log('Cookie received');
            }
            return response;
        });

        axiosInstance.interceptors.request.use(request => {
            // Add cookie to subsequent requests
            if (cookieJar) {
                request.headers.Cookie = cookieJar;
            }
            return request;
        });

        try {
            console.log('Attempting login...');
            // Login with form-urlencoded content type
            const loginResponse = await axiosInstance.post('/mobileIS.svc/Login', 
                qs.stringify({
                    'agent': username,
                    'password': password
                }), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );
            
            // Check for login failure in response data
            if (loginResponse.data.ErrorMessage) {
                console.error('Login failed:', loginResponse.data.ErrorMessage);
                const error = new Error(`Authentication failed: ${loginResponse.data.ErrorMessage}`);
                error.response = loginResponse;
                throw error;
            }
            console.log('Login successful');

            axiosInstance.interceptors.request.use(request => {
                console.log('Request Headers:', request.headers);
                return request;
            });

            // Prepare message data from event
            const { request, ...eventData } = event;
            
            // Format the message data
            const messageData = qs.stringify({
                'cltId': clientId,
                'listId': listId,
                'subject': eventData.subject || 'New message',
                'message': eventData.message || 'No message provided',
                'urgent': 'false',
                'dispatch': 'false'
            });

            console.log('Sending message with data:', {
                cltId: clientId,
                listId: listId,
                subject: eventData.subject || 'New message',
                urgent: 'false',
                dispatch: 'false',
            });

            // Send message with form-urlencoded content type
            const response = await axiosInstance.post('/mobileIS.svc/Message', 
                messageData, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );
            
            // Check for login failure in response data
            if (response.data.ErrorMessage === "Invalid login or password.") {
                console.error('Login failed - Invalid credentials');
                const error = new Error('Authentication failed: Invalid login or password');
                error.response = response;
                throw error;
            }
            
            // Check for the error that we see, but don't understand
            if (response.statusText === "Object reference not set to an instance of an object.") {
                console.error('Unknown error - Object reference not set to an instance of an object');
                const error = new Error('Unknown error - Object reference not set to an instance of an object');
                error.response = response;
                throw error;
            }

            // Check for session issues in response data
            if (response.statusText === "No Session.  Perform a Login.") {
                console.error('Session validation failed - new login required');
                const error = new Error('Session invalid or expired. Login required.');
                error.response = response;
                throw error;
            }
            
            console.log('Message sent successfully. Response:', response.data);
            callback(null, response.data);

        } catch (error) {
            console.error('Operation error:', {
                message: error.message,
                code: error.code,
                response: error.response ? {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data
                } : 'No response'
            });
            callback(error);
            return;  // Ensure the function exits after handling the error

        } finally {
            if (sessionCookie) {
                console.log('Attempting logout...');
                // Logout - no specific content type needed
                await axiosInstance.get('/mobileIS.svc/Logout');
                console.log('Successfully logged out');
            }
        }

    } catch (error) {
        console.error('Fatal error:', error);
        callback(error);
    }
};