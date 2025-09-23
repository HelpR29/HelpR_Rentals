import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from './prisma'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'fake-key')

export interface PropertyManagementTask {
  id: string
  type: 'screening' | 'lease_generation' | 'maintenance' | 'inspection' | 'dispute_resolution' | 'rent_collection'
  status: 'pending' | 'in_progress' | 'completed' | 'escalated'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  listingId?: string
  tenantId?: string
  hostId?: string
  data: Record<string, unknown>
  aiRecommendations?: string[]
  createdAt: Date
  completedAt?: Date
}

export interface LeaseTemplate {
  id: string
  name: string
  type: 'residential' | 'commercial' | 'short_term'
  jurisdiction: 'manitoba' | 'canada'
  template: string
  variables: string[]
  aiGenerated: boolean
}

export class AIPropertyManager {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' })

  // 🏠 TENANT SCREENING WITH AI
  async screenTenant(applicationId: string): Promise<{
    score: number
    recommendation: 'approve' | 'reject' | 'review'
    reasons: string[]
    riskFactors: string[]
  }> {
    try {
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          applicant: true,
          listing: true
        }
      })

      if (!application) throw new Error('Application not found')

      const prompt = `
        As an AI property manager, analyze this rental application:
        
        Applicant: ${application.applicant.email}
        Monthly Income: Not provided (field not in schema)
        Employment: Not provided (field not in schema)
        References: Not provided (field not in schema)
        Rent Amount: $${application.listing.rent}
        
        Provide a comprehensive screening analysis including:
        1. Credit risk assessment
        2. Income-to-rent ratio analysis
        3. Employment stability
        4. Reference quality
        5. Overall recommendation
        
        Format as JSON with score (0-100), recommendation, reasons, and riskFactors.
      `

      const result = await this.model.generateContent(prompt)
      const analysis = JSON.parse(result.response.text())

      // Store screening result in aiSummary field (closest available field)
      await prisma.application.update({
        where: { id: applicationId },
        data: {
          aiSummary: JSON.stringify({
            score: analysis.score,
            analysis: analysis
          })
        }
      })

      return analysis
    } catch (error) {
      console.error('AI tenant screening error:', error)
      throw new Error('Failed to screen tenant')
    }
  }

  // 📄 SMART LEASE GENERATION
  async generateLease(listingId: string, tenantId: string, customTerms?: Record<string, unknown>): Promise<{
    leaseContent: string
    keyTerms: string[]
    aiSuggestions: string[]
  }> {
    try {
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        include: { owner: true }
      })

      const tenant = await prisma.user.findUnique({
        where: { id: tenantId }
      })

      if (!listing || !tenant) throw new Error('Listing or tenant not found')

      const prompt = `
        Generate a comprehensive residential lease agreement for Manitoba, Canada:
        
        Property: ${listing.address}
        Monthly Rent: $${listing.rent}
        Security Deposit: $${listing.deposit || listing.rent}
        Landlord: ${listing.owner.email}
        Tenant: ${tenant.email}
        
        Include:
        1. Standard Manitoba residential tenancy terms
        2. Property-specific clauses (furnished: ${listing.furnished}, pets: ${listing.petsAllowed})
        3. Utilities and maintenance responsibilities
        4. Legal compliance with Manitoba Residential Tenancies Act
        5. Move-in/move-out procedures
        
        Custom terms: ${JSON.stringify(customTerms || {})}
        
        Provide both the lease content and key terms summary.
      `

      const result = await this.model.generateContent(prompt)
      const response = result.response.text()

      // Parse AI response (assuming structured format)
      const leaseData = {
        leaseContent: response,
        keyTerms: this.extractKeyTerms(response),
        aiSuggestions: this.generateLeaseSuggestions(listing, tenant)
      }

      return leaseData
    } catch (error) {
      console.error('AI lease generation error:', error)
      throw new Error('Failed to generate lease')
    }
  }

  // 🔧 MAINTENANCE REQUEST PROCESSING
  async processMaintenanceRequest(requestData: {
    description: string
    urgency: string
    photos?: string[]
    tenantId: string
    listingId: string
  }): Promise<{
    category: string
    estimatedCost: number
    urgencyLevel: 'low' | 'medium' | 'high' | 'emergency'
    recommendedActions: string[]
    contractorSuggestions: string[]
  }> {
    const prompt = `
      Analyze this maintenance request:
      
      Description: ${requestData.description}
      Reported Urgency: ${requestData.urgency}
      Photos: ${requestData.photos?.length || 0} attached
      
      As an AI property manager, provide:
      1. Maintenance category classification
      2. Estimated cost range
      3. True urgency level assessment
      4. Step-by-step recommended actions
      5. Type of contractor needed
      
      Consider Winnipeg market rates and Manitoba tenant rights.
    `

    const result = await this.model.generateContent(prompt)
    return JSON.parse(result.response.text())
  }

  // ⚖️ DISPUTE RESOLUTION ASSISTANCE
  async mediateDispute(disputeData: {
    type: 'rent' | 'maintenance' | 'noise' | 'damage' | 'other'
    description: string
    tenantClaim: string
    hostResponse: string
    evidence?: string[]
  }): Promise<{
    analysis: string
    recommendation: string
    legalReferences: string[]
    nextSteps: string[]
    escalationNeeded: boolean
  }> {
    const prompt = `
      As an AI mediator for rental disputes in Manitoba:
      
      Dispute Type: ${disputeData.type}
      Description: ${disputeData.description}
      Tenant Position: ${disputeData.tenantClaim}
      Host Position: ${disputeData.hostResponse}
      
      Provide:
      1. Neutral analysis of the situation
      2. Fair resolution recommendation
      3. Relevant Manitoba Residential Tenancies Act references
      4. Next steps for both parties
      5. Whether escalation to RTB is needed
    `

    const result = await this.model.generateContent(prompt)
    return JSON.parse(result.response.text())
  }

  // 💰 RENT OPTIMIZATION ANALYSIS
  async analyzeRentOptimization(listingId: string): Promise<{
    currentRent: number
    suggestedRent: number
    marketAnalysis: string
    competitorData: string[]
    adjustmentReasons: string[]
  }> {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId }
    })

    if (!listing) throw new Error('Listing not found')

    const prompt = `
      Analyze rent optimization for this Winnipeg property:
      
      Current Rent: $${listing.rent}
      Address: ${listing.address}
      Bedrooms: ${listing.bedrooms}
      Furnished: ${listing.furnished}
      
      Provide market analysis and rent recommendation based on:
      1. Winnipeg rental market trends
      2. Neighborhood analysis
      3. Property features comparison
      4. Seasonal factors
      5. Vacancy rates
    `

    const result = await this.model.generateContent(prompt)
    return JSON.parse(result.response.text())
  }

  // Helper methods
  private extractKeyTerms(leaseContent: string): string[] {
    // Extract key terms from lease content
    const terms = []
    if (leaseContent.includes('rent')) terms.push('Monthly rent payment')
    if (leaseContent.includes('deposit')) terms.push('Security deposit')
    if (leaseContent.includes('utilities')) terms.push('Utility responsibilities')
    if (leaseContent.includes('pets')) terms.push('Pet policy')
    if (leaseContent.includes('maintenance')) terms.push('Maintenance obligations')
    return terms
  }

  private generateLeaseSuggestions(listing: any, tenant: any): string[] {
    const suggestions = []
    if (listing.furnished) suggestions.push('Consider furniture inventory checklist')
    if (listing.petsAllowed) suggestions.push('Include pet damage deposit clause')
    if (listing.rent > 1500) suggestions.push('Consider rent increase limitations')
    return suggestions
  }
}

export const aiPropertyManager = new AIPropertyManager()
