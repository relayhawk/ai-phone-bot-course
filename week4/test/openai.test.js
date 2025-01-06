const axios = require('axios');

async function testOpenAIFunction() {
    try {
        console.log('Starting OpenAI function test...');

        // Test data
        const testInput = {
            input: "What is the capital of France?"
        };

        // Make request to local Twilio function
        const response = await axios.post('http://localhost:3000/openai', testInput, {
            headers: {
                'Content-Type': 'application/json'
            },
            // Add this to handle self-signed certificates in local development
            httpsAgent: new (require('https')).Agent({
                rejectUnauthorized: false
            })
        });

        // Log the full response for debugging
        console.log('Full response:', response.data);

        // Assertions
        console.assert(
            response.status === 200,
            `Expected status 200 but got ${response.status}`
        );

        console.assert(
            response.data.body && typeof response.data.body === 'string',
            'Expected response to have a body property with string content'
        );

        console.assert(
            response.data.body.length > 0,
            'Expected non-empty response body'
        );

        console.log('Test passed successfully!');
        console.log('Response body:', response.data.body);

    } catch (error) {
        console.error('Test failed:', {
            message: error.message,
            response: error.response?.data || 'No response data',
            status: error.response?.status || 'No status code'
        });
    }
}

// Run the test
testOpenAIFunction(); 