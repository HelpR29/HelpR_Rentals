import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-fake-key-for-development'
})

export interface VerificationAnalysis {
  isValid: boolean
  confidence: number // 0-100
  riskFactors: string[]
  recommendation: 'approve' | 'reject' | 'manual_review'
  reasoning: string
  extractedData?: any
}

export interface DocumentAnalysis {
  documentType: string
  isAuthentic: boolean
  dataExtracted: any
  inconsistencies: string[]
  confidence: number
}

/**
 * AI-powered verification document analysis
 */
export async function analyzeVerificationDocument(
  documentType: 'id' | 'address' | 'income' | 'background',
  documentData: any,
  userData: any
): Promise<VerificationAnalysis> {
  try {
    const prompt = createVerificationPrompt(documentType, documentData, userData)
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert document verification AI for a rental platform. Your job is to analyze verification documents and determine their authenticity and validity. 

You should:
1. Check document authenticity and format
2. Extract and validate key information
3. Compare extracted data with user-provided information
4. Identify potential red flags or inconsistencies
5. Provide a confidence score and recommendation

Respond with a JSON object containing:
- isValid: boolean
- confidence: number (0-100)
- riskFactors: string[] (list of concerns)
- recommendation: 'approve' | 'reject' | 'manual_review'
- reasoning: string (detailed explanation)
- extractedData: object (key information from document)`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for consistent analysis
      response_format: { type: "json_object" }
    })

    const analysis = JSON.parse(response.choices[0].message.content || '{}')
    
    // Apply business rules and confidence thresholds
    return applyBusinessRules(analysis, documentType)

  } catch (error) {
    console.error('AI verification analysis error:', error)
    
    // Fallback to manual review on AI failure
    return {
      isValid: false,
      confidence: 0,
      riskFactors: ['AI analysis failed'],
      recommendation: 'manual_review',
      reasoning: 'AI analysis system encountered an error. Manual review required.',
      extractedData: null
    }
  }
}

/**
 * Create verification prompt based on document type
 */
function createVerificationPrompt(
  documentType: string,
  documentData: any,
  userData: any
): string {
  const basePrompt = `
Document Type: ${documentType}
User Information: ${JSON.stringify(userData, null, 2)}
Document Data: ${JSON.stringify(documentData, null, 2)}

Please analyze this ${documentType} verification document and provide a detailed assessment.
`

  switch (documentType) {
    case 'id':
      return basePrompt + `
Focus on:
- Document format and authenticity markers
- Photo quality and tampering signs
- Information consistency (name, DOB, address)
- Expiration date validity
- Security features (holograms, watermarks, etc.)
`

    case 'address':
      return basePrompt + `
Focus on:
- Document type (utility bill, bank statement, lease)
- Address matching user-provided address
- Date recency (within last 3 months)
- Official letterhead and formatting
- Account holder name matching user
`

    case 'income':
      return basePrompt + `
Focus on:
- Pay stub authenticity and format
- Income amounts and consistency
- Employer information verification
- Tax document validity
- Employment duration and stability
`

    case 'background':
      return basePrompt + `
Focus on:
- Background check report authenticity
- Criminal history assessment
- Credit score evaluation
- Identity verification consistency
- Report date and validity period
`

    default:
      return basePrompt
  }
}

/**
 * Apply business rules and confidence thresholds
 */
function applyBusinessRules(
  analysis: any,
  documentType: string
): VerificationAnalysis {
  const confidenceThresholds = {
    auto_approve: 85,
    manual_review: 60,
    auto_reject: 30
  }

  let recommendation: 'approve' | 'reject' | 'manual_review' = analysis.recommendation

  // Override recommendation based on confidence score
  if (analysis.confidence >= confidenceThresholds.auto_approve) {
    recommendation = 'approve'
  } else if (analysis.confidence <= confidenceThresholds.auto_reject) {
    recommendation = 'reject'
  } else if (analysis.confidence <= confidenceThresholds.manual_review) {
    recommendation = 'manual_review'
  }

  // Additional business rules
  const riskFactors = [...(analysis.riskFactors || [])]

  // Document-specific rules
  if (documentType === 'id') {
    if (analysis.extractedData?.expired) {
      riskFactors.push('Document is expired')
      recommendation = 'reject'
    }
  }

  if (documentType === 'income') {
    const reportedIncome = analysis.extractedData?.monthlyIncome
    const minimumIncome = 2000 // Example minimum
    
    if (reportedIncome && reportedIncome < minimumIncome) {
      riskFactors.push(`Income below minimum requirement (${minimumIncome})`)
      recommendation = 'reject'
    }
  }

  return {
    isValid: analysis.isValid,
    confidence: analysis.confidence,
    riskFactors,
    recommendation,
    reasoning: analysis.reasoning,
    extractedData: analysis.extractedData
  }
}

/**
 * Batch process multiple verification documents
 */
export async function batchAnalyzeVerifications(
  verifications: Array<{
    userId: string
    documentType: string
    documentData: any
    userData: any
  }>
): Promise<Array<VerificationAnalysis & { userId: string }>> {
  const results = await Promise.all(
    verifications.map(async (verification) => {
      const analysis = await analyzeVerificationDocument(
        verification.documentType as any,
        verification.documentData,
        verification.userData
      )
      
      return {
        ...analysis,
        userId: verification.userId
      }
    })
  )

  return results
}

/**
 * Generate verification summary report
 */
export async function generateVerificationReport(
  userId: string,
  verifications: any[]
): Promise<{
  overallScore: number
  trustLevel: 'high' | 'medium' | 'low'
  recommendations: string[]
  summary: string
}> {
  try {
    const prompt = `
User ID: ${userId}
Verification Results: ${JSON.stringify(verifications, null, 2)}

Based on these verification results, provide an overall assessment of this user's trustworthiness for a rental platform. Consider:
1. Completeness of verifications
2. Confidence scores across different document types
3. Any risk factors or inconsistencies
4. Overall reliability as a tenant/host

Provide a JSON response with:
- overallScore: number (0-100)
- trustLevel: 'high' | 'medium' | 'low'
- recommendations: string[] (actions to improve trust)
- summary: string (brief assessment)
`

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert risk assessment AI for rental platforms. Provide objective, fair assessments based on verification data."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    })

    return JSON.parse(response.choices[0].message.content || '{}')

  } catch (error) {
    console.error('Verification report generation error:', error)
    
    return {
      overallScore: 50,
      trustLevel: 'medium' as const,
      recommendations: ['Complete additional verifications'],
      summary: 'Unable to generate detailed assessment. Manual review recommended.'
    }
  }
}

/**
 * Real-time fraud detection
 */
export async function detectFraud(
  documentData: any,
  userHistory: any,
  deviceInfo: any
): Promise<{
  isFraudulent: boolean
  riskScore: number
  fraudIndicators: string[]
}> {
  try {
    const prompt = `
Document Data: ${JSON.stringify(documentData, null, 2)}
User History: ${JSON.stringify(userHistory, null, 2)}
Device Info: ${JSON.stringify(deviceInfo, null, 2)}

Analyze this data for potential fraud indicators:
1. Document manipulation or forgery
2. Suspicious user behavior patterns
3. Device/location inconsistencies
4. Rapid or unusual submission patterns
5. Data inconsistencies across submissions

Provide a JSON response with:
- isFraudulent: boolean
- riskScore: number (0-100, higher = more risky)
- fraudIndicators: string[] (specific concerns)
`

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a fraud detection AI. Be thorough but fair in your analysis."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    })

    return JSON.parse(response.choices[0].message.content || '{}')

  } catch (error) {
    console.error('Fraud detection error:', error)
    
    return {
      isFraudulent: false,
      riskScore: 50,
      fraudIndicators: ['Analysis failed - manual review required']
    }
  }
}
