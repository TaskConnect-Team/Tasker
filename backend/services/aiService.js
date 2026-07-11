// backend/services/aiService.js
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';

// Configuration
const config = {
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-3.1-flash-lite',
  embeddingModel: 'gemini-embedding-001',
  temperature: 0.3,
  topP: 0.9,
};

// Initialize the AI client
const ai = new GoogleGenAI({ apiKey: config.apiKey });


async function retryWithBackoff(apiCall, retries = 3, delay = 1000) {
  try {
    return await apiCall();
  } catch (error) {
    // If it's a 503 Service Unavailable / High Demand or a 429 Rate Limit error, try again
    const isServerOverloaded = error.status === 503 || (error.message && error.message.includes('503'));
    const isRateLimited = error.status === 429;
    
    if ((isServerOverloaded || isRateLimited) && retries > 0) {
      console.warn(`[AI Service] Server overloaded (503/429). Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(apiCall, retries - 1, delay * 2); // Double the wait time next loop
    }
    throw error;
  }
}

// ============================================
// 1. REASONING / GENERATION METHODS
// ============================================

export async function generateStructuredResponse(systemPrompt, userPrompt, options = {}) {
  try {
    const response = await ai.models.generateContent({
      model: config.model,
      contents: [
        { role: 'system', parts: [{ text: systemPrompt }] },
        { role: 'user', parts: [{ text: userPrompt }] },
      ],
      config: {
        temperature: options.temperature || config.temperature,
        topP: options.topP || config.topP,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      throw new Error('Invalid JSON response from AI');
    }
  } catch (error) {
    console.error('AI Generation Error:', error);
    throw new Error(`AI service error: ${error.message}`);
  }
}

export async function generateText(systemPrompt, userPrompt) {
  try {
    const response = await ai.models.generateContent({
      model: config.model,
      contents: [
        { role: 'system', parts: [{ text: systemPrompt }] },
        { role: 'user', parts: [{ text: userPrompt }] },
      ],
      config: {
        temperature: 0.3,
        topP: 0.9,
      },
    });

    return response.text;
  } catch (error) {
    console.error('AI Text Generation Error:', error);
    throw new Error(`AI service error: ${error.message}`);
  }
}

// ============================================
// 2. EMBEDDING METHODS
// ============================================

export async function generateEmbedding(text, dimension = 768) {
  try {
    const response = await ai.models.embedContent({
      model: config.embeddingModel,
      contents: text,
      config: {
        outputDimensionality: dimension,
      },
    });
    
    return response.embeddings[0].values;
  } catch (error) {
    console.error('Embedding Generation Error:', error);
    throw new Error(`Embedding service error: ${error.message}`);
  }
}

export async function generateBatchEmbeddings(texts, dimension = 768) {
  try {
    const responses = await Promise.all(
      texts.map(text => ai.models.embedContent({
        model: config.embeddingModel,
        contents: text,
        config: { outputDimensionality: dimension },
      }))
    );

    return responses.map(r => r.embedding.values);
  } catch (error) {
    console.error('Batch Embedding Error:', error);
    throw new Error(`Batch embedding service error: ${error.message}`);
  }
}

// ============================================
// 3. DOMAIN-SPECIFIC BUSINESS METHODS
// ============================================

export const ALLOWED_SKILLS = [
  'plumbing', 'electrical', 'cleaning', 'carpentry', 'painting',
  'moving', 'gardening', 'tutoring', 'photography', 'delivery',
  'handyman', 'appliance-repair', 'hvac', 'roofing', 'fencing',
  'masonry', 'landscaping', 'pest-control', 'home-inspection',
  'furniture-assembly', 'cooking', 'babysitting', 'pet-care',
  'event-planning', 'graphic-design', 'web-development', 'writing',
  'translation', 'fitness-training', 'music-lessons'
];

export const PRICING_MATRIX = {
  'peshawar': {
    'plumbing': { min: 1500, max: 3500 },
    'electrical': { min: 1000, max: 2500 },
    'cleaning': { min: 800, max: 2000 },
    'carpentry': { min: 1200, max: 3000 },
    'painting': { min: 1000, max: 4000 },
    'moving': { min: 2000, max: 6000 },
    'gardening': { min: 800, max: 2000 },
    'tutoring': { min: 500, max: 1500 },
    'photography': { min: 2000, max: 8000 },
    'delivery': { min: 300, max: 1000 },
    'handyman': { min: 1000, max: 3000 },
    'appliance-repair': { min: 1500, max: 4000 },
    'hvac': { min: 2000, max: 5000 },
    'roofing': { min: 3000, max: 8000 },
    'fencing': { min: 2000, max: 5000 },
    'masonry': { min: 2000, max: 6000 },
    'landscaping': { min: 1500, max: 4000 },
    'pest-control': { min: 1000, max: 3000 },
    'home-inspection': { min: 2000, max: 5000 },
    'furniture-assembly': { min: 800, max: 2000 },
    'cooking': { min: 500, max: 1500 },
    'babysitting': { min: 300, max: 800 },
    'pet-care': { min: 400, max: 1000 },
    'event-planning': { min: 3000, max: 10000 },
    'graphic-design': { min: 1000, max: 5000 },
    'web-development': { min: 2000, max: 10000 },
    'writing': { min: 500, max: 2000 },
    'translation': { min: 500, max: 2000 },
    'fitness-training': { min: 500, max: 1500 },
    'music-lessons': { min: 500, max: 1500 },
  },
  'islamabad': {
    'plumbing': { min: 2000, max: 5000 },
    'electrical': { min: 1500, max: 3500 },
    'cleaning': { min: 1000, max: 2500 },
  },
  'lahore': {
    'plumbing': { min: 1800, max: 4500 },
    'electrical': { min: 1200, max: 3000 },
  },
  'karachi': {
    'plumbing': { min: 2000, max: 5000 },
    'electrical': { min: 1500, max: 3500 },
  },
};

export const FALLBACK_PRICES = {
  'plumbing': { min: 1000, max: 5000 },
  'electrical': { min: 800, max: 4000 },
  'cleaning': { min: 500, max: 2000 },
  'carpentry': { min: 800, max: 3000 },
  'painting': { min: 800, max: 4000 },
  'moving': { min: 1500, max: 6000 },
  'gardening': { min: 500, max: 2000 },
  'tutoring': { min: 300, max: 1500 },
  'photography': { min: 1500, max: 8000 },
  'delivery': { min: 200, max: 1000 },
  'handyman': { min: 800, max: 3000 },
  'appliance-repair': { min: 1000, max: 4000 },
  'hvac': { min: 1500, max: 5000 },
  'roofing': { min: 2000, max: 8000 },
  'fencing': { min: 1500, max: 5000 },
  'masonry': { min: 1500, max: 6000 },
  'landscaping': { min: 1000, max: 4000 },
  'pest-control': { min: 800, max: 3000 },
  'home-inspection': { min: 1500, max: 5000 },
  'furniture-assembly': { min: 500, max: 2000 },
  'cooking': { min: 300, max: 1500 },
  'babysitting': { min: 200, max: 800 },
  'pet-care': { min: 300, max: 1000 },
  'event-planning': { min: 2000, max: 10000 },
  'graphic-design': { min: 800, max: 5000 },
  'web-development': { min: 1500, max: 10000 },
  'writing': { min: 300, max: 2000 },
  'translation': { min: 300, max: 2000 },
  'fitness-training': { min: 300, max: 1500 },
  'music-lessons': { min: 300, max: 1500 },
};

export async function enhanceTask(title, description, category) {
  const systemPrompt = `You are an expert local services copywriter for TaskConnect, a Pakistani task marketplace.

Your ONLY job is to improve task descriptions and suggest relevant skill tags.

IMPORTANT RULES:
1. NEVER add services the user didn't mention
2. NEVER promise specific outcomes (e.g., "guaranteed fix in 2 hours")
3. Keep the tone professional, clear, and factual
4. enhancedDescription MUST be professional scope-of-work language
5. tags MUST be from this exact list: ${ALLOWED_SKILLS.join(', ')}
6. Only suggest tags that are RELEVANT to the task
7. Return ONLY valid JSON, no markdown, no explanation

OUTPUT FORMAT:
{
  "enhancedDescription": "string",
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.85
}`;

  const userPrompt = `Title: ${title}
Category: ${category}
Original Description: ${description}

Improve this description for a professional local services platform.`;

  try {
    const result = await generateStructuredResponse(systemPrompt, userPrompt);
    
    const validTags = result.tags
      .filter(tag => ALLOWED_SKILLS.includes(tag.toLowerCase()))
      .slice(0, 5);
    
    return {
      enhancedDescription: result.enhancedDescription || description,
      tags: validTags.length > 0 ? validTags : [category.toLowerCase()],
      confidence: Math.min(result.confidence || 0.5, 1),
    };
  } catch (error) {
    console.error('Task enhancement failed:', error);
    return {
      enhancedDescription: description,
      tags: [category.toLowerCase()],
      confidence: 0,
    };
  }
}

export async function suggestPrice(city, category, description, urgency = 'normal') {
  const normalizedCity = city.toLowerCase().trim();
  const normalizedCategory = category.toLowerCase().trim();
  
  let priceRange = PRICING_MATRIX[normalizedCity]?.[normalizedCategory];
  let isFallback = false;
  
  if (!priceRange) {
    priceRange = FALLBACK_PRICES[normalizedCategory] || { min: 500, max: 5000 };
    isFallback = true;
  }
  
  const urgencyMultiplier = urgency === 'urgent' ? 1.25 : 1.0;
  const urgencyText = urgency === 'urgent' ? 'URGENT - Same day/within hours' : 'Normal - Standard scheduling';
  
  const systemPrompt = `You are a local services pricing expert for Pakistan.

GROUNDING DATA (USE THIS AS YOUR REFERENCE):
- City: ${city}
- Category: ${category}
- Typical range: ${priceRange.min} - ${priceRange.max} PKR
${isFallback ? '⚠️ This is a fallback estimate for a city not in our database. Please be conservative.' : ''}
- Urgency: ${urgencyText}

IMPORTANT RULES:
1. Base price MUST fall within the grounded range (${priceRange.min}-${priceRange.max} PKR)
2. If URGENT, suggest a price 20-30% higher than normal
3. Adjust within the range based on task complexity described
4. Return price in PKR (whole numbers only, no decimals)
5. Provide a brief, professional rationale
6. Return ONLY valid JSON, no markdown

OUTPUT FORMAT:
{
  "suggestedPrice": 1800,
  "minPrice": 1500,
  "maxPrice": 2200,
  "rationale": "This plumbing repair is moderately complex, requires standard tools, and falls within the average Peshawar range."
}`;

  const userPrompt = `Task Description: ${description}

Suggest a fair market price for this task in ${city}.`;

  try {
    const result = await generateStructuredResponse(systemPrompt, userPrompt);
    
    let price = Math.round(result.suggestedPrice);
    
    if (urgency === 'urgent' && price > 0) {
      price = Math.ceil(price * urgencyMultiplier / 50) * 50;
    }
    
    if (price < priceRange.min) price = priceRange.min;
    if (price > priceRange.max * 1.5) price = priceRange.max * 1.5;
    
    price = Math.ceil(price / 50) * 50;
    
    return {
      suggestedPrice: price,
      minPrice: Math.min(result.minPrice || priceRange.min, price),
      maxPrice: Math.max(result.maxPrice || priceRange.max, price),
      rationale: result.rationale || `Fair market price for ${category} in ${city}`,
      confidence: isFallback ? 0.6 : 0.85,
      isFallback,
    };
  } catch (error) {
    console.error('Price suggestion failed:', error);
    const fallbackPrice = Math.ceil(((priceRange.min + priceRange.max) / 2) / 50) * 50;
    return {
      suggestedPrice: fallbackPrice,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      rationale: `Average market rate for ${category} in ${city}`,
      confidence: 0.5,
      isFallback: true,
    };
  }
}

export async function generateSearchEmbedding(searchText, dimension = 768) {
  try {
    return await generateEmbedding(searchText, dimension);
  } catch (error) {
    console.error('Search embedding failed:', error);
    throw new Error('Failed to generate search embedding');
  }
}

export function prepareTaskerEmbeddingText(tasker) {
  const parts = [
    tasker.name || '',
    tasker.tagline || '',
    tasker.bio || '',
    (tasker.skills || []).join(' '),
    (tasker.services || []).join(' '),
    tasker.city || '',
    tasker.locationLabel || '',
  ];
  return parts.filter(p => p && p.trim().length > 0).join(' ');
}