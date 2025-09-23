import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { ContractTemplateManager, contractTemplates } from '@/lib/contract-templates'

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

    let template
    switch (templateType) {
      case 'lease':
        template = contractTemplates.residentialLease
        break
      case 'application':
        template = contractTemplates.rentalApplication
        break
      case 'maintenance':
        template = contractTemplates.maintenanceRequest
        break
      case 'termination':
        template = contractTemplates.leaseTermination
        break
      default:
        return NextResponse.json(
          { error: 'Invalid template type' },
          { status: 400 }
        )
    }

    const processedContract = ContractTemplateManager.processTemplate(template, variables)

    return NextResponse.json({
      success: true,
      contract: {
        content: processedContract,
        template: template.name,
        variables: template.variables,
        legalReferences: template.legalReferences
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

    const { searchParams } = new URL(request.url)
    const templateType = searchParams.get('type')

    if (templateType) {
      let template
      switch (templateType) {
        case 'lease':
          template = contractTemplates.residentialLease
          break
        case 'application':
          template = contractTemplates.rentalApplication
          break
        case 'maintenance':
          template = contractTemplates.maintenanceRequest
          break
        case 'termination':
          template = contractTemplates.leaseTermination
          break
        default:
          return NextResponse.json(
            { error: 'Invalid template type' },
            { status: 400 }
          )
      }

      return NextResponse.json({
        success: true,
        template: {
          id: template.id,
          name: template.name,
          type: template.type,
          variables: template.variables,
          legalReferences: template.legalReferences
        }
      })
    }

    // Return all available templates
    return NextResponse.json({
      success: true,
      templates: [
        {
          id: contractTemplates.residentialLease.id,
          name: contractTemplates.residentialLease.name,
          type: contractTemplates.residentialLease.type,
          description: 'Manitoba residential lease agreement'
        },
        {
          id: contractTemplates.rentalApplication.id,
          name: contractTemplates.rentalApplication.name,
          type: contractTemplates.rentalApplication.type,
          description: 'Rental application form'
        },
        {
          id: contractTemplates.maintenanceRequest.id,
          name: contractTemplates.maintenanceRequest.name,
          type: contractTemplates.maintenanceRequest.type,
          description: 'Maintenance request form'
        },
        {
          id: contractTemplates.leaseTermination.id,
          name: contractTemplates.leaseTermination.name,
          type: contractTemplates.leaseTermination.type,
          description: 'Lease termination notice'
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
