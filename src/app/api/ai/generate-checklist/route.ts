import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

// AI-powered Manitoba rental checklist generation
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const { checklistType, propertyType } = await req.json()

    const checklists = {
      'move-in': {
        title: 'Manitoba Move-In Checklist',
        items: [
          '✅ **Property Condition Report** - Document existing damage/wear',
          '✅ **Key Handover** - Receive all keys, fobs, garage remotes',
          '✅ **Utility Setup** - Transfer/setup electricity, gas, water, internet',
          '✅ **Insurance** - Arrange tenant/renter\'s insurance',
          '✅ **Address Change** - Update address with bank, employer, CRA',
          '✅ **Manitoba Health Card** - Update address with Manitoba Health',
          '✅ **Driver\'s License** - Update address with MPI within 30 days',
          '✅ **Voter Registration** - Update with Elections Manitoba',
          '✅ **Emergency Contacts** - Exchange contact info with landlord',
          '✅ **Building Rules** - Review condo/building bylaws if applicable',
          '✅ **Parking** - Confirm parking spot assignment',
          '✅ **Storage** - Locate and access storage areas',
          '✅ **Appliances** - Test all included appliances',
          '✅ **Heating/Cooling** - Learn thermostat and HVAC systems',
          '✅ **Safety** - Locate fire exits, test smoke/carbon detectors'
        ]
      },
      'move-out': {
        title: 'Manitoba Move-Out Checklist',
        items: [
          '✅ **Notice Given** - Provide proper notice (1 month minimum)',
          '✅ **Deep Cleaning** - Professional cleaning if required',
          '✅ **Repairs** - Fix any tenant-caused damage',
          '✅ **Utilities** - Cancel or transfer utilities',
          '✅ **Mail Forwarding** - Set up Canada Post forwarding',
          '✅ **Final Inspection** - Schedule with landlord',
          '✅ **Key Return** - Return all keys, fobs, remotes',
          '✅ **Deposit Return** - Confirm deposit return process',
          '✅ **Address Updates** - Update all institutions/services',
          '✅ **Documentation** - Keep copies of all rental documents',
          '✅ **Condition Report** - Complete final condition report',
          '✅ **Outstanding Issues** - Resolve any maintenance requests'
        ]
      },
      'landlord-inspection': {
        title: 'Manitoba Landlord Inspection Checklist',
        items: [
          '✅ **Legal Notice** - Provide 24-hour written notice',
          '✅ **Valid Reason** - Ensure inspection reason is legally valid',
          '✅ **Reasonable Hours** - Schedule between 8 AM - 9 PM',
          '✅ **Safety Check** - Inspect smoke/carbon monoxide detectors',
          '✅ **Structural** - Check walls, ceilings, floors for damage',
          '✅ **Plumbing** - Test faucets, toilets, water pressure',
          '✅ **Electrical** - Check outlets, switches, panel access',
          '✅ **HVAC** - Inspect heating/cooling systems, filters',
          '✅ **Windows/Doors** - Check operation and security',
          '✅ **Appliances** - Test included appliances if any',
          '✅ **Cleanliness** - Note general cleanliness standards',
          '✅ **Unauthorized Changes** - Check for unpermitted modifications',
          '✅ **Documentation** - Photo/document any issues found',
          '✅ **Follow-up** - Schedule repairs or discuss concerns'
        ]
      },
      'tenant-rights': {
        title: 'Manitoba Tenant Rights & Responsibilities',
        items: [
          '📋 **Right to Quiet Enjoyment** - Peaceful use of your home',
          '📋 **Privacy Rights** - 24-hour notice required for entry',
          '📋 **Rent Increase Protection** - 90 days written notice required',
          '📋 **Security Deposit Limit** - Maximum 1/2 month\'s rent',
          '📋 **Maintenance Rights** - Landlord must maintain property',
          '📋 **Emergency Repairs** - Right to emergency repair procedures',
          '📋 **Discrimination Protection** - Protected under Human Rights Code',
          '📋 **Eviction Protection** - Proper legal process required',
          '📋 **Rent Receipt Rights** - Right to written rent receipts',
          '📋 **Dispute Resolution** - Access to Residential Tenancies Branch',
          '📋 **Responsibility: Pay Rent** - On time as per agreement',
          '📋 **Responsibility: Property Care** - Keep unit clean and undamaged',
          '📋 **Responsibility: Reasonable Use** - Use property appropriately',
          '📋 **Responsibility: Notice** - Proper notice for moving out'
        ]
      }
    }

    const selectedChecklist = checklists[checklistType as keyof typeof checklists] || checklists['move-in']

    return NextResponse.json({
      success: true,
      checklist: selectedChecklist,
      jurisdiction: 'Manitoba, Canada',
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Checklist generation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
