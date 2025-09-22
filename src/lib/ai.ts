import { GoogleGenerativeAI } from '@google/generative-ai';

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
  const prompt = `You are Helpr's AI assistant. Given rental info, write a clear, attractive listing with a friendly tone. Extract the number of bedrooms from the title and provide Quick Facts. Only flag as scam if there are OBVIOUS red flags (extremely low rent under $100, suspicious language, etc.).

Rental Info:
- Title: ${input.title}
- Address: ${input.address}
- Rent: $${input.rent}/month
- Deposit: ${input.deposit ? `$${input.deposit}` : 'Not specified'}
- Available: ${input.availableFrom}${input.availableTo ? ` to ${input.availableTo}` : ''}
- Furnished: ${input.furnished ? 'Yes' : 'No'}
- Pets: ${input.petsAllowed ? 'Allowed' : 'Not allowed'}

IMPORTANT: Be conservative with scam detection. Normal market-rate rentals should NOT be flagged. Only flag if rent is under $100 or there are clear scam indicators.

Please respond with a JSON object containing:
- title: A revised, catchy, descriptive title (max 60 chars) based on the user's input.
- bedrooms: The number of bedrooms (e.g., 1, 2, 3) extracted from the title. If it's a studio, return 0.
- description: A friendly, detailed description (2-3 paragraphs).
- neighborhood: { vibe: string (e.g., 'Vibrant and Youthful'), highlights: string[] (3-4 key points), summary: string (a short paragraph) }.
- quickFacts: { deposit, furnished, utilities, pets }
- isScam: boolean (true ONLY if obvious red flags)
- scamReasons: array of reasons if flagged as scam (only if isScam is true)`

  try {
    // ** Primary Provider: Google Gemini (Free) **
    if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('fake-key')) {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const cleanedText = text.replace(/```json\n|```/g, '').trim();
      return JSON.parse(cleanedText);
    } else {
      throw new Error('No Gemini API key available');
    }

  } catch (error) {
    console.error('Gemini failed:', (error as Error).message);
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
      isScam: input.rent < 100, // More reasonable threshold - only flag extremely low rents
      scamReasons: input.rent < 100 ? ['Rent suspiciously low'] : undefined
    };
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

    try {
      if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('fake-key')) {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        return text.trim() || `${input.duration} stay, verified email`;
      } else {
        return `${input.duration} stay starting ${input.moveInDate}, verified email`;
      }
    } catch (error) {
      console.error('Gemini failed for application summary:', error);
      return `${input.duration} stay starting ${input.moveInDate}, verified email`;
    }
  } catch (error) {
    console.error('AI summary error:', error)
    return `${input.duration} stay starting ${input.moveInDate}, verified email`
  }
}
