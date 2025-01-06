const https = require('https');
const axios = require('axios');

exports.handler = async function (context, event, callback) {
    const input = event.input;
    
    try {
        // Fetch the prompt template from the asset
        const promptResponse = await axios.get(`https://${context.DOMAIN_NAME}/prompt.txt`);
        const promptTemplate = promptResponse.data;
        
        // Replace the placeholder with the actual input
        const prompt = promptTemplate.replace('${input}', input);
        console.log(input)

        // Define the OpenAI API key from environment variables
        const OPENAI_API_KEY = context.OPENAI_API_KEY;


        const postData = JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7
        });

        const options = {
            hostname: 'api.openai.com',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonResponse = JSON.parse(data);
                    console.log('Raw Response:', jsonResponse);

                    // Extract the message content from the response
                    const aiMessage = jsonResponse.choices[0]?.message?.content;

                    if (aiMessage) {
                        console.log(aiMessage);
                        callback(null, { body: aiMessage }); // Return only the AI message content
                    } else {
                        console.error('No message found in the response:', jsonResponse);
                        callback(new Error('No valid message found in the API response.'));
                    }
                } catch (error) {
                    console.error('Failed to parse JSON:', error);
                    callback(`Failed to parse JSON: ${data}`);
                }
            });
        });

        req.on('error', (e) => {
            console.error('Request error:', e);
            callback(e);
        });

        req.write(postData);
        req.end();
    } catch (error) {
        console.error('Error:', error);
        callback(error);
    }
};