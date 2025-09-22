import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-fake-key-for-development',
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'fake-gemini-key');

export interface ListingInput {
  title: string; // Add title to the input
  address: string
  rent: number
  deposit?: number
  availableFrom: string
  availableTo?: string
  furnished: boolean
  petsAllowed: boolean
}

export interface AIListingResult {
  title: string;
  bedrooms?: number;
  description: string;
  neighborhood: {
    vibe: string;
    highlights: string[];
    summary: string;
  };
  quickFacts: {
    deposit: string
    furnished: string
    utilities: string
    pets: string
  }
  isScam: boolean
  scamReasons?: string[]
}

export async function generateListingContent(input: ListingInput): Promise<AIListingResult> {
  const prompt = `You are Helpr's AI assistant. Given minimal rental info, write a clear, scam-free listing with a friendly tone. Extract the number of bedrooms from the title and provide Quick Facts. If suspicious, flag as a potential scam.

Rental Info:
- Title: ${input.title}
- Address: ${input.address}
- Rent: $${input.rent}/month
- Deposit: ${input.deposit ? `$${input.deposit}` : 'Not specified'}
- Available: ${input.availableFrom}${input.availableTo ? ` to ${input.availableTo}` : ''}
- Furnished: ${input.furnished ? 'Yes' : 'No'}
- Pets: ${input.petsAllowed ? 'Allowed' : 'Not allowed'}

Please respond with a JSON object containing:
- title: A revised, catchy, descriptive title (max 60 chars) based on the user's input.
- bedrooms: The number of bedrooms (e.g., 1, 2, 3) extracted from the title. If it's a studio, return 0.
- description: A friendly, detailed description (2-3 paragraphs).
- neighborhood: { vibe: string (e.g., 'Vibrant and Youthful'), highlights: string[] (3-4 key points), summary: string (a short paragraph) }.
- quickFacts: { deposit, furnished, utilities, pets }
- isScam: boolean (true if suspicious)
- scamReasons: array of reasons if flagged as scam`

    try {
    // ** Primary Provider: OpenAI **
    console.log('Attempting to generate content with OpenAI...');
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('fake-key')) {
      throw new Error('OpenAI key not available, failing over to Gemini.');
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are Helpr\'s AI assistant. Generate rental listings and detect scams.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(content);

  } catch (error) {
    console.warn('OpenAI failed:', (error as Error).message);
    console.log('Attempting fallback to Google Gemini Pro...');

    // ** Secondary Provider: Google Gemini **
    try {
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('fake-key')) {
        throw new Error('Gemini API key not available.');
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const cleanedText = text.replace(/```json\n|```/g, '').trim();
      return JSON.parse(cleanedText);

    } catch (geminiError) {
      console.error('Gemini fallback also failed:', (geminiError as Error).message);
      // Final fallback to basic generation
      return {
        title: input.title || `${input.furnished ? 'Furnished' : 'Unfurnished'} Rental at ${input.address.split(',')[0]}`,
        bedrooms: parseInt(input.title?.match(/(\d+)/)?.[0] || '1'),
        description: `Beautiful ${input.furnished ? 'furnished' : 'unfurnished'} rental available at ${input.address}.`,
        neighborhood: {
          vibe: 'Lively Urban Area',
          highlights: ['Close to public transit', 'Excellent restaurants nearby', 'Vibrant nightlife'],
          summary: 'A bustling neighborhood known for its convenient location and exciting atmosphere.'
        },
        quickFacts: {
          deposit: input.deposit ? `$${input.deposit}` : 'Contact for details',
          furnished: input.furnished ? 'Yes' : 'No',
          utilities: 'Contact for details',
          pets: input.petsAllowed ? 'Allowed' : 'Not allowed'
        },
        isScam: input.rent < 200,
        scamReasons: input.rent < 200 ? ['Rent suspiciously low'] : undefined
      };
    }
  }
}

export interface ApplicationInput {
  moveInDate: string
  duration: string
  reason: string
  applicantEmail: string
}

export async function generateApplicationSummary(input: ApplicationInput): Promise<string> {
  const prompt = `Summarize applicant info for landlord in one line. Example: 'Student, 4-month stay, verified email, no pets.'

Application Details:
- Move-in Date: ${input.moveInDate}
- Duration: ${input.duration}
- Reason: ${input.reason}
- Email: ${input.applicantEmail}

Provide a concise one-line summary for the landlord:`

  try {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-fake-key-for-development') {
      // Development fallback
      return `${input.duration} stay starting ${input.moveInDate}, verified email`
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are Helpr\'s AI assistant. Create concise applicant summaries for landlords.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 100
    })

    return completion.choices[0]?.message?.content?.trim() || `${input.duration} stay, verified email`
  } catch (error) {
    console.error('AI summary error:', error)
    return `${input.duration} stay starting ${input.moveInDate}, verified email`
  }
}
