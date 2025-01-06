const https = require('https');
const axios = require('axios');

function getLLMConfig(context) {
  // Required configuration
  const config = {
      primary: context.PRIMARY_LLM,
      secondary: context.SECONDARY_LLM,
      providers: {
          openai: {
              apiKey: context.OPENAI_API_KEY,
              model: context.OPENAI_MODEL
          },
          anthropic: {
              apiKey: context.ANTHROPIC_API_KEY,
              model: context.ANTHROPIC_MODEL
          }
          // Add other providers as needed
      }
  };
  console.log('Primary LLM provider:', config.primary);
  console.log('Secondary LLM provider:', config.secondary);

  // Validate configuration
  if (!config.primary || !config.providers[config.primary]) {
      throw new Error('Primary LLM provider not properly configured');
  }

  if (config.secondary && !config.providers[config.secondary]) {
      throw new Error('Secondary LLM provider not properly configured');
  }

  return config;
}

class LLMClient {
  constructor(config) {
      this.config = config;
      this.primaryProvider = config.primary;
      
      // Initialize the appropriate client based on the provider
      const providerConfig = this.config.providers[this.primaryProvider];
      switch (this.primaryProvider) {
          case 'openai':
              this.primaryClient = new OpenAIClient(providerConfig.model, providerConfig.apiKey);
              break;
          case 'anthropic':
              this.primaryClient = new AnthropicClient(providerConfig.model, providerConfig.apiKey);
              break;
          default:
              throw new Error(`Unsupported LLM provider: ${this.primaryProvider}`);
      }
  }

  async query(prompt) {
      // Use preferred provider if specified, otherwise use primary
      return await this.primaryClient.getResponse(prompt);
  }

 
}
  
class OpenAIClient {
    constructor(model, apiKey) {
      this.model = model;
      this.apiKey = apiKey;
      this.apiUrl = 'https://api.openai.com/v1/chat/completions';
    }
  
    async getResponse(prompt) {
      const axios = require('axios');
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data.choices[0].message.content;
    }
  }

// Fetch and prepare the prompt
async function getPrompt(promptLocation, input) {
    try {
      // Security check - make sure the prompt location is within the prompt directory
      if (!promptLocation.startsWith('/prompts/')) {
        throw new Error('Prompt location must start with /prompt/');
    }
    // Security check - make sure the prompt ends with .txt
        if (!promptLocation.endsWith('.txt')) {
            throw new Error('Prompt location must be a .txt file');
        }

        // Asset paths in Runtime.getAssets() don't include /assets/
        const promptAsset = Runtime.getAssets()[`${promptLocation}`];
        
        if (!promptAsset) {
            throw new Error(`Prompt template asset not found: ${promptLocation}`);
        }

        // Read and process the prompt template
        const promptTemplate = promptAsset.open();
        return promptTemplate.replace('${input}', input);

    } catch (error) {
        console.error('Error loading prompt template:', error);
        throw error;
    }
}

class AnthropicClient {
    constructor(model, apiKey) {
      this.model = model;
      this.apiKey = apiKey;
      this.apiUrl = 'https://api.anthropic.com/v1/messages';
    }
  
    async getResponse(prompt) {
      const axios = require('axios');
      try {
        const response = await axios.post(
          this.apiUrl,
          {
            model: this.model,
            max_tokens: 1024,
            messages: [
              {
                role: "user",
                content: prompt
              }
            ]
          },
          {
            headers: {
              'anthropic-version': '2023-06-01',
              'x-api-key': this.apiKey,
              'Content-Type': 'application/json',
            },
          }
        );
        
        return response.data.content[0].text;
      } catch (error) {
        // Log the detailed error information
        console.error('Anthropic API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          errorType: error.response?.data?.error?.type,
          errorMessage: error.response?.data?.error?.message
        });
        
        // Re-throw the error to be handled by the caller
        throw error;
      }
    }
}

function validateEventFields(event, callback) {
    const requiredFields = {
        'provider': 'string',
        'input': 'string',
        'promptLocation': 'string'
    };

    const missingOrInvalidFields = Object.entries(requiredFields)
        .filter(([field, type]) => {
            const value = event[field];
            return !value || typeof value !== type;
        })
        .map(([field]) => field);

    if (missingOrInvalidFields.length > 0) {
        const error = `Missing or invalid required fields: ${missingOrInvalidFields.join(', ')}`;
        console.error(error);
        return callback(error);
    }

    return true;
}

exports.handler = async function (context, event, callback) {
    try {
        // Validate event fields
        if (!validateEventFields(event, callback)) {
            return; // Validation failed and callback was called with error
        }

        const config = getLLMConfig(context);

        // Now we can safely use the validated fields
        const prompt = await getPrompt(event.promptLocation, event.input);
        const llmClient = new LLMClient(config);
        const response = await llmClient.query(prompt);
        callback(null, { body: response });
    } catch (error) {
        console.error('Error:', error);
        callback(error);
    }
};