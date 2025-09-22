// AI Model Configuration with Cost-Effective Hierarchy
// Priority: Free/Cheap models first, then premium models as fallback

export interface AIModelConfig {
  name: string;
  provider: 'ollama' | 'huggingface' | 'openai' | 'gemini';
  model: string;
  apiKey?: string;
  endpoint?: string;
  costPerToken: number; // in USD per 1000 tokens
  maxTokens: number;
  available: boolean;
}

export const AI_MODELS: AIModelConfig[] = [
  // FREE TIER - Local/Self-hosted models (highest priority)
  {
    name: 'Ollama Llama 3.2',
    provider: 'ollama',
    model: 'llama3.2',
    endpoint: 'http://localhost:11434',
    costPerToken: 0, // FREE - runs locally
    maxTokens: 4096,
    available: false, // Will be detected at runtime
  },
  
  // VERY CHEAP TIER - Hugging Face Inference API
  {
    name: 'Hugging Face Llama 2',
    provider: 'huggingface',
    model: 'meta-llama/Llama-2-7b-chat-hf',
    apiKey: process.env.HUGGINGFACE_API_KEY,
    endpoint: 'https://api-inference.huggingface.co/models',
    costPerToken: 0.0002, // Very cheap
    maxTokens: 2048,
    available: !!process.env.HUGGINGFACE_API_KEY,
  },
  
  // MODERATE TIER - OpenAI GPT-3.5 (cheaper than GPT-4)
  {
    name: 'OpenAI GPT-3.5 Turbo',
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    apiKey: process.env.OPENAI_API_KEY,
    costPerToken: 0.002, // $2 per 1M tokens
    maxTokens: 4096,
    available: !!process.env.OPENAI_API_KEY,
  },
  
  // PREMIUM TIER - OpenAI GPT-4 (fallback for complex tasks)
  {
    name: 'OpenAI GPT-4',
    provider: 'openai',
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY,
    costPerToken: 0.03, // $30 per 1M tokens
    maxTokens: 8192,
    available: !!process.env.OPENAI_API_KEY,
  },
  
  // PREMIUM TIER - Google Gemini (alternative to GPT-4)
  {
    name: 'Google Gemini Pro',
    provider: 'gemini',
    model: 'gemini-pro',
    apiKey: process.env.GEMINI_API_KEY,
    costPerToken: 0.0005, // Cheaper than GPT-4
    maxTokens: 8192,
    available: !!process.env.GEMINI_API_KEY,
  },
];

export async function detectAvailableModels(): Promise<AIModelConfig[]> {
  const availableModels: AIModelConfig[] = [];
  
  for (const model of AI_MODELS) {
    try {
      if (model.provider === 'ollama') {
        // Check if Ollama is running locally
        const response = await fetch(`${model.endpoint}/api/tags`, {
          method: 'GET',
          signal: AbortSignal.timeout(2000), // 2 second timeout
        });
        if (response.ok) {
          const data = await response.json();
          const hasModel = data.models?.some((m: any) => m.name.includes(model.model));
          if (hasModel) {
            availableModels.push({ ...model, available: true });
          }
        }
      } else if (model.available) {
        // For API-based models, check if API key is available
        availableModels.push(model);
      }
    } catch (error) {
      // Model not available, skip
      console.log(`Model ${model.name} not available:`, error);
    }
  }
  
  return availableModels.sort((a, b) => a.costPerToken - b.costPerToken);
}

export async function getBestAvailableModel(taskComplexity: 'simple' | 'moderate' | 'complex' = 'moderate'): Promise<AIModelConfig | null> {
  const availableModels = await detectAvailableModels();
  
  if (availableModels.length === 0) {
    return null;
  }
  
  // For simple tasks, use the cheapest model
  if (taskComplexity === 'simple') {
    return availableModels[0];
  }
  
  // For moderate tasks, use a mid-tier model if available
  if (taskComplexity === 'moderate') {
    const midTierModel = availableModels.find(m => 
      m.costPerToken > 0 && m.costPerToken < 0.01
    );
    return midTierModel || availableModels[0];
  }
  
  // For complex tasks, prefer premium models but fall back to cheaper ones
  if (taskComplexity === 'complex') {
    const premiumModel = availableModels.find(m => 
      m.maxTokens >= 4096 && (m.provider === 'openai' || m.provider === 'gemini')
    );
    return premiumModel || availableModels[availableModels.length - 1];
  }
  
  return availableModels[0];
}
