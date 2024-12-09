const https = require('https');
const axios = require('axios');

exports.handler = async function (context, event, callback) {
    console.log('Function started - Processing input for OpenAI classification');
    const input = event.input;
    console.log('User input received:', input);
    
    try {
        // Step 1: Fetch prompt template from Twilio asset
        console.log('Fetching prompt template from private asset...');
        // Access the open helper method for the Asset
        const openFile = Runtime.getAssets()['/prompt.txt'].open;
        
        // Open the Private Asset and read the contents
        const promptTemplate = openFile();
        console.log('Prompt template fetched successfully');
        
        // Step 2: Prepare the prompt by inserting user input
        const prompt = promptTemplate.replace('${input}', input);
        console.log('Final prompt prepared with user input');

        // Step 3: Prepare OpenAI API request
        console.log('Preparing OpenAI API request...');
        const postData = JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7
        });
        console.log('Request payload prepared (excluding sensitive data)');

        // Step 4: Configure API request options
        const options = {
            hostname: 'api.openai.com',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${context.OPENAI_API_KEY}`, // API key not logged
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        console.log('API request options configured');

        // Step 5: Make the request to OpenAI
        console.log('Sending request to OpenAI API...');
        const req = https.request(options, (res) => {
            console.log('Response status:', res.statusCode);
            console.log('Response headers:', res.headers);
            
            let data = '';

            // Collect data chunks
            res.on('data', (chunk) => {
                data += chunk;
                console.log('Received data chunk');
            });

            // Process complete response
            res.on('end', () => {
                console.log('Response completed');
                try {
                    // Parse and process the response
                    const jsonResponse = JSON.parse(data);
                    console.log('Response parsed successfully');
                    console.log('Raw Response (excluding sensitive data):', {
                        model: jsonResponse.model,
                        choices: jsonResponse.choices,
                        usage: jsonResponse.usage
                    });

                    // Extract the message content
                    const aiMessage = jsonResponse.choices[0]?.message?.content;

                    if (aiMessage) {
                        console.log('AI Classification:', aiMessage);
                        console.log('Processing completed successfully');
                        callback(null, { body: aiMessage }); // Return only the AI message content
                    } else {
                        console.error('Error: No message found in the response');
                        console.error('Response structure:', JSON.stringify(jsonResponse, null, 2));
                        callback(new Error('No valid message found in the API response.'));
                    }
                } catch (error) {
                    console.error('Error: Failed to parse JSON response');
                    console.error('Parse error:', error.message);
                    console.error('Raw response data:', data);
                    callback(`Failed to parse JSON: ${data}`);
                }
            });
        });

        // Handle request errors
        req.on('error', (e) => {
            console.error('Request error occurred:');
            console.error('Error name:', e.name);
            console.error('Error message:', e.message);
            console.error('Error stack:', e.stack);
            callback(e);
        });

        // Send the request
        console.log('Writing request data...');
        req.write(postData);
        console.log('Finalizing request...');
        req.end();
        console.log('Request sent to OpenAI');

    } catch (error) {
        console.error('Error in main try-catch block:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        callback(error);
    }
};