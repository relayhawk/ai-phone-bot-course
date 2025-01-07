const https = require('https');
const axios = require('axios');

function getLLMConfig(context, event) {
  // Required configuration
  const config = {
      // we load from the event first, then the context
      // The event is from the client and the context is from the environment variables
      primary: event.PRIMARY_LLM || context.PRIMARY_LLM,
      secondary: event.SECONDARY_LLM || context.SECONDARY_LLM,
      model: event.PRIMARY_MODEL || context.PRIMARY_MODEL,
      providers: {
          openai: {
              apiKey: context.OPENAI_API_KEY
          },
          anthropic: {
              apiKey: context.ANTHROPIC_API_KEY
          }
      }
  };

  // Validate configuration
  if (!config.primary || !config.providers[config.primary]) {
      throw new Error('Primary LLM provider not properly configured');
  }

  if (config.secondary && !config.providers[config.secondary]) {
      throw new Error('Secondary LLM provider not properly configured');
  }

  if (!config.model) {
      throw new Error('Primary model not configured');
  }

  // Add model to the appropriate provider
  config.providers[config.primary].model = config.model;

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
      const startTime = performance.now();
      const response = await this.primaryClient.getResponse(prompt);
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime); // Round to nearest millisecond

      // Log the tokens used
      console.log('Tokens used:', response.metadata.usage);
      console.log('Request duration:', duration, 'ms');

      return {
          content: response.content,
          metadata: {
              ...response.metadata,
              duration_ms: duration
          }
      };
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

      return {
          content: response.data.choices[0].message.content,
          metadata: {
              provider: 'openai',
              model: response.data.model,
              request_id: response.data.id,
              usage: {
                  input_tokens: response.data.usage.prompt_tokens,
                  output_tokens: response.data.usage.completion_tokens,
                  total_tokens: response.data.usage.total_tokens
              }
          }
      };
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
        
        return {
            content: response.data.content[0].text,
            metadata: {
                provider: 'anthropic',
                model: response.data.model,
                request_id: response.data.id,
                usage: {
                    input_tokens: response.data.usage.input_tokens,
                    output_tokens: response.data.usage.output_tokens,
                    total_tokens: response.data.usage.input_tokens + response.data.usage.output_tokens
                }
            }
        };
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

        // Pass both context and event to getLLMConfig
        const config = getLLMConfig(context, event);
        
        console.log('Primary LLM provider:', config.primary);
        console.log('Primary LLM model:', config.model);
        console.log('Secondary LLM provider:', config.secondary);

        // Now we can safely use the validated fields
        const prompt = await getPrompt(event.promptLocation, event.input);
        const llmClient = new LLMClient(config);
        const response = await llmClient.query(prompt);

        // Parse the content if it's a string
        let parsedContent;
        try {
            parsedContent = typeof response.content === 'string' 
                ? JSON.parse(response.content) 
                : response.content;
        } catch (error) {
            // Log the raw response for debugging
            console.log('Raw LLM response:', {
                content: response.content,
                type: typeof response.content
            });
            // Create a structured error response
            const errorResponse = {
                error: {
                    type: 'PARSE_ERROR',
                    message: 'Failed to parse LLM response',
                    details: {
                        cause: error.message,
                        rawContent: response.content?.substring(0, 100) + '...',  // Truncate long responses
                        provider: config.primary,
                        model: config.providers[config.primary].model
                    }
                },
                _metadata: {
                    timestamp: new Date().toISOString(),
                    success: false
                }
            };
            
            console.error('Parse error:', errorResponse);
            return callback(null, errorResponse, 400);
        }

        // Return both the parsed content and metadata
        callback(null, {
            ...parsedContent,
            _metadata: response.metadata
        });

    } catch (error) {
        // Handle other runtime errors
        const errorResponse = {
            error: {
                type: 'RUNTIME_ERROR',
                message: error.message,
                details: {
                    stack: error.stack?.split('\n'),
                    provider: config.primary,
                    model: config.providers[config.primary].model
                }
            },
            _metadata: {
                timestamp: new Date().toISOString(),
                success: false
            }
        };

        console.error('Runtime error:', errorResponse);
        return callback(null, errorResponse, 500);
    }
};