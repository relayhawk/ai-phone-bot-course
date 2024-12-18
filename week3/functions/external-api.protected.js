const https = require('https');

exports.handler = async function (context, event, callback) {
    try {
        const url = context.EXTERNAL_POST_URL;

        // Filter out Twilio-specific properties we don't want to send
        const { request, ...eventData } = event;

        const postData = JSON.stringify(eventData);

        // Parse the URL to extract hostname and path
        const parsedUrl = new URL(url);
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
            },
        };

        // Make the POST request using https.request
        const req = https.request(options, (res) => {
            let data = '';

            // Collect response chunks
            res.on('data', (chunk) => {
                data += chunk;
            });

            // Process the complete response
            res.on('end', () => {
                console.log('Raw Response:', data);
                console.log('Status Code:', res.statusCode);

                // Check if response is success (2xx status code)
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        // Try to parse as JSON if possible
                        const jsonResponse = JSON.parse(data);
                        callback(null, jsonResponse);
                    } catch (error) {
                        // If not JSON, return the raw response with status code
                        callback(null, {
                            statusCode: res.statusCode,
                            body: data
                        });
                    }
                } else {
                    callback(`Request failed with status code ${res.statusCode}: ${data}`);
                }
            });
        });

        // Handle request errors
        req.on('error', (e) => {
            console.error('Request error:', e);
            callback(e);
        });

        // Write data to request body and end it
        req.write(postData);
        req.end();
    } catch (error) {
        console.error('Error:', error);
        callback(error);
    }
};
