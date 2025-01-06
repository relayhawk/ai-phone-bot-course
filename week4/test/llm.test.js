const axios = require('axios');

// Shared test cases
const TEST_CASES = [
    {
        description: "Valid phone number with spaces",
        input: "555 987 6543",
        expected: {
            valid: true,
            phone: "555-987-6543",
            tts: "five five five, nine eight seven, six five four three",
            e164: "+15559876543"
        }
    }
];

// Provider configurations
const PROVIDERS = {
    anthropic: {
        PRIMARY_LLM: 'anthropic',
        SECONDARY_LLM: ''
    },
    openai: {
        PRIMARY_LLM: 'openai',
        SECONDARY_LLM: ''
    }
};

// Shared test function
async function runLLMTest(provider, testCase) {
    try {
        console.log(`Testing ${provider} with: ${testCase.description}`);

        const testInput = {
            provider: provider,
            input: testCase.input,
            promptLocation: "/prompts/phone.txt",
            // Override environment variables
            ...PROVIDERS[provider]
        };

        console.log('Test input:', testInput); // Debug log

        const response = await axios.post('http://localhost:3000/llm', testInput, {
            headers: {
                'Content-Type': 'application/json'
            },
            httpsAgent: new (require('https')).Agent({
                rejectUnauthorized: false
            })
        });

        // Basic response validation
        if (response.status !== 200) {
            throw new Error(`Expected status 200 but got ${response.status}`);
        }

        // Parse response
        const parsed = typeof response.data === 'string' 
            ? JSON.parse(response.data) 
            : response.data;

        // Validate JSON structure
        if (typeof parsed.valid !== 'boolean') {
            throw new Error('Expected response to have a boolean "valid" property');
        }

        // Compare with expected results
        for (const [key, expectedValue] of Object.entries(testCase.expected)) {
            if (parsed[key] !== expectedValue) {
                throw new Error(
                    `${key} mismatch:\n` +
                    `Expected: ${JSON.stringify(expectedValue)}\n` +
                    `Got: ${JSON.stringify(parsed[key])}`
                );
            }
        }

        console.log(`✓ ${provider} test passed:`, testCase.description);
        console.log('Response:', JSON.stringify(parsed, null, 2));
        return true;

    } catch (error) {
        console.error(`✗ ${provider} test failed:`, {
            description: testCase.description,
            message: error.message,
            response: error.response?.data || 'No response data',
            status: error.response?.status || 'No status code'
        });
        return false;
    }
}

// Main test runner
async function runAllTests() {
    const providers = Object.keys(PROVIDERS);
    let failedTests = 0;

    for (const provider of providers) {
        console.log(`\n=== Running ${provider} tests ===\n`);
        
        for (const testCase of TEST_CASES) {
            const passed = await runLLMTest(provider, testCase);
            if (!passed) failedTests++;
        }
    }

    // Exit with appropriate code
    if (failedTests > 0) {
        console.error(`\n${failedTests} test(s) failed`);
        process.exit(1);
    } else {
        console.log('\nAll tests passed successfully!');
        process.exit(0);
    }
}

// Run all tests
runAllTests(); 
