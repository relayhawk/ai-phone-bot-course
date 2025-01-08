// Initialize DataDog tracer with logging
const tracer = require('dd-trace').init({})

// Check if tracer is running
if (tracer) {
    console.log('DataDog tracer initialized successfully');
} else {
    console.warn('DataDog tracer failed to initialize');
}

// Add a console log of the environment variables
console.log('Environment variables:', process.env);

const https = require('https');
const axios = require('axios');
const { performance, PerformanceObserver } = require('perf_hooks');
const dns = require('dns');
const { URL } = require('url');

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
      
      // Pass config to client constructors
      if (config.providers.openai) {
          this.openaiClient = new OpenAIClient(
              config.providers.openai.apiKey,
              config.providers.openai.model,
              'https://api.openai.com/v1/chat/completions',
              config
          );
      }
      
      if (config.providers.anthropic) {
          this.anthropicClient = new AnthropicClient(
              config.providers.anthropic.apiKey,
              config.providers.anthropic.model,
              'https://api.anthropic.com/v1/messages',
              config
          );
      }

      // Set primary client
      this.primaryClient = this[`${config.primary}Client`];
      if (!this.primaryClient) {
          throw new Error(`Primary provider ${config.primary} not configured`);
      }
  }

  async query(prompt) {
      const startTime = performance.now();
      const response = await this.primaryClient.getResponse(prompt);
      const duration = Math.round(performance.now() - startTime);

      // Add provider information here
      return {
          content: response.content,
          metadata: {
              ...response.metadata,
              provider: this.config.primary,
              duration_ms: duration
          }
      };
  }

 
}
  
class OpenAIClient {
    constructor(apiKey, model, apiUrl, config) {
        this.apiKey = apiKey;
        this.model = model;
        this.apiUrl = apiUrl;
        this.config = config;
    }
  
