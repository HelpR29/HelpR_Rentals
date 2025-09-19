/**
 * Machine Learning Verification Training Pipeline
 * Trains custom models on platform-specific verification data
 */

export interface MLTrainingData {
  id: string
  verificationType: string
  documentData: any
  humanDecision: 'approve' | 'reject' | 'manual_review'
  aiDecision: 'approve' | 'reject' | 'manual_review'
  confidence: number
  features: MLFeatures
  outcome: 'correct' | 'incorrect'
  timestamp: Date
}

export interface MLFeatures {
  // Document features
  documentQuality: number // 0-100
  textClarity: number // 0-100
  imageResolution: number
  fileSize: number
  
  // Content features
  dataConsistency: number // 0-100
  formatCompliance: number // 0-100
  securityFeatures: number // 0-100
  
  // User behavior features
  submissionSpeed: number // seconds
  retryCount: number
  deviceConsistency: number // 0-100
  locationConsistency: number // 0-100
  
  // Historical features
  userAge: number // days since registration
  previousVerifications: number
  successRate: number // 0-100
  
  // Third-party features
  thirdPartyConfidence?: number
  crossValidation?: boolean
}

export interface MLModel {
  id: string
  name: string
  version: string
  verificationType: string
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  trainingDate: Date
  sampleSize: number
  features: string[]
}

export interface MLPrediction {
  decision: 'approve' | 'reject' | 'manual_review'
  confidence: number
  reasoning: string[]
  featureImportance: { [key: string]: number }
  modelVersion: string
}

/**
 * Feature Extraction Service
 */
export class MLFeatureExtractor {
  extractFeatures(
    verificationType: string,
    documentData: any,
    userData: any,
    submissionMetadata: any
  ): MLFeatures {
    return {
      // Document quality features
      documentQuality: this.calculateDocumentQuality(documentData),
      textClarity: this.calculateTextClarity(documentData),
      imageResolution: documentData.imageResolution || 0,
      fileSize: documentData.fileSize || 0,
      
      // Content features
      dataConsistency: this.calculateDataConsistency(documentData, userData),
      formatCompliance: this.calculateFormatCompliance(verificationType, documentData),
      securityFeatures: this.detectSecurityFeatures(documentData),
      
      // User behavior features
      submissionSpeed: submissionMetadata.submissionSpeed || 0,
      retryCount: submissionMetadata.retryCount || 0,
      deviceConsistency: this.calculateDeviceConsistency(userData.deviceHistory),
      locationConsistency: this.calculateLocationConsistency(userData.locationHistory),
      
      // Historical features
      userAge: this.calculateUserAge(userData.createdAt),
      previousVerifications: userData.verificationCount || 0,
      successRate: this.calculateSuccessRate(userData.verificationHistory),
      
      // Third-party features
      thirdPartyConfidence: submissionMetadata.thirdPartyConfidence,
      crossValidation: submissionMetadata.crossValidation || false
    }
  }

  private calculateDocumentQuality(documentData: any): number {
    // Simulate document quality analysis
    if (process.env.NODE_ENV === 'development') {
      return Math.random() * 40 + 60 // 60-100
    }
    
    // In production, would analyze:
    // - Image sharpness
    // - Lighting conditions
    // - Perspective distortion
    // - Noise levels
    return 85
  }

  private calculateTextClarity(documentData: any): number {
    // Simulate OCR confidence scoring
    return Math.random() * 30 + 70 // 70-100
  }

  private calculateDataConsistency(documentData: any, userData: any): number {
    // Check consistency between document data and user profile
    let consistency = 100
    
    if (documentData.name && userData.name) {
      const nameMatch = this.fuzzyMatch(documentData.name, userData.name)
      consistency *= nameMatch
    }
    
    if (documentData.email && userData.email) {
      const emailMatch = documentData.email === userData.email ? 1 : 0.5
      consistency *= emailMatch
    }
    
    return Math.round(consistency)
  }

