import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { generateManitobaChecklistPDF } from '@/lib/pdf-generator'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const { checklistType, propertyAddress, tenantName, landlordName } = await req.json()

    // Define checklist items based on type
    const checklists = {
      'move-in': [
        'Property Condition Report - Document existing damage/wear',
        'Key Handover - Receive all keys, fobs, garage remotes',
        'Utility Setup - Transfer/setup electricity, gas, water, internet',
        'Insurance - Arrange tenant/renter\'s insurance',
        'Address Change - Update address with bank, employer, CRA',
        'Manitoba Health Card - Update address with Manitoba Health',
        'Driver\'s License - Update address with MPI within 30 days',
        'Voter Registration - Update with Elections Manitoba',
        'Emergency Contacts - Exchange contact info with landlord',
        'Building Rules - Review condo/building bylaws if applicable',
        'Parking - Confirm parking spot assignment',
        'Storage - Locate and access storage areas',
        'Appliances - Test all included appliances',
        'Heating/Cooling - Learn thermostat and HVAC systems',
        'Safety - Locate fire exits, test smoke/carbon detectors'
      ],
      'move-out': [
        'Notice Given - Provide proper notice (1 month minimum)',
        'Deep Cleaning - Professional cleaning if required',
        'Repairs - Fix any tenant-caused damage',
        'Utilities - Cancel or transfer utilities',
        'Mail Forwarding - Set up Canada Post forwarding',
        'Final Inspection - Schedule with landlord',
        'Key Return - Return all keys, fobs, remotes',
        'Deposit Return - Confirm deposit return process',
        'Address Updates - Update all institutions/services',
        'Documentation - Keep copies of all rental documents',
        'Condition Report - Complete final condition report',
        'Outstanding Issues - Resolve any maintenance requests'
      ],
      'inspection': [
        'Legal Notice - Provide 24-hour written notice',
        'Valid Reason - Ensure inspection reason is legally valid',
        'Reasonable Hours - Schedule between 8 AM - 9 PM',
        'Safety Check - Inspect smoke/carbon monoxide detectors',
        'Structural - Check walls, ceilings, floors for damage',
        'Plumbing - Test faucets, toilets, water pressure',
        'Electrical - Check outlets, switches, panel access',
        'HVAC - Inspect heating/cooling systems, filters',
        'Windows/Doors - Check operation and security',
        'Appliances - Test included appliances if any',
        'Cleanliness - Note general cleanliness standards',
        'Unauthorized Changes - Check for unpermitted modifications',
        'Documentation - Photo/document any issues found',
        'Follow-up - Schedule repairs or discuss concerns'
      ]
    }

    const items = checklists[checklistType as keyof typeof checklists] || checklists['move-in']

    // Generate PDF
    const pdf = generateManitobaChecklistPDF(checklistType, items)
    const pdfBuffer = pdf.output('arraybuffer')

    // Return PDF as downloadable file
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Manitoba_${checklistType}_Checklist_${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    })

  } catch (error) {
    console.error('PDF Checklist generation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint for prefilled checklist
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const searchParams = url.searchParams
    const checklistType = searchParams.get('type') || 'move-in'

    const items = [
      'Property Condition Report - Document existing damage/wear',
      'Key Handover - Receive all keys, fobs, garage remotes',
      'Utility Setup - Transfer/setup electricity, gas, water, internet',
      'Insurance - Arrange tenant/renter\'s insurance',
      'Address Change - Update address with bank, employer, CRA',
      'Manitoba Health Card - Update address with Manitoba Health',
      'Driver\'s License - Update address with MPI within 30 days',
      'Voter Registration - Update with Elections Manitoba'
    ]

    // Generate prefilled PDF
    const pdf = generateManitobaChecklistPDF(checklistType, items)
    const pdfBuffer = pdf.output('arraybuffer')

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Manitoba_${checklistType}_Checklist_${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    })

  } catch (error) {
    console.error('PDF Checklist prefill error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