    async getResponse(prompt) {
        const url = new URL(this.apiUrl);
        const timings = {
            start: performance.now(),
            dnsStart: 0,
            dnsEnd: 0,
            connectStart: 0,
            connectEnd: 0,
            tlsStart: 0,
            tlsEnd: 0,
            firstByte: 0,
            end: 0
        };

        // DNS Lookup
        timings.dnsStart = performance.now();
        await new Promise((resolve, reject) => {
            dns.lookup(url.hostname, (err, address) => {
                timings.dnsEnd = performance.now();
                if (err) reject(err);
                resolve(address);
            });
        });

        // Make the request with detailed timing
        const response = await axios.post(
            this.apiUrl,
            {
                model: this.model,
                messages: [{ role: 'user', content: prompt }]
            },
            {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                beforeRedirect: () => {
                    if (!timings.connectEnd) {
                        timings.connectEnd = performance.now();
                    }
                },
                beforeRedirect: () => {
                    if (!timings.connectStart) {
                        timings.connectStart = performance.now();
                    }
                },
                onUploadProgress: () => {
                    if (!timings.tlsEnd) {
                        timings.tlsEnd = performance.now();
                    }
                },
                onDownloadProgress: () => {
                    if (!timings.firstByte) {
                        timings.firstByte = performance.now();
                    }
                }
            }
        );

        timings.end = performance.now();

        // Log detailed timing information
        console.log('Request timing:', {
            dns: `${Math.round(timings.dnsEnd - timings.dnsStart)}ms`,
            connection: `${Math.round(timings.connectEnd - timings.connectStart)}ms`,
            tls: `${Math.round(timings.tlsEnd - timings.tlsStart)}ms`,
            ttfb: `${Math.round(timings.firstByte - timings.start)}ms`,
            total: `${Math.round(timings.end - timings.start)}ms`,
            serverProcessing: `${Math.round(timings.end - (timings.dnsStart + (timings.connectEnd - timings.connectStart) + (timings.tlsEnd - timings.tlsStart)))}ms`
        });

        return {
            content: response.data.choices[0].message.content,
            metadata: {
                model: response.data.model,
                request_id: response.data.id,
                usage: {
                    input_tokens: response.data.usage.prompt_tokens,
                    output_tokens: response.data.usage.completion_tokens,
                    total_tokens: response.data.usage.total_tokens
                },
                timing: {
                    dns_ms: Math.round(timings.dnsEnd - timings.dnsStart),
                    connection_ms: Math.round(timings.connectEnd - timings.connectStart),
                    tls_ms: Math.round(timings.tlsEnd - timings.tlsStart),
                    ttfb_ms: Math.round(timings.firstByte - timings.start),
                    total_ms: Math.round(timings.end - timings.start),
                    server_ms: Math.round(timings.end - (timings.dnsStart + (timings.connectEnd - timings.connectStart) + (timings.tlsEnd - timings.tlsStart)))
                },
                timestamp: new Date().toISOString()
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
    constructor(apiKey, model, apiUrl, config) {
        this.apiKey = apiKey;
        this.model = model;
        this.apiUrl = apiUrl;
        this.config = config;
    }
  
    async getResponse(prompt) {
        const url = new URL(this.apiUrl);
        const timings = {
            start: performance.now(),
            dnsStart: 0,
            dnsEnd: 0,
            connectStart: 0,
            connectEnd: 0,
            tlsStart: 0,
            tlsEnd: 0,
            firstByte: 0,
            end: 0
        };

        // DNS Lookup
        timings.dnsStart = performance.now();
        await new Promise((resolve, reject) => {
            dns.lookup(url.hostname, (err, address) => {
                timings.dnsEnd = performance.now();
                if (err) reject(err);
                resolve(address);
            });
        });

        // Make the request with detailed timing
        const response = await axios.post(
            this.apiUrl,
            {
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1024
            },
            {
                headers: {
                    'anthropic-version': '2023-06-01',
                    'x-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                beforeRedirect: () => {
                    if (!timings.connectEnd) {
                        timings.connectEnd = performance.now();
                    }
                },
                beforeRedirect: () => {
                    if (!timings.connectStart) {
                        timings.connectStart = performance.now();
                    }
                },
                onUploadProgress: () => {
                    if (!timings.tlsEnd) {
                        timings.tlsEnd = performance.now();
                    }
                },
                onDownloadProgress: () => {
                    if (!timings.firstByte) {
                        timings.firstByte = performance.now();
                    }
                }
            }
        );

        timings.end = performance.now();

        // Calculate durations
        const durations = {
            dns: timings.dnsEnd - timings.dnsStart,
            connect: (timings.connectEnd - timings.connectStart) || (timings.tlsEnd - timings.dnsEnd),
            tls: timings.tlsEnd - (timings.connectEnd || timings.dnsEnd),
            ttfb: timings.firstByte - timings.start,
            total: timings.end - timings.start
        };

        // Log the detailed timing information
        console.log('Anthropic request timing details:', {
            timings,
            durations
        });

        return {
            content: response.data.content[0].text,
            metadata: {
                model: response.data.model,
                request_id: response.data.id,
                usage: {
                    input_tokens: response.data.usage.input_tokens,
                    output_tokens: response.data.usage.output_tokens,
                    total_tokens: response.data.usage.input_tokens + response.data.usage.output_tokens
                },
                timing: {
                    dns_ms: Math.round(durations.dns),
                    connection_ms: Math.round(durations.connect),
                    tls_ms: Math.round(durations.tls),
                    ttfb_ms: Math.round(durations.ttfb),
                    total_ms: Math.round(durations.total),
                    server_ms: Math.round(durations.ttfb - durations.dns - durations.connect - durations.tls)
                },
                timestamp: new Date().toISOString()
            }
        };
    }
}

function validateEventFields(event, callback) {
    const requiredFields = {
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
        const span = tracer.startSpan('llm.protected', {
            resource: 'llm.protected', // Optional: specify the resource name
          });

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
            span.finish();
            return callback(null, errorResponse, 400);
        }

        // Return both the parsed content and metadata
        callback(null, {
            ...parsedContent,
            _metadata: {
                ...response.metadata,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        // Handle other runtime errors
        const errorResponse = {
            error: {
                type: 'RUNTIME_ERROR',
                message: error.message,
                details: {
                    stack: error.stack?.split('\n')
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