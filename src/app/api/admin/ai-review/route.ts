import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  analyzeVerificationDocument, 
  batchAnalyzeVerifications,
  generateVerificationReport,
  detectFraud
} from '@/lib/ai-verification'

/**
 * GET /api/admin/ai-review - Get pending verifications for AI review
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

    // Get users with pending verifications
    const pendingVerifications = await prisma.user.findMany({
      where: {
        OR: [
          { emailVerified: false },
          { phoneVerified: false },
          { idVerified: false },
          { addressVerified: false },
          { incomeVerified: false },
          { backgroundVerified: false }
        ],
        verificationData: {
          not: null
        }
      },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        phoneVerified: true,
        idVerified: true,
        addressVerified: true,
        incomeVerified: true,
        backgroundVerified: true,
        verificationData: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit for performance
    })

    // Parse verification data
    const parsedVerifications = pendingVerifications.map(user => ({
      ...user,
      verificationData: user.verificationData 
        ? JSON.parse(user.verificationData) 
        : {}
    }))

    return NextResponse.json({ 
      pendingVerifications: parsedVerifications,
      count: parsedVerifications.length
    })

  } catch (error) {
    console.error('Get pending verifications error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/ai-review - Run AI analysis on verification
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

    const { 
      userId, 
      verificationType, 
      action = 'analyze' // 'analyze' | 'batch' | 'report' | 'fraud_check'
    } = await request.json()

    if (action === 'analyze' && userId && verificationType) {
      // Single verification analysis
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          verificationData: true,
          emailVerified: true,
          phoneVerified: true,
          idVerified: true,
          addressVerified: true,
          incomeVerified: true,
          backgroundVerified: true
        }
      })

      if (!targetUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      const verificationData = targetUser.verificationData 
        ? JSON.parse(targetUser.verificationData) 
        : {}

      const documentData = verificationData[verificationType]
      
      if (!documentData) {
        return NextResponse.json(
          { error: 'No verification data found for this type' },
          { status: 400 }
        )
      }

      // Run AI analysis
      const analysis = await analyzeVerificationDocument(
        verificationType as any,
        documentData,
        {
          id: targetUser.id,
          email: targetUser.email
        }
      )

      // Auto-apply recommendation if confidence is high enough
      if (analysis.recommendation === 'approve' && analysis.confidence >= 85) {
        await applyVerificationResult(userId, verificationType, true, analysis)
      } else if (analysis.recommendation === 'reject' && analysis.confidence >= 85) {
        await applyVerificationResult(userId, verificationType, false, analysis)
      }

      return NextResponse.json({ 
        analysis,
        autoApplied: analysis.confidence >= 85
      })

    } else if (action === 'batch') {
      // Batch analysis of multiple pending verifications
      const pendingUsers = await prisma.user.findMany({
        where: {
          verificationData: { not: null }
        },
        select: {
          id: true,
          email: true,
          verificationData: true
        },
        take: 20 // Process in batches
      })

      const verifications = []
      for (const user of pendingUsers) {
        const verificationData = JSON.parse(user.verificationData || '{}')
        
        for (const [type, data] of Object.entries(verificationData)) {
          if (data && typeof data === 'object') {
            verifications.push({
              userId: user.id,
              documentType: type,
              documentData: data,
              userData: { id: user.id, email: user.email }
            })
          }
        }
      }

      const results = await batchAnalyzeVerifications(verifications)
      
      // Auto-apply high-confidence results
      let autoApplied = 0
      for (const result of results) {
        if (result.confidence >= 85) {
          const verificationType = verifications.find(v => v.userId === result.userId)?.documentType
          if (verificationType) {
            await applyVerificationResult(
              result.userId, 
              verificationType, 
              result.recommendation === 'approve',
              result
            )
            autoApplied++
          }
        }
      }

      return NextResponse.json({ 
        results,
        processed: results.length,
        autoApplied
      })

    } else if (action === 'report' && userId) {
      // Generate comprehensive verification report
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          verificationData: true,
          emailVerified: true,
          phoneVerified: true,
          idVerified: true,
          addressVerified: true,
          incomeVerified: true,
          backgroundVerified: true
        }
      })

      if (!targetUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      const verifications = []
      const verificationData = JSON.parse(targetUser.verificationData || '{}')
      
      for (const [type, data] of Object.entries(verificationData)) {
        if (data) {
          const analysis = await analyzeVerificationDocument(
            type as any,
            data,
            { id: targetUser.id, email: targetUser.email }
          )
          verifications.push({ type, analysis })
        }
      }

      const report = await generateVerificationReport(userId, verifications)

      return NextResponse.json({ report, verifications })

    } else if (action === 'fraud_check' && userId) {
      // Run fraud detection analysis
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          listings: true,
          apps: true
        }
      })

      if (!targetUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      const verificationData = JSON.parse(targetUser.verificationData || '{}')
      
      const fraudAnalysis = await detectFraud(
        verificationData,
        {
          accountAge: Date.now() - new Date(targetUser.createdAt).getTime(),
          listingsCount: targetUser.listings.length,
          applicationsCount: targetUser.apps.length
        },
        {
          // Would include device fingerprinting data in production
          userAgent: 'unknown',
          ipAddress: 'unknown'
        }
      )

      return NextResponse.json({ fraudAnalysis })
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    )

  } catch (error) {
    console.error('AI verification review error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Apply verification result to user record
 */
async function applyVerificationResult(
  userId: string,
  verificationType: string,
  approved: boolean,
  analysis: any
) {
  const updateField = `${verificationType}Verified`
  
  // Update user verification status
  await prisma.user.update({
    where: { id: userId },
    data: {
      [updateField]: approved
    }
  })

  // Update verification data with AI analysis results
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { verificationData: true }
  })

  const verificationData = user?.verificationData 
    ? JSON.parse(user.verificationData) 
    : {}

  verificationData[verificationType] = {
    ...verificationData[verificationType],
    aiAnalysis: {
      ...analysis,
      processedAt: new Date().toISOString(),
      autoProcessed: true
    },
    status: approved ? 'approved' : 'rejected'
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      verificationData: JSON.stringify(verificationData)
    }
  })

  // Update overall verification status
  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      emailVerified: true,
      phoneVerified: true,
      idVerified: true,
      addressVerified: true,
      incomeVerified: true,
      backgroundVerified: true
    }
  })

  if (updatedUser) {
    const verificationCount = Object.values(updatedUser).filter(Boolean).length
    const totalVerifications = Object.keys(updatedUser).length
    
    // Mark as fully verified if most verifications are complete
    const isFullyVerified = verificationCount >= Math.ceil(totalVerifications * 0.7)
    
    await prisma.user.update({
      where: { id: userId },
      data: { verified: isFullyVerified }
    })
  }
}
