import { getBestAvailableModel, AIModelConfig } from './ai-models';

export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  taskComplexity?: 'simple' | 'moderate' | 'complex';
}

export interface AIResponse {
  content: string;
  model: string;
  cost: number;
  tokens: number;
}

class AIService {
  private async callOllama(model: AIModelConfig, request: AIRequest): Promise<AIResponse> {
    const response = await fetch(`${model.endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model.model,
        prompt: `${request.systemPrompt ? request.systemPrompt + '\n\n' : ''}${request.prompt}`,
        stream: false,
        options: {
          temperature: request.temperature || 0.7,
          num_predict: request.maxTokens || 1000,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.response,
      model: model.name,
      cost: 0, // Free
      tokens: data.response.length / 4, // Rough estimate
    };
  }

  private async callHuggingFace(model: AIModelConfig, request: AIRequest): Promise<AIResponse> {
    const response = await fetch(`${model.endpoint}/${model.model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${model.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `${request.systemPrompt ? request.systemPrompt + '\n\n' : ''}${request.prompt}`,
        parameters: {
          max_new_tokens: request.maxTokens || 1000,
          temperature: request.temperature || 0.7,
          return_full_text: false,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = Array.isArray(data) ? data[0]?.generated_text : data.generated_text;
    const tokens = content.length / 4;
    
    return {
      content,
      model: model.name,
      cost: tokens * model.costPerToken / 1000,
      tokens,
    };
  }

  private async callOpenAI(model: AIModelConfig, request: AIRequest): Promise<AIResponse> {
    const { openai } = await import('./openai');
    
    const completion = await openai.chat.completions.create({
      model: model.model,
      messages: [
        ...(request.systemPrompt ? [{ role: 'system' as const, content: request.systemPrompt }] : []),
        { role: 'user' as const, content: request.prompt }
      ],
      max_tokens: request.maxTokens || 1000,
      temperature: request.temperature || 0.7,
    });

    const content = completion.choices[0]?.message?.content || '';
    const tokens = completion.usage?.total_tokens || 0;

    return {
      content,
      model: model.name,
      cost: tokens * model.costPerToken / 1000,
      tokens,
    };
  }

  private async callGemini(model: AIModelConfig, request: AIRequest): Promise<AIResponse> {
    // Note: You'll need to install @google/generative-ai package
    // npm install @google/generative-ai
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model.model}:generateContent?key=${model.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${request.systemPrompt ? request.systemPrompt + '\n\n' : ''}${request.prompt}`
          }]
        }],
        generationConfig: {
          maxOutputTokens: request.maxTokens || 1000,
          temperature: request.temperature || 0.7,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const tokens = content.length / 4;

    return {
      content,
      model: model.name,
      cost: tokens * model.costPerToken / 1000,
      tokens,
    };
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    const model = await getBestAvailableModel(request.taskComplexity);
    
    if (!model) {
      throw new Error('No AI models available. Please configure at least one AI service.');
    }

    console.log(`🤖 Using ${model.name} (${model.provider}) - Cost: $${model.costPerToken}/1K tokens`);

    try {
      switch (model.provider) {
        case 'ollama':
          return await this.callOllama(model, request);
        case 'huggingface':
          return await this.callHuggingFace(model, request);
        case 'openai':
          return await this.callOpenAI(model, request);
        case 'gemini':
          return await this.callGemini(model, request);
        default:
          throw new Error(`Unsupported AI provider: ${model.provider}`);
      }
    } catch (error) {
      console.error(`Failed to use ${model.name}:`, error);
      
      // Try fallback to next available model
      const allModels = await import('./ai-models').then(m => m.detectAvailableModels());
      const nextModel = allModels.find(m => m.name !== model.name);
      
      if (nextModel) {
        console.log(`🔄 Falling back to ${nextModel.name}`);
        return this.generateResponse({ ...request, taskComplexity: 'simple' });
      }
      
      throw error;
    }
  }

  // Convenience methods for different types of AI tasks
  async generateNeighborhoodInsights(address: string): Promise<string> {
    const response = await this.generateResponse({
      prompt: `Analyze the neighborhood for this address: "${address}"

Please provide a comprehensive neighborhood analysis in the following JSON format:
{
  "vibe": "Brief description of the neighborhood's character and atmosphere (1-2 sentences)",
  "highlights": [
    "Key attraction or feature 1",
    "Key attraction or feature 2", 
    "Key attraction or feature 3"
  ],
  "walkability": "Description of walkability and transportation options",
  "demographics": "Brief description of typical residents and community",
  "safety": "General safety assessment and feel of the area",
  "amenities": [
    "Nearby amenity 1",
    "Nearby amenity 2",
    "Nearby amenity 3"
  ],
  "summary": "2-3 sentence overall summary of why someone would want to live here"
}

Focus on accurate, helpful information about the actual neighborhood. Be positive but realistic.`,
      systemPrompt: 'You are a knowledgeable real estate expert who provides detailed neighborhood analyses. Always respond with valid JSON only.',
      taskComplexity: 'moderate',
      maxTokens: 1000,
    });

    return response.content;
  }

  async generateListingSearch(query: string, listings: any[]): Promise<any[]> {
    const response = await this.generateResponse({
      prompt: `User search query: "${query}"

Available listings: ${JSON.stringify(listings.map(l => ({
  id: l.id,
  title: l.title,
  description: l.description,
  rent: l.rent,
  bedrooms: l.bedrooms,
  bathrooms: l.bathrooms,
  furnished: l.furnished,
  petsAllowed: l.petsAllowed,
  address: l.address
})))}

Return a JSON array of listing IDs ranked by relevance to the search query, with the most relevant first. Consider price, location, amenities, and features mentioned in the query.

Example: ["listing-id-1", "listing-id-2", "listing-id-3"]`,
      systemPrompt: 'You are an AI search engine that understands rental property queries. Return only a JSON array of listing IDs.',
      taskComplexity: 'simple',
      maxTokens: 500,
    });

    try {
      return JSON.parse(response.content);
    } catch {
      // Fallback to original order if parsing fails
      return listings.map(l => l.id);
    }
  }
}

export const aiService = new AIService();
