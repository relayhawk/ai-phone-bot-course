const axios = require('axios');

async function testLLMFunction() {
    try {
        console.log('Starting LLM function test (OpenAI)...');

        // Test data
        const testInput = {
            provider: "openai",
            input: "555 987 6543",
            // note: the .private. part is not needed in the promptLocation
            promptLocation: "/prompts/phone.txt"
        };

        // Make request to local Twilio function
        const response = await axios.post('http://localhost:3000/llm', testInput, {
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

        console.assert(
            response.data.body === 'True',
            'Expected response to be True'
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
testLLMFunction(); 