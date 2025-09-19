import { Twilio } from 'twilio'

// Third-party service configurations
const twilio = new Twilio(
  process.env.TWILIO_ACCOUNT_SID || 'demo_sid',
  process.env.TWILIO_AUTH_TOKEN || 'demo_token'
)

export interface ThirdPartyVerificationResult {
  success: boolean
  confidence: number
  data?: any
  error?: string
  provider: string
  timestamp: Date
}

/**
 * Twilio SMS Verification Service
 */
export class TwilioSMSVerification {
  private serviceSid: string

  constructor() {
    this.serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID || 'demo_service'
  }

  async sendVerificationCode(phoneNumber: string): Promise<ThirdPartyVerificationResult> {
    try {
      if (process.env.NODE_ENV === 'development') {
        // Development mode - simulate SMS sending
        console.log(`📱 SMS Verification Code sent to ${phoneNumber}: 123456`)
        return {
          success: true,
          confidence: 100,
          data: { status: 'pending', sid: 'demo_sid_' + Date.now() },
          provider: 'twilio',
          timestamp: new Date()
        }
      }

      const verification = await twilio.verify.v2
        .services(this.serviceSid)
        .verifications.create({
          to: phoneNumber,
          channel: 'sms'
        })

      return {
        success: true,
        confidence: 100,
        data: verification,
        provider: 'twilio',
        timestamp: new Date()
      }
    } catch (error) {
      console.error('Twilio SMS verification error:', error)
      return {
        success: false,
        confidence: 0,
        error: error instanceof Error ? error.message : 'SMS verification failed',
        provider: 'twilio',
        timestamp: new Date()
      }
    }
  }

  async verifyCode(phoneNumber: string, code: string): Promise<ThirdPartyVerificationResult> {
    try {
      if (process.env.NODE_ENV === 'development') {
        // Development mode - accept 123456 as valid code
        const isValid = code === '123456'
        return {
          success: isValid,
          confidence: isValid ? 100 : 0,
          data: { status: isValid ? 'approved' : 'denied' },
          provider: 'twilio',
          timestamp: new Date()
        }
      }

      const verificationCheck = await twilio.verify.v2
        .services(this.serviceSid)
        .verificationChecks.create({
          to: phoneNumber,
          code: code
        })

      const isValid = verificationCheck.status === 'approved'
      return {
        success: isValid,
        confidence: isValid ? 100 : 0,
        data: verificationCheck,
        provider: 'twilio',
        timestamp: new Date()
      }
    } catch (error) {
      console.error('Twilio code verification error:', error)
      return {
        success: false,
        confidence: 0,
        error: error instanceof Error ? error.message : 'Code verification failed',
        provider: 'twilio',
        timestamp: new Date()
      }
    }
  }
}

/**
 * AWS Textract Document OCR Service
 */
export class AWSTextractService {
  async extractDocumentText(documentBuffer: Buffer, documentType: string): Promise<ThirdPartyVerificationResult> {
    try {
      if (process.env.NODE_ENV === 'development') {
        // Development mode - simulate OCR extraction
        const mockData = this.getMockOCRData(documentType)
        return {
          success: true,
          confidence: 95,
          data: mockData,
          provider: 'aws-textract',
          timestamp: new Date()
        }
      }

      // In production, would use AWS SDK
      // const textract = new AWS.Textract()
      // const result = await textract.analyzeDocument({...}).promise()
      
      return {
        success: false,
        confidence: 0,
        error: 'AWS Textract not configured for production',
        provider: 'aws-textract',
        timestamp: new Date()
      }
    } catch (error) {
      console.error('AWS Textract error:', error)
      return {
        success: false,
        confidence: 0,
        error: error instanceof Error ? error.message : 'OCR extraction failed',
        provider: 'aws-textract',
        timestamp: new Date()
      }
    }
  }

  private getMockOCRData(documentType: string) {
    switch (documentType) {
      case 'id':
        return {
          fullName: 'John Doe',
          dateOfBirth: '1990-01-15',
          documentNumber: 'DL123456789',
          expirationDate: '2028-01-15',
          address: '123 Main St, City, State 12345'
        }
      case 'income':
        return {
          employerName: 'Tech Corp Inc',
          grossPay: '$5,000.00',
          netPay: '$3,800.00',
          payPeriod: 'Bi-weekly',
          yearToDate: '$65,000.00'
        }
      case 'address':
        return {
          accountHolder: 'John Doe',
          serviceAddress: '123 Main St, City, State 12345',
          billDate: '2024-01-15',
          amount: '$125.50',
          utility: 'Electric Company'
        }
      default:
        return { text: 'Extracted document text...' }
    }
  }
}

/**
 * Jumio Identity Verification Service
 */
export class JumioIdentityVerification {
  private apiToken: string
  private apiSecret: string

  constructor() {
    this.apiToken = process.env.JUMIO_API_TOKEN || 'demo_token'
    this.apiSecret = process.env.JUMIO_API_SECRET || 'demo_secret'
  }

  async verifyIdentityDocument(documentData: any): Promise<ThirdPartyVerificationResult> {
    try {
      if (process.env.NODE_ENV === 'development') {
        // Development mode - simulate identity verification
        const confidence = Math.random() * 40 + 60 // 60-100%
        return {
          success: confidence > 75,
          confidence: Math.round(confidence),
          data: {
            verificationStatus: confidence > 75 ? 'APPROVED_VERIFIED' : 'DENIED_FRAUD',
            identityVerification: {
              similarity: confidence > 75 ? 'MATCH' : 'NO_MATCH',
              validity: confidence > 85 ? 'TRUE' : 'FALSE'
            },
            document: {
              type: 'DRIVING_LICENSE',
              country: 'USA',
              extractedData: {
                firstName: 'John',
                lastName: 'Doe',
                dateOfBirth: '1990-01-15'
              }
            }
          },
          provider: 'jumio',
          timestamp: new Date()
        }
      }

      // In production, would make actual Jumio API call
      return {
        success: false,
        confidence: 0,
        error: 'Jumio not configured for production',
        provider: 'jumio',
        timestamp: new Date()
      }
    } catch (error) {
      console.error('Jumio identity verification error:', error)
      return {
        success: false,
        confidence: 0,
        error: error instanceof Error ? error.message : 'Identity verification failed',
        provider: 'jumio',
        timestamp: new Date()
      }
    }
  }
}

/**
 * Plaid Income Verification Service
 */
export class PlaidIncomeVerification {
  private clientId: string
  private secret: string

  constructor() {
    this.clientId = process.env.PLAID_CLIENT_ID || 'demo_client'
    this.secret = process.env.PLAID_SECRET || 'demo_secret'
  }

  async verifyIncome(accessToken: string): Promise<ThirdPartyVerificationResult> {
    try {
      if (process.env.NODE_ENV === 'development') {
        // Development mode - simulate income verification
        return {
          success: true,
          confidence: 90,
          data: {
            income: {
              income_streams: [
                {
                  confidence: 0.95,
                  days: 365,
                  monthly_income: 5000,
                  name: 'SALARY'
                }
              ],
              total_monthly_income: 5000,
              verification_status: 'VERIFIED'
            },
            employment: {
              employer: {
                name: 'Tech Corp Inc'
              },
              status: 'EMPLOYED'
            }
          },
          provider: 'plaid',
          timestamp: new Date()
        }
      }

      // In production, would use Plaid client
      return {
        success: false,
        confidence: 0,
        error: 'Plaid not configured for production',
        provider: 'plaid',
        timestamp: new Date()
      }
    } catch (error) {
      console.error('Plaid income verification error:', error)
      return {
        success: false,
        confidence: 0,
        error: error instanceof Error ? error.message : 'Income verification failed',
        provider: 'plaid',
        timestamp: new Date()
      }
    }
  }
}

/**
 * Checkr Background Check Service
 */
export class CheckrBackgroundVerification {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.CHECKR_API_KEY || 'demo_key'
  }

  async runBackgroundCheck(candidateData: {
    firstName: string
    lastName: string
    email: string
    phone: string
    zipcode: string
    dob: string
    ssn: string
  }): Promise<ThirdPartyVerificationResult> {
    try {
      if (process.env.NODE_ENV === 'development') {
        // Development mode - simulate background check
        const hasIssues = Math.random() < 0.1 // 10% chance of issues
        return {
          success: !hasIssues,
          confidence: hasIssues ? 30 : 95,
          data: {
            status: hasIssues ? 'consider' : 'clear',
            reports: {
              criminal: {
                status: hasIssues ? 'consider' : 'clear',
                records: hasIssues ? [
                  {
                    charge: 'Minor traffic violation',
                    disposition: 'Guilty',
                    date: '2020-03-15'
                  }
                ] : []
              },
              motor_vehicle: {
                status: 'clear',
                violations: []
              }
            }
          },
          provider: 'checkr',
          timestamp: new Date()
        }
      }

      // In production, would use Checkr API
      return {
        success: false,
        confidence: 0,
        error: 'Checkr not configured for production',
        provider: 'checkr',
        timestamp: new Date()
      }
    } catch (error) {
      console.error('Checkr background check error:', error)
      return {
        success: false,
        confidence: 0,
        error: error instanceof Error ? error.message : 'Background check failed',
        provider: 'checkr',
        timestamp: new Date()
      }
    }
  }
}

/**
 * Unified Third-Party Verification Service
 */
export class ThirdPartyVerificationService {
  private twilioSMS: TwilioSMSVerification
  private awsTextract: AWSTextractService
  private jumioIdentity: JumioIdentityVerification
  private plaidIncome: PlaidIncomeVerification
  private checkrBackground: CheckrBackgroundVerification

  constructor() {
    this.twilioSMS = new TwilioSMSVerification()
    this.awsTextract = new AWSTextractService()
    this.jumioIdentity = new JumioIdentityVerification()
    this.plaidIncome = new PlaidIncomeVerification()
    this.checkrBackground = new CheckrBackgroundVerification()
  }

  async verifyPhone(phoneNumber: string, code?: string): Promise<ThirdPartyVerificationResult> {
    if (code) {
      return await this.twilioSMS.verifyCode(phoneNumber, code)
    } else {
      return await this.twilioSMS.sendVerificationCode(phoneNumber)
    }
  }

  async extractDocumentData(documentBuffer: Buffer, documentType: string): Promise<ThirdPartyVerificationResult> {
    return await this.awsTextract.extractDocumentText(documentBuffer, documentType)
  }

  async verifyIdentity(documentData: any): Promise<ThirdPartyVerificationResult> {
    return await this.jumioIdentity.verifyIdentityDocument(documentData)
  }

  async verifyIncome(accessToken: string): Promise<ThirdPartyVerificationResult> {
    return await this.plaidIncome.verifyIncome(accessToken)
  }

  async runBackgroundCheck(candidateData: any): Promise<ThirdPartyVerificationResult> {
    return await this.checkrBackground.runBackgroundCheck(candidateData)
  }

  /**
   * Run comprehensive verification using multiple services
   */
  async runComprehensiveVerification(
    verificationType: string,
    data: any
  ): Promise<{
    primary: ThirdPartyVerificationResult
    secondary?: ThirdPartyVerificationResult
    combined: ThirdPartyVerificationResult
  }> {
    try {
      let primary: ThirdPartyVerificationResult
      let secondary: ThirdPartyVerificationResult | undefined

      switch (verificationType) {
        case 'id':
          primary = await this.verifyIdentity(data)
          if (data.documentBuffer) {
            secondary = await this.extractDocumentData(data.documentBuffer, 'id')
          }
          break

        case 'income':
          primary = await this.verifyIncome(data.accessToken)
          if (data.documentBuffer) {
            secondary = await this.extractDocumentData(data.documentBuffer, 'income')
          }
          break

        case 'background':
          primary = await this.runBackgroundCheck(data)
          break

        case 'phone':
          primary = await this.verifyPhone(data.phoneNumber, data.code)
          break

        default:
          throw new Error(`Unsupported verification type: ${verificationType}`)
      }

      // Combine results from multiple services
      const combinedConfidence = secondary 
        ? Math.round((primary.confidence + secondary.confidence) / 2)
        : primary.confidence

      const combined: ThirdPartyVerificationResult = {
        success: primary.success && (secondary ? secondary.success : true),
        confidence: combinedConfidence,
        data: {
          primary: primary.data,
          secondary: secondary?.data
        },
        provider: `combined-${primary.provider}${secondary ? `-${secondary.provider}` : ''}`,
        timestamp: new Date()
      }

      return { primary, secondary, combined }
    } catch (error) {
      console.error('Comprehensive verification error:', error)
      return {
        primary: {
          success: false,
          confidence: 0,
          error: error instanceof Error ? error.message : 'Verification failed',
          provider: 'unknown',
          timestamp: new Date()
        },
        combined: {
          success: false,
          confidence: 0,
          error: error instanceof Error ? error.message : 'Verification failed',
          provider: 'combined',
          timestamp: new Date()
        }
      }
    }
  }
}

// Export singleton instance
export const thirdPartyVerification = new ThirdPartyVerificationService()
