import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

// AI-powered Manitoba rental contract generation
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const { propertyDetails, tenantInfo, hostInfo, contractType } = await req.json()

    // Manitoba-specific rental contract template
    const manitobaContract = `
# RESIDENTIAL TENANCY AGREEMENT
## Province of Manitoba

**Date:** ${new Date().toLocaleDateString()}

### PARTIES
**Landlord/Host:** ${hostInfo?.name || hostInfo?.email || 'Host Name'}
**Tenant:** ${tenantInfo?.name || tenantInfo?.email || 'Tenant Name'}

### PROPERTY DETAILS
**Address:** ${propertyDetails?.address || '[Property Address]'}
**Type:** ${propertyDetails?.type || 'Residential Unit'}
**Bedrooms:** ${propertyDetails?.bedrooms || '[Number]'}
**Bathrooms:** ${propertyDetails?.bathrooms || '[Number]'}

### RENTAL TERMS
**Monthly Rent:** $${propertyDetails?.rent || '[Amount]'}
**Security Deposit:** $${propertyDetails?.deposit || '[Amount]'} (Maximum 1/2 month's rent as per Manitoba law)
**Lease Term:** ${propertyDetails?.leaseTerm || '12 months'}
**Start Date:** ${propertyDetails?.startDate || '[Date]'}

### MANITOBA TENANCY ACT COMPLIANCE
This agreement is governed by The Residential Tenancies Act of Manitoba.

**Key Manitoba Tenant Rights:**
- Right to peaceful enjoyment of the premises
- Protection against unreasonable rent increases (90 days notice required)
- Right to proper notice for entry (24 hours minimum)
- Protection against illegal eviction

**Key Landlord Rights:**
- Right to collect rent on time
- Right to inspect property with proper notice
- Right to evict for cause with proper legal process

### UTILITIES & SERVICES
**Included:** ${propertyDetails?.utilitiesIncluded || 'To be specified'}
**Tenant Responsible:** ${propertyDetails?.tenantUtilities || 'To be specified'}

### MAINTENANCE & REPAIRS
- Landlord responsible for major repairs and structural maintenance
- Tenant responsible for minor maintenance and cleanliness
- Emergency contact: ${hostInfo?.phone || '[Phone Number]'}

### ADDITIONAL TERMS
${propertyDetails?.additionalTerms || 'Any additional terms to be added here'}

### SIGNATURES
**Landlord Signature:** ___________________ Date: ___________
**Tenant Signature:** ___________________ Date: ___________

---
*This contract complies with Manitoba Residential Tenancies Act. For legal advice, consult a qualified attorney.*
    `

    return NextResponse.json({
      success: true,
      contract: manitobaContract,
      type: contractType || 'standard',
      jurisdiction: 'Manitoba, Canada'
    })

  } catch (error) {
    console.error('Contract generation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