  private calculateFormatCompliance(verificationType: string, documentData: any): number {
    // Check if document follows expected format for type
    const expectedFormats = {
      id: ['jpg', 'png', 'pdf'],
      income: ['pdf', 'jpg', 'png'],
      address: ['pdf', 'jpg', 'png'],
      background: ['pdf']
    }
    
    const allowedFormats = expectedFormats[verificationType as keyof typeof expectedFormats] || []
    const hasValidFormat = allowedFormats.includes(documentData.format || 'unknown')
    
    return hasValidFormat ? 100 : 50
  }

  private detectSecurityFeatures(documentData: any): number {
    // Simulate security feature detection
    return Math.random() * 50 + 50 // 50-100
  }

  private calculateDeviceConsistency(deviceHistory: any[]): number {
    if (!deviceHistory || deviceHistory.length < 2) return 100
    
    // Check if user consistently uses same device
    const uniqueDevices = new Set(deviceHistory.map(d => d.fingerprint))
    return Math.max(0, 100 - (uniqueDevices.size - 1) * 20)
  }

  private calculateLocationConsistency(locationHistory: any[]): number {
    if (!locationHistory || locationHistory.length < 2) return 100
    
    // Check location consistency
    const uniqueLocations = new Set(locationHistory.map(l => `${l.city}-${l.country}`))
    return Math.max(0, 100 - (uniqueLocations.size - 1) * 15)
  }

  private calculateUserAge(createdAt: string): number {
    const created = new Date(createdAt)
    const now = new Date()
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
  }

  private calculateSuccessRate(verificationHistory: any[]): number {
    if (!verificationHistory || verificationHistory.length === 0) return 0
    
    const successful = verificationHistory.filter(v => v.status === 'approved').length
    return Math.round((successful / verificationHistory.length) * 100)
  }

  private fuzzyMatch(str1: string, str2: string): number {
    // Simple fuzzy string matching
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1
    
    const distance = this.levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }
}

/**
 * ML Model Training Service
 */
export class MLModelTrainer {
  private featureExtractor: MLFeatureExtractor

  constructor() {
    this.featureExtractor = new MLFeatureExtractor()
  }

  async trainModel(
    verificationType: string,
    trainingData: MLTrainingData[]
  ): Promise<MLModel> {
    console.log(`Training ML model for ${verificationType} with ${trainingData.length} samples`)
    
    // In development, simulate training
    if (process.env.NODE_ENV === 'development') {
      await this.simulateTraining(trainingData.length)
      
      return {
        id: `model_${verificationType}_${Date.now()}`,
        name: `${verificationType.toUpperCase()} Verification Model`,
        version: '1.0.0',
        verificationType,
        accuracy: Math.random() * 0.15 + 0.85, // 85-100%
        precision: Math.random() * 0.1 + 0.9, // 90-100%
        recall: Math.random() * 0.1 + 0.9, // 90-100%
        f1Score: Math.random() * 0.1 + 0.9, // 90-100%
        trainingDate: new Date(),
        sampleSize: trainingData.length,
        features: this.getImportantFeatures(verificationType)
      }
    }
    
    // In production, would use actual ML training
    // - Feature preprocessing
    // - Model selection (Random Forest, XGBoost, Neural Network)
    // - Cross-validation
    // - Hyperparameter tuning
    // - Model evaluation
    
    throw new Error('Production ML training not implemented')
  }

  private async simulateTraining(sampleSize: number): Promise<void> {
    // Simulate training time based on sample size
    const trainingTime = Math.min(sampleSize * 10, 5000) // Max 5 seconds
    await new Promise(resolve => setTimeout(resolve, trainingTime))
  }

  private getImportantFeatures(verificationType: string): string[] {
    const commonFeatures = [
      'documentQuality',
      'textClarity',
      'dataConsistency',
      'formatCompliance',
      'userAge',
      'successRate'
    ]
    
    const typeSpecificFeatures = {
      id: ['securityFeatures', 'imageResolution'],
      income: ['thirdPartyConfidence', 'fileSize'],
      address: ['formatCompliance', 'textClarity'],
      background: ['thirdPartyConfidence', 'crossValidation'],
      phone: ['deviceConsistency', 'locationConsistency']
    }
    
    return [
      ...commonFeatures,
      ...(typeSpecificFeatures[verificationType as keyof typeof typeSpecificFeatures] || [])
    ]
  }

  async evaluateModel(
    model: MLModel,
    testData: MLTrainingData[]
  ): Promise<{
    accuracy: number
    precision: number
    recall: number
    f1Score: number
    confusionMatrix: number[][]
  }> {
    // Simulate model evaluation
    const predictions = testData.map(data => this.simulateModelPrediction(data))
    
    let correct = 0
    let truePositives = 0
    let falsePositives = 0
    let falseNegatives = 0
    
    predictions.forEach((prediction, index) => {
      const actual = testData[index].humanDecision
      const predicted = prediction.decision
      
      if (actual === predicted) correct++
      
      if (actual === 'approve' && predicted === 'approve') truePositives++
      if (actual === 'reject' && predicted === 'approve') falsePositives++
      if (actual === 'approve' && predicted === 'reject') falseNegatives++
    })
    
    const accuracy = correct / testData.length
    const precision = truePositives / (truePositives + falsePositives) || 0
    const recall = truePositives / (truePositives + falseNegatives) || 0
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0
    
    return {
      accuracy,
      precision,
      recall,
      f1Score,
      confusionMatrix: [
        [truePositives, falsePositives],
        [falseNegatives, correct - truePositives]
      ]
    }
  }

  private simulateModelPrediction(data: MLTrainingData): MLPrediction {
    // Simulate ML model prediction based on features
    const confidence = Math.random() * 40 + 60 // 60-100%
    
    let decision: 'approve' | 'reject' | 'manual_review'
    if (confidence > 85) decision = 'approve'
    else if (confidence < 60) decision = 'reject'
    else decision = 'manual_review'
    
    return {
      decision,
      confidence,
      reasoning: [
        `Document quality score: ${data.features.documentQuality}`,
        `Data consistency: ${data.features.dataConsistency}%`,
        `User success rate: ${data.features.successRate}%`
      ],
      featureImportance: {
        documentQuality: 0.25,
        dataConsistency: 0.20,
        textClarity: 0.15,
        formatCompliance: 0.15,
        successRate: 0.10,
        userAge: 0.10,
        securityFeatures: 0.05
      },
      modelVersion: '1.0.0'
    }
  }
}

/**
 * ML Prediction Service
 */
export class MLPredictionService {
  private models: Map<string, MLModel> = new Map()
  private featureExtractor: MLFeatureExtractor

  constructor() {
    this.featureExtractor = new MLFeatureExtractor()
  }

  loadModel(model: MLModel): void {
    this.models.set(model.verificationType, model)
  }

  async predict(
    verificationType: string,
    documentData: any,
    userData: any,
    submissionMetadata: any
  ): Promise<MLPrediction> {
    const model = this.models.get(verificationType)
    if (!model) {
      throw new Error(`No model loaded for verification type: ${verificationType}`)
    }
    
    const features = this.featureExtractor.extractFeatures(
      verificationType,
      documentData,
      userData,
      submissionMetadata
    )
    
    // In development, simulate prediction
    if (process.env.NODE_ENV === 'development') {
      return this.simulatePrediction(features, model)
    }
    
    // In production, would use trained model
    throw new Error('Production ML prediction not implemented')
  }

  private simulatePrediction(features: MLFeatures, model: MLModel): MLPrediction {
    // Simulate ML prediction based on features
    const baseConfidence = (
      features.documentQuality * 0.25 +
      features.dataConsistency * 0.20 +
      features.textClarity * 0.15 +
      features.formatCompliance * 0.15 +
      features.successRate * 0.10 +
      (features.userAge > 30 ? 80 : 60) * 0.10 +
      features.securityFeatures * 0.05
    )
    
    const confidence = Math.min(100, Math.max(0, baseConfidence + (Math.random() - 0.5) * 20))
    
    let decision: 'approve' | 'reject' | 'manual_review'
    if (confidence > 85) decision = 'approve'
    else if (confidence < 60) decision = 'reject'
    else decision = 'manual_review'
    
    return {
      decision,
      confidence: Math.round(confidence),
      reasoning: [
        `Document quality: ${features.documentQuality}/100`,
        `Data consistency: ${features.dataConsistency}%`,
        `Text clarity: ${features.textClarity}/100`,
        `Format compliance: ${features.formatCompliance}%`,
        `User success rate: ${features.successRate}%`,
        `Account age: ${features.userAge} days`
      ],
      featureImportance: {
        documentQuality: 0.25,
        dataConsistency: 0.20,
        textClarity: 0.15,
        formatCompliance: 0.15,
        successRate: 0.10,
        userAge: 0.10,
        securityFeatures: 0.05
      },
      modelVersion: model.version
    }
  }
}

/**
 * ML Training Data Collection Service
 */
export class MLDataCollector {
  async collectTrainingData(
    verificationType: string,
    limit: number = 1000
  ): Promise<MLTrainingData[]> {
    // In development, generate mock training data
    if (process.env.NODE_ENV === 'development') {
      return this.generateMockTrainingData(verificationType, limit)
    }
    
    // In production, would query database for historical verification data
    throw new Error('Production data collection not implemented')
  }

  private generateMockTrainingData(
    verificationType: string,
    count: number
  ): MLTrainingData[] {
    const data: MLTrainingData[] = []
    
    for (let i = 0; i < count; i++) {
      const features = this.generateMockFeatures()
      const humanDecision = this.simulateHumanDecision(features)
      const aiDecision = this.simulateAIDecision(features)
      
      data.push({
        id: `training_${i}`,
        verificationType,
        documentData: { mockData: true },
        humanDecision,
        aiDecision,
        confidence: Math.random() * 40 + 60,
        features,
        outcome: humanDecision === aiDecision ? 'correct' : 'incorrect',
        timestamp: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
      })
    }
    
    return data
  }

  private generateMockFeatures(): MLFeatures {
    return {
      documentQuality: Math.random() * 40 + 60,
      textClarity: Math.random() * 30 + 70,
      imageResolution: Math.random() * 2000 + 1000,
      fileSize: Math.random() * 5000000 + 1000000,
      dataConsistency: Math.random() * 30 + 70,
      formatCompliance: Math.random() * 50 + 50,
      securityFeatures: Math.random() * 50 + 50,
      submissionSpeed: Math.random() * 300 + 30,
      retryCount: Math.floor(Math.random() * 5),
      deviceConsistency: Math.random() * 40 + 60,
      locationConsistency: Math.random() * 40 + 60,
      userAge: Math.random() * 365,
      previousVerifications: Math.floor(Math.random() * 10),
      successRate: Math.random() * 100,
      thirdPartyConfidence: Math.random() * 40 + 60,
      crossValidation: Math.random() > 0.5
    }
  }

  private simulateHumanDecision(features: MLFeatures): 'approve' | 'reject' | 'manual_review' {
    const score = (features.documentQuality + features.dataConsistency + features.textClarity) / 3
    
    if (score > 85) return 'approve'
    if (score < 60) return 'reject'
    return 'manual_review'
  }

  private simulateAIDecision(features: MLFeatures): 'approve' | 'reject' | 'manual_review' {
    // AI is slightly more conservative than humans
    const score = (features.documentQuality + features.dataConsistency + features.textClarity) / 3 - 5
    
    if (score > 80) return 'approve'
    if (score < 55) return 'reject'
    return 'manual_review'
  }
}

// Export services
export const mlFeatureExtractor = new MLFeatureExtractor()
export const mlModelTrainer = new MLModelTrainer()
export const mlPredictionService = new MLPredictionService()
export const mlDataCollector = new MLDataCollector()
