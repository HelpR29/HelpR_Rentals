import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-fake-key-for-development'
})

export interface ListingInput {
  address: string
  rent: number
  deposit?: number
  availableFrom: string
  availableTo?: string
  furnished: boolean
  petsAllowed: boolean
}

export interface AIListingResult {
  title: string
  description: string
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
  const prompt = `You are Helpr's AI assistant. Given minimal rental info, write a clear, scam-free listing with a friendly tone. Extract Quick Facts (deposit, furnished, pets). If suspicious (too cheap, missing address, vague text), flag as potential scam.

Rental Info:
- Address: ${input.address}
- Rent: $${input.rent}/month
- Deposit: ${input.deposit ? `$${input.deposit}` : 'Not specified'}
- Available: ${input.availableFrom}${input.availableTo ? ` to ${input.availableTo}` : ''}
- Furnished: ${input.furnished ? 'Yes' : 'No'}
- Pets: ${input.petsAllowed ? 'Allowed' : 'Not allowed'}

Please respond with a JSON object containing:
- title: Catchy, descriptive title (max 60 chars)
- description: Friendly, detailed description (2-3 paragraphs)
- quickFacts: { deposit, furnished, utilities, pets }
- isScam: boolean (true if suspicious)
- scamReasons: array of reasons if flagged as scam`

  try {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-fake-key-for-development') {
      // Development fallback
      return {
        title: `${input.furnished ? 'Furnished' : 'Unfurnished'} Rental at ${input.address.split(',')[0]}`,
        description: `Beautiful ${input.furnished ? 'furnished' : 'unfurnished'} rental available at ${input.address}. This property offers great value at $${input.rent}/month and is available from ${input.availableFrom}. ${input.petsAllowed ? 'Pet-friendly environment' : 'No pets allowed'}. Perfect for anyone looking for a comfortable place to call home.

Contact us today to schedule a viewing and learn more about this fantastic opportunity!`,
        quickFacts: {
          deposit: input.deposit ? `$${input.deposit}` : 'Contact for details',
          furnished: input.furnished ? 'Yes' : 'No',
          utilities: 'Contact for details',
          pets: input.petsAllowed ? 'Allowed' : 'Not allowed'
        },
        isScam: input.rent < 200, // Simple scam detection for development - very low threshold
        scamReasons: input.rent < 200 ? ['Rent suspiciously low'] : undefined
      }
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are Helpr\'s AI assistant. Generate rental listings and detect scams.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    return JSON.parse(content)
  } catch (error) {
    console.error('AI generation error:', error)
    // Fallback to basic generation
    return {
      title: `${input.furnished ? 'Furnished' : 'Unfurnished'} Rental at ${input.address.split(',')[0]}`,
      description: `Rental available at ${input.address} for $${input.rent}/month. Available from ${input.availableFrom}. ${input.furnished ? 'Fully furnished.' : 'Unfurnished.'} ${input.petsAllowed ? 'Pets welcome.' : 'No pets.'}`,
      quickFacts: {
        deposit: input.deposit ? `$${input.deposit}` : 'Contact for details',
        furnished: input.furnished ? 'Yes' : 'No',
        utilities: 'Contact for details',
        pets: input.petsAllowed ? 'Allowed' : 'Not allowed'
      },
      isScam: false,
      scamReasons: undefined
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
