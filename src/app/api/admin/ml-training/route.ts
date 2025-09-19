import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { 
  mlModelTrainer, 
  mlDataCollector, 
  mlPredictionService,
  type MLModel 
} from '@/lib/ml-verification'

/**
 * GET /api/admin/ml-training - Get ML training status and models
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'status'
    const verificationType = searchParams.get('verificationType')

    switch (action) {
      case 'status':
        // Return training status and available models
        return NextResponse.json({
          status: 'ready',
          availableModels: [
            {
              id: 'model_id_1',
              name: 'ID Verification Model',
              version: '1.0.0',
              verificationType: 'id',
              accuracy: 0.94,
              trainingDate: new Date().toISOString(),
              sampleSize: 5000
            },
            {
              id: 'model_income_1',
              name: 'Income Verification Model',
              version: '1.0.0',
              verificationType: 'income',
              accuracy: 0.91,
              trainingDate: new Date().toISOString(),
              sampleSize: 3000
            }
          ],
          trainingInProgress: false
        })

      case 'data-stats':
        if (!verificationType) {
          return NextResponse.json(
            { error: 'Verification type is required for data stats' },
            { status: 400 }
          )
        }

        // Get training data statistics
        const trainingData = await mlDataCollector.collectTrainingData(verificationType, 100)
        
        const stats = {
          totalSamples: trainingData.length,
          approvedSamples: trainingData.filter(d => d.humanDecision === 'approve').length,
          rejectedSamples: trainingData.filter(d => d.humanDecision === 'reject').length,
          manualReviewSamples: trainingData.filter(d => d.humanDecision === 'manual_review').length,
          accuracyRate: trainingData.filter(d => d.outcome === 'correct').length / trainingData.length,
          dateRange: {
            earliest: Math.min(...trainingData.map(d => d.timestamp.getTime())),
            latest: Math.max(...trainingData.map(d => d.timestamp.getTime()))
          }
        }

        return NextResponse.json({ stats })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('ML training API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/ml-training - Train or evaluate ML models
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { action, verificationType, sampleSize = 1000 } = await request.json()

    if (!action || !verificationType) {
      return NextResponse.json(
        { error: 'Action and verification type are required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'train':
        // Collect training data
        const trainingData = await mlDataCollector.collectTrainingData(
          verificationType,
          sampleSize
        )

        if (trainingData.length < 100) {
          return NextResponse.json(
            { error: 'Insufficient training data. Need at least 100 samples.' },
            { status: 400 }
          )
        }

        // Train the model
        const model = await mlModelTrainer.trainModel(verificationType, trainingData)

        // Evaluate the model with test data
        const testData = await mlDataCollector.collectTrainingData(
          verificationType,
          Math.floor(sampleSize * 0.2) // 20% for testing
        )

        const evaluation = await mlModelTrainer.evaluateModel(model, testData)

        return NextResponse.json({
          model,
          evaluation,
          trainingData: {
            samples: trainingData.length,
            testSamples: testData.length
          }
        })

      case 'predict':
        const { documentData, userData, submissionMetadata } = await request.json()

        if (!documentData || !userData) {
          return NextResponse.json(
            { error: 'Document data and user data are required for prediction' },
            { status: 400 }
          )
        }

        // Make prediction using ML model
        const prediction = await mlPredictionService.predict(
          verificationType,
          documentData,
          userData,
          submissionMetadata || {}
        )

        return NextResponse.json({ prediction })

      case 'evaluate':
        const { modelId } = await request.json()

        if (!modelId) {
          return NextResponse.json(
            { error: 'Model ID is required for evaluation' },
            { status: 400 }
          )
        }

        // Get test data for evaluation
        const evalData = await mlDataCollector.collectTrainingData(
          verificationType,
          500 // Use 500 samples for evaluation
        )

        // Create mock model for evaluation
        const mockModel: MLModel = {
          id: modelId,
          name: `${verificationType.toUpperCase()} Model`,
          version: '1.0.0',
          verificationType,
          accuracy: 0.9,
          precision: 0.92,
          recall: 0.88,
          f1Score: 0.9,
          trainingDate: new Date(),
          sampleSize: 1000,
          features: ['documentQuality', 'dataConsistency', 'textClarity']
        }

        const evalResults = await mlModelTrainer.evaluateModel(mockModel, evalData)

        return NextResponse.json({
          model: mockModel,
          evaluation: evalResults,
          testData: {
            samples: evalData.length
          }
        })

      case 'retrain':
        // Retrain existing model with new data
        const newTrainingData = await mlDataCollector.collectTrainingData(
          verificationType,
          sampleSize
        )

        const retrainedModel = await mlModelTrainer.trainModel(
          verificationType,
          newTrainingData
        )

        return NextResponse.json({
          model: retrainedModel,
          message: 'Model retrained successfully',
          trainingData: {
            samples: newTrainingData.length
          }
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('ML training POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
