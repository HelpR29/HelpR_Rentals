import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import {
  consentManagement,
  dataSubjectRights,
  privacySettings
} from '@/lib/gdpr-compliance'

/**
 * GET /api/privacy - Get user's privacy data and settings
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'overview'

    switch (type) {
      case 'overview':
        const [consents, settings] = await Promise.all([
          consentManagement.getConsentStatus(user.id),
          privacySettings.getPrivacySettings(user.id)
        ])
        
        return NextResponse.json({
          consents,
          settings,
          dataRights: {
            access: true,
            rectification: true,
            erasure: true,
            restriction: true,
            portability: true,
            objection: true,
            withdrawConsent: true
          }
        })

      case 'consents':
        const consentData = await consentManagement.getConsentStatus(user.id)
        return NextResponse.json({ consents: consentData })

      case 'settings':
        const settingsData = await privacySettings.getPrivacySettings(user.id)
        return NextResponse.json({ settings: settingsData })

      case 'data-access':
        const accessData = await dataSubjectRights.processDataAccessRequest(user.id)
        return NextResponse.json(accessData)

      case 'data-export':
        const exportData = await dataSubjectRights.processDataPortabilityRequest(user.id)
        
        // Return as downloadable file
        const response = new NextResponse(JSON.stringify(exportData.data, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${exportData.filename}"`
          }
        })
        
        return response

      default:
        return NextResponse.json(
          { error: 'Invalid privacy data type' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Privacy API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/privacy - Update privacy settings or process data rights requests
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { action, ...data } = await request.json()

    switch (action) {
      case 'update-consent':
        const { consentType, granted, legalBasis = 'consent' } = data
        
        if (!consentType || typeof granted !== 'boolean') {
          return NextResponse.json(
            { error: 'Invalid consent data' },
            { status: 400 }
          )
        }

        const consentResult = granted 
          ? await consentManagement.recordConsent(user.id, consentType, true, {
              ipAddress: request.ip || 'unknown',
              userAgent: request.headers.get('user-agent') || 'unknown',
              legalBasis
            })
          : await consentManagement.withdrawConsent(user.id, consentType)

        return NextResponse.json({ 
          success: true, 
          consent: consentResult 
        })

      case 'update-settings':
        const { settings } = data
        
        if (!settings) {
          return NextResponse.json(
            { error: 'Settings data required' },
            { status: 400 }
          )
        }

        const updatedSettings = await privacySettings.updatePrivacySettings(
          user.id,
          settings
        )

        return NextResponse.json({ 
          success: true, 
          settings: updatedSettings 
        })

      case 'data-rectification':
        const { corrections } = data
        
        if (!corrections || !Array.isArray(corrections)) {
          return NextResponse.json(
            { error: 'Corrections array required' },
            { status: 400 }
          )
        }

        const rectificationResult = await dataSubjectRights.processRectificationRequest(
          user.id,
          corrections
        )

        return NextResponse.json({ 
          success: true, 
          result: rectificationResult 
        })

      case 'data-erasure':
        const { reason, exceptions } = data
        
        const erasureResult = await dataSubjectRights.processErasureRequest(
          user.id,
          reason || 'User requested deletion',
          exceptions
        )

        return NextResponse.json({ 
          success: true, 
          result: erasureResult 
        })

      case 'withdraw-all-consents':
        // Withdraw all marketing and optional consents
        const consentTypes = ['marketing', 'analytics', 'third_party_sharing']
        const withdrawalResults = []
        
        for (const consentType of consentTypes) {
          const result = await consentManagement.withdrawConsent(user.id, consentType as any)
          withdrawalResults.push({ consentType, success: result })
        }

        return NextResponse.json({ 
          success: true, 
          results: withdrawalResults 
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Privacy POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
