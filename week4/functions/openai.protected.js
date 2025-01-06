const https = require('https');
const axios = require('axios');

// Fetch and prepare the prompt
async function getPrompt(context, input) {
    try {
        // Use Runtime.getAssets() to access private assets
        const promptAsset = Runtime.getAssets()['/prompt.private.txt'];
        if (!promptAsset) {
            throw new Error('Prompt template asset not found');
        }

        // Read the content of the asset
        const promptTemplate = promptAsset.open();
        return promptTemplate.replace('${input}', input);
    } catch (error) {
        console.error('Error loading prompt template:', error);
        // Fallback to a default prompt if asset can't be loaded
        const defaultTemplate = "Please answer this question: ${input}";
        return defaultTemplate.replace('${input}', input);
    }
}

// Prepare the request data for OpenAI
function prepareOpenAIRequest(prompt) {
    return JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: prompt }
        ],
        temperature: 0.7
    });
}

// Configure request options
function getRequestOptions(apiKey, postData) {
    return {
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
}

// Make the request to OpenAI
function makeOpenAIRequest(options, postData) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonResponse = JSON.parse(data);
                    console.log('Raw Response:', jsonResponse);

                    const aiMessage = jsonResponse.choices[0]?.message?.content;
                    if (aiMessage) {
                        console.log(aiMessage);
                        resolve(aiMessage);
                    } else {
                        console.error('No message found in the response:', jsonResponse);
                        reject(new Error('No valid message found in the API response.'));
                    }
                } catch (error) {
                    console.error('Failed to parse JSON:', error);
                    reject(`Failed to parse JSON: ${data}`);
                }
            });
        });

        req.on('error', (error) => {
            console.error('Request error:', error);
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

// Main handler function
exports.handler = async function (context, event, callback) {
    try {
        // Get and prepare the prompt
        const prompt = await getPrompt(context, event.input);
        console.log('Input:', event.input);

        // Prepare the request
        const postData = prepareOpenAIRequest(prompt);
        const options = getRequestOptions(context.OPENAI_API_KEY, postData);

        // Make the request and get the response
        const aiMessage = await makeOpenAIRequest(options, postData);
        
        // Return the response
        callback(null, { body: aiMessage });

    } catch (error) {
        console.error('Error:', error);
        callback(error);
    }
}; 