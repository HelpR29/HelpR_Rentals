import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
// import { ContractTemplateManager, contractTemplates } from '@/lib/contract-templates'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { templateType, variables } = await request.json()

    if (!templateType || !variables) {
      return NextResponse.json(
        { error: 'Template type and variables are required' },
        { status: 400 }
      )
    }

    // Simplified mock contract generation for testing
    const mockContract = `MOCK ${templateType.toUpperCase()} CONTRACT
Generated for: ${variables.tenantName || variables.applicantName || 'Test User'}
Property: ${variables.propertyAddress || 'Test Property'}
Date: ${new Date().toLocaleDateString()}

This is a mock contract for testing purposes.`

    return NextResponse.json({
      success: true,
      contract: {
        content: mockContract,
        template: `Mock ${templateType} Template`,
        variables: Object.keys(variables),
        legalReferences: ['Mock Legal Reference']
      }
    })

  } catch (error) {
    console.error('Contract generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate contract' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Return mock templates for testing
    return NextResponse.json({
      success: true,
      templates: [
        {
          id: 'mock-lease',
          name: 'Mock Lease Agreement',
          type: 'lease',
          description: 'Mock residential lease agreement for testing'
        },
        {
          id: 'mock-application',
          name: 'Mock Application Form',
          type: 'application',
          description: 'Mock rental application form for testing'
        },
        {
          id: 'mock-maintenance',
          name: 'Mock Maintenance Request',
          type: 'maintenance',
          description: 'Mock maintenance request form for testing'
        }
      ]
    })

  } catch (error) {
    console.error('Template retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve templates' },
      { status: 500 }
    )
  }
}
