/**
 * GDPR/Privacy Compliance System
 * Handles data protection, consent management, and privacy regulations
 */

export interface ConsentRecord {
  id: string
  userId: string
  consentType: 'data_processing' | 'marketing' | 'analytics' | 'third_party_sharing' | 'verification_data'
  granted: boolean
  timestamp: Date
  ipAddress: string
  userAgent: string
  version: string // Consent version
  expiresAt?: Date
  withdrawnAt?: Date
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests'
}

export interface DataProcessingRecord {
  id: string
  userId: string
  dataType: 'personal' | 'sensitive' | 'verification' | 'financial' | 'biometric'
  purpose: string
  legalBasis: string
  dataCategories: string[]
  retentionPeriod: number // days
  processingDate: Date
  deletionDate?: Date
  thirdPartySharing: boolean
  thirdParties?: string[]
}

export interface DataSubjectRights {
  access: boolean // Right to access personal data
  rectification: boolean // Right to correct inaccurate data
  erasure: boolean // Right to be forgotten
  restriction: boolean // Right to restrict processing
  portability: boolean // Right to data portability
  objection: boolean // Right to object to processing
  withdrawConsent: boolean // Right to withdraw consent
}

export interface PrivacySettings {
  userId: string
  dataMinimization: boolean
  anonymization: boolean
  pseudonymization: boolean
  encryption: boolean
  accessLogging: boolean
  dataRetentionDays: number
  thirdPartySharing: boolean
  marketingCommunications: boolean
  analyticsTracking: boolean
  updatedAt: Date
}

export interface DataBreachRecord {
  id: string
  incidentDate: Date
  discoveredDate: Date
  affectedUsers: number
  dataTypes: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  containmentActions: string[]
  notificationRequired: boolean
  notificationDate?: Date
  regulatorNotified: boolean
  status: 'investigating' | 'contained' | 'resolved'
}

/**
 * Consent Management Service
 */
// In-memory storage for development (in production, use database)
const consentStorage: { [userId: string]: ConsentRecord[] } = {}

export class ConsentManagementService {
  async recordConsent(
    userId: string,
    consentType: ConsentRecord['consentType'],
    granted: boolean,
    metadata: {
      ipAddress: string
      userAgent: string
      legalBasis: ConsentRecord['legalBasis']
      version?: string
    }
  ): Promise<ConsentRecord> {
    const consent: ConsentRecord = {
      id: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      consentType,
      granted,
      timestamp: new Date(),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      version: metadata.version || '1.0',
      legalBasis: metadata.legalBasis
    }

    // Set expiration for consent (GDPR recommends reviewing consent every 2 years)
    if (granted && consentType === 'marketing') {
      consent.expiresAt = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000) // 2 years
    }

    // Store in memory for development
    if (!consentStorage[userId]) {
      consentStorage[userId] = []
    }
    
    // Remove any existing consent for this type
    consentStorage[userId] = consentStorage[userId].filter(c => c.consentType !== consentType)
    
    // Add the new consent record
    consentStorage[userId].push(consent)
    
    console.log('Consent recorded:', consent)
    
    return consent
  }

  async withdrawConsent(
    userId: string,
    consentType: ConsentRecord['consentType']
  ): Promise<boolean> {
    try {
      // Create withdrawal record
      const withdrawalRecord: ConsentRecord = {
        id: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        consentType,
        granted: false,
        withdrawnAt: new Date(),
        timestamp: new Date(),
        ipAddress: '192.168.1.1',
        userAgent: 'Browser',
        version: '1.0',
        legalBasis: 'consent'
      }

      // Store in memory for development
      if (!consentStorage[userId]) {
        consentStorage[userId] = []
      }
      
      // Remove any existing consent for this type
      consentStorage[userId] = consentStorage[userId].filter(c => c.consentType !== consentType)
      
      // Add the withdrawal record
      consentStorage[userId].push(withdrawalRecord)

      console.log('Consent withdrawn:', withdrawalRecord)
      
      // Trigger data processing changes
      await this.processConsentWithdrawal(userId, consentType)
      
      return true
    } catch (error) {
      console.error('Consent withdrawal failed:', error)
      return false
    }
  }

  async getConsentStatus(
    userId: string,
    consentType?: ConsentRecord['consentType']
  ): Promise<ConsentRecord[]> {
    // Get stored consents or initialize with defaults
    if (!consentStorage[userId]) {
      // Initialize with default consents for first-time users
      consentStorage[userId] = [
        {
          id: 'consent_1',
          userId,
          consentType: 'data_processing',
          granted: true,
          timestamp: new Date(),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          version: '1.0',
          legalBasis: 'consent'
        },
        {
          id: 'consent_2',
          userId,
          consentType: 'marketing',
          granted: false,
          timestamp: new Date(),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          version: '1.0',
          legalBasis: 'consent'
        },
        {
          id: 'consent_3',
          userId,
          consentType: 'analytics',
          granted: false,
          timestamp: new Date(),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          version: '1.0',
          legalBasis: 'consent'
        },
        {
          id: 'consent_4',
          userId,
          consentType: 'third_party_sharing',
          granted: false,
          timestamp: new Date(),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          version: '1.0',
          legalBasis: 'consent'
        }
      ]
    }

    const userConsents = consentStorage[userId] || []
    
    return consentType 
      ? userConsents.filter(c => c.consentType === consentType)
      : userConsents
  }

  private async processConsentWithdrawal(
    userId: string,
    consentType: ConsentRecord['consentType']
  ): Promise<void> {
    switch (consentType) {
      case 'marketing':
        // Remove from marketing lists
        await this.removeFromMarketing(userId)
        break
      case 'analytics':
        // Stop analytics tracking
        await this.disableAnalytics(userId)
        break
      case 'third_party_sharing':
        // Stop sharing data with third parties
        await this.stopThirdPartySharing(userId)
        break
      case 'verification_data':
        // Handle verification data withdrawal (complex - may require manual review)
        await this.handleVerificationDataWithdrawal(userId)
        break
    }
  }

  private async removeFromMarketing(userId: string): Promise<void> {
    console.log(`Removing user ${userId} from marketing communications`)
  }

  private async disableAnalytics(userId: string): Promise<void> {
    console.log(`Disabling analytics tracking for user ${userId}`)
  }

  private async stopThirdPartySharing(userId: string): Promise<void> {
    console.log(`Stopping third-party data sharing for user ${userId}`)
  }

  private async handleVerificationDataWithdrawal(userId: string): Promise<void> {
    console.log(`Handling verification data withdrawal for user ${userId}`)
    // This may require manual review as it could affect platform functionality
  }
}

/**
 * Data Subject Rights Service
 */
export class DataSubjectRightsService {
  async processDataAccessRequest(userId: string): Promise<{
    personalData: any
    processingActivities: DataProcessingRecord[]
    consentRecords: ConsentRecord[]
    retentionInfo: any
  }> {
    // Compile all personal data
    const personalData = await this.compilePersonalData(userId)
    const processingActivities = await this.getProcessingActivities(userId)
    const consentRecords = await this.getConsentHistory(userId)
    const retentionInfo = await this.getRetentionInfo(userId)

    return {
      personalData,
      processingActivities,
      consentRecords,
      retentionInfo
    }
  }

  async processDataPortabilityRequest(userId: string): Promise<{
    data: any
    format: 'json' | 'csv' | 'xml'
    filename: string
  }> {
    const userData = await this.compilePortableData(userId)
    
    return {
      data: userData,
      format: 'json',
      filename: `user_data_${userId}_${new Date().toISOString().split('T')[0]}.json`
    }
  }

  async processErasureRequest(
    userId: string,
    reason: string,
    exceptions?: string[]
  ): Promise<{
    canErase: boolean
    erasedData: string[]
    retainedData: string[]
    reasons: string[]
  }> {
    const erasureAnalysis = await this.analyzeErasureRequest(userId, exceptions)
    
    if (erasureAnalysis.canErase) {
      await this.performDataErasure(userId, erasureAnalysis.erasedData)
    }

    return erasureAnalysis
  }

  async processRectificationRequest(
    userId: string,
    corrections: { field: string; oldValue: any; newValue: any }[]
  ): Promise<{
    updated: string[]
    failed: string[]
    reasons: string[]
  }> {
    const results = {
      updated: [] as string[],
      failed: [] as string[],
      reasons: [] as string[]
    }

    for (const correction of corrections) {
      try {
        await this.updatePersonalData(userId, correction.field, correction.newValue)
        results.updated.push(correction.field)
      } catch (error) {
        results.failed.push(correction.field)
        results.reasons.push(`${correction.field}: ${error instanceof Error ? error.message : 'Update failed'}`)
      }
    }

    return results
  }

  private async compilePersonalData(userId: string): Promise<any> {
    // In production, would query all relevant tables
    return {
      profile: {
        id: userId,
        email: 'user@example.com',
        name: 'John Doe',
        phone: '+1234567890',
        createdAt: new Date()
      },
      verificationData: {
        emailVerified: true,
        phoneVerified: true,
        documentsSubmitted: ['id', 'address']
      },
      activityLog: [
        { action: 'login', timestamp: new Date(), ipAddress: '192.168.1.1' },
        { action: 'verification_submitted', timestamp: new Date(), ipAddress: '192.168.1.1' }
      ]
    }
  }

  private async compilePortableData(userId: string): Promise<any> {
    // Return data in a structured, machine-readable format
    const personalData = await this.compilePersonalData(userId)
    
    return {
      exportDate: new Date().toISOString(),
      userId,
      data: personalData,
      format: 'GDPR_Article_20_Compliant',
      version: '1.0'
    }
  }

  private async getProcessingActivities(userId: string): Promise<DataProcessingRecord[]> {
    // Mock processing activities
    return [
      {
        id: 'proc_1',
        userId,
        dataType: 'personal',
        purpose: 'Account management',
        legalBasis: 'contract',
        dataCategories: ['email', 'name', 'phone'],
        retentionPeriod: 2555, // 7 years
        processingDate: new Date(),
        thirdPartySharing: false
      },
      {
        id: 'proc_2',
        userId,
        dataType: 'verification',
        purpose: 'Identity verification',
        legalBasis: 'legal_obligation',
        dataCategories: ['id_document', 'address_proof'],
        retentionPeriod: 2555, // 7 years for compliance
        processingDate: new Date(),
        thirdPartySharing: true,
        thirdParties: ['Jumio', 'AWS Textract']
      }
    ]
  }

  private async getConsentHistory(userId: string): Promise<ConsentRecord[]> {
    const consentService = new ConsentManagementService()
    return await consentService.getConsentStatus(userId)
  }

  private async getRetentionInfo(userId: string): Promise<any> {
    return {
      personalData: { retentionPeriod: 2555, reason: 'Account active' },
      verificationData: { retentionPeriod: 2555, reason: 'Legal compliance' },
      analyticsData: { retentionPeriod: 1095, reason: 'Business analytics' },
      marketingData: { retentionPeriod: 730, reason: 'Marketing consent' }
    }
  }

  private async analyzeErasureRequest(
    userId: string,
    exceptions?: string[]
  ): Promise<{
    canErase: boolean
    erasedData: string[]
    retainedData: string[]
    reasons: string[]
  }> {
    const analysis = {
      canErase: true,
      erasedData: [] as string[],
      retainedData: [] as string[],
      reasons: [] as string[]
    }

    // Check legal obligations
    const hasLegalObligation = await this.checkLegalObligations(userId)
    if (hasLegalObligation) {
      analysis.retainedData.push('verification_records')
      analysis.reasons.push('Legal obligation to retain verification records for 7 years')
    }

    // Check active contracts
    const hasActiveContract = await this.checkActiveContracts(userId)
    if (hasActiveContract) {
      analysis.retainedData.push('contract_data')
      analysis.reasons.push('Active rental contracts require data retention')
    }

    // Determine what can be erased
    const allDataTypes = ['profile', 'preferences', 'analytics', 'marketing', 'logs']
    analysis.erasedData = allDataTypes.filter(type => 
      !analysis.retainedData.includes(type) && 
      !(exceptions || []).includes(type)
    )

    return analysis
  }

  private async checkLegalObligations(userId: string): Promise<boolean> {
    // Check if user has verification records that must be retained for compliance
    return true // Assume yes for demo
  }

  private async checkActiveContracts(userId: string): Promise<boolean> {
    // Check if user has active rental contracts
    return false // Assume no for demo
  }

  private async performDataErasure(userId: string, dataTypes: string[]): Promise<void> {
    for (const dataType of dataTypes) {
      console.log(`Erasing ${dataType} data for user ${userId}`)
      // In production, would delete from relevant tables
    }
  }

  private async updatePersonalData(userId: string, field: string, newValue: any): Promise<void> {
    console.log(`Updating ${field} for user ${userId} to:`, newValue)
    // In production, would update database
  }
}

/**
 * Data Protection Impact Assessment (DPIA) Service
 */
export class DPIAService {
  async conductDPIA(
    processingActivity: string,
    dataTypes: string[],
    purposes: string[],
    recipients: string[]
  ): Promise<{
    riskLevel: 'low' | 'medium' | 'high'
    riskFactors: string[]
    mitigationMeasures: string[]
    requiresConsultation: boolean
    recommendations: string[]
  }> {
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    const riskFactors: string[] = []
    const mitigationMeasures: string[] = []
    const recommendations: string[] = []

    // Assess risk factors
    if (dataTypes.includes('biometric') || dataTypes.includes('sensitive')) {
      riskLevel = 'high'
      riskFactors.push('Processing of sensitive personal data')
      mitigationMeasures.push('Implement additional encryption and access controls')
    }

    if (recipients.length > 0) {
      if (riskLevel === 'low') riskLevel = 'medium'
      riskFactors.push('Data sharing with third parties')
      mitigationMeasures.push('Implement data processing agreements with all recipients')
    }

    if (purposes.includes('automated_decision_making')) {
      riskLevel = 'high'
      riskFactors.push('Automated decision-making with legal effects')
      mitigationMeasures.push('Implement human review process for automated decisions')
    }

    // Generate recommendations
    recommendations.push('Regular review of data processing activities')
    recommendations.push('Staff training on data protection principles')
    recommendations.push('Implementation of privacy by design principles')

    return {
      riskLevel,
      riskFactors,
      mitigationMeasures,
      requiresConsultation: riskLevel === 'high',
      recommendations
    }
  }
}

/**
 * Data Breach Management Service
 */
export class DataBreachService {
  async reportBreach(
    incidentDetails: {
      description: string
      affectedUsers: number
      dataTypes: string[]
      discoveredDate: Date
      incidentDate?: Date
    }
  ): Promise<DataBreachRecord> {
    const breach: DataBreachRecord = {
      id: `breach_${Date.now()}`,
      incidentDate: incidentDetails.incidentDate || incidentDetails.discoveredDate,
      discoveredDate: incidentDetails.discoveredDate,
      affectedUsers: incidentDetails.affectedUsers,
      dataTypes: incidentDetails.dataTypes,
      severity: this.assessBreachSeverity(incidentDetails),
      containmentActions: [],
      notificationRequired: this.requiresNotification(incidentDetails),
      regulatorNotified: false,
      status: 'investigating'
    }

    // Auto-generate containment actions
    breach.containmentActions = this.generateContainmentActions(breach)

    console.log('Data breach recorded:', breach)
    
    // If notification required, set deadline (72 hours for GDPR)
    if (breach.notificationRequired) {
      const notificationDeadline = new Date(breach.discoveredDate.getTime() + 72 * 60 * 60 * 1000)
      console.log('Notification deadline:', notificationDeadline)
    }

    return breach
  }

  private assessBreachSeverity(incident: any): 'low' | 'medium' | 'high' | 'critical' {
    if (incident.affectedUsers > 10000 || incident.dataTypes.includes('financial')) {
      return 'critical'
    }
    if (incident.affectedUsers > 1000 || incident.dataTypes.includes('sensitive')) {
      return 'high'
    }
    if (incident.affectedUsers > 100) {
      return 'medium'
    }
    return 'low'
  }

  private requiresNotification(incident: any): boolean {
    // GDPR requires notification for breaches likely to result in risk to rights and freedoms
    return incident.affectedUsers > 0 && (
      incident.dataTypes.includes('sensitive') ||
      incident.dataTypes.includes('financial') ||
      incident.dataTypes.includes('biometric')
    )
  }

  private generateContainmentActions(breach: DataBreachRecord): string[] {
    const actions: string[] = []
    
    actions.push('Secure the affected systems')
    actions.push('Assess the scope of the breach')
    actions.push('Preserve evidence for investigation')
    
    if (breach.severity === 'high' || breach.severity === 'critical') {
      actions.push('Notify affected users within 72 hours')
      actions.push('Prepare regulatory notification')
    }
    
    if (breach.dataTypes.includes('financial')) {
      actions.push('Coordinate with financial institutions')
      actions.push('Offer credit monitoring services')
    }
    
    return actions
  }
}

/**
 * Privacy Settings Management
 */
export class PrivacySettingsService {
  async getPrivacySettings(userId: string): Promise<PrivacySettings> {
    // In production, would query database
    return {
      userId,
      dataMinimization: true,
      anonymization: false,
      pseudonymization: true,
      encryption: true,
      accessLogging: true,
      dataRetentionDays: 2555, // 7 years
      thirdPartySharing: false,
      marketingCommunications: false,
      analyticsTracking: true,
      updatedAt: new Date()
    }
  }

  async updatePrivacySettings(
    userId: string,
    settings: Partial<PrivacySettings>
  ): Promise<PrivacySettings> {
    const currentSettings = await this.getPrivacySettings(userId)
    const updatedSettings = {
      ...currentSettings,
      ...settings,
      updatedAt: new Date()
    }

    // Apply settings changes
    await this.applyPrivacySettings(userId, updatedSettings)

    console.log('Privacy settings updated:', updatedSettings)
    return updatedSettings
  }

  private async applyPrivacySettings(userId: string, settings: PrivacySettings): Promise<void> {
    // Apply data minimization
    if (settings.dataMinimization) {
      await this.enableDataMinimization(userId)
    }

    // Apply anonymization
    if (settings.anonymization) {
      await this.enableAnonymization(userId)
    }

    // Update third-party sharing
    if (!settings.thirdPartySharing) {
      await this.disableThirdPartySharing(userId)
    }

    // Update marketing preferences
    if (!settings.marketingCommunications) {
      await this.disableMarketing(userId)
    }
  }

  private async enableDataMinimization(userId: string): Promise<void> {
    console.log(`Enabling data minimization for user ${userId}`)
  }

  private async enableAnonymization(userId: string): Promise<void> {
    console.log(`Enabling data anonymization for user ${userId}`)
  }

  private async disableThirdPartySharing(userId: string): Promise<void> {
    console.log(`Disabling third-party sharing for user ${userId}`)
  }

  private async disableMarketing(userId: string): Promise<void> {
    console.log(`Disabling marketing communications for user ${userId}`)
  }
}

// Export services
export const consentManagement = new ConsentManagementService()
export const dataSubjectRights = new DataSubjectRightsService()
export const dpiaService = new DPIAService()
export const dataBreachService = new DataBreachService()
export const privacySettings = new PrivacySettingsService()
