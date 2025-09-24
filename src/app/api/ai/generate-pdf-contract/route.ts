import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { generateManitobaContractPDF, ContractData } from '@/lib/pdf-generator'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const contractData: ContractData = await req.json()

    // Generate PDF
    const pdf = generateManitobaContractPDF(contractData)
    const pdfBuffer = pdf.output('arraybuffer')

    // Return PDF as downloadable file
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Manitoba_Rental_Contract_${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    })

  } catch (error) {
    console.error('PDF Contract generation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint for prefilled form
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const searchParams = url.searchParams

    // Extract prefill data from query parameters
    const contractData: ContractData = {
      landlordName: searchParams.get('landlordName') || undefined,
      landlordEmail: searchParams.get('landlordEmail') || undefined,
      landlordPhone: searchParams.get('landlordPhone') || undefined,
      tenantName: searchParams.get('tenantName') || undefined,
      tenantEmail: searchParams.get('tenantEmail') || undefined,
      tenantPhone: searchParams.get('tenantPhone') || undefined,
      propertyAddress: searchParams.get('propertyAddress') || undefined,
      propertyType: searchParams.get('propertyType') || undefined,
      bedrooms: searchParams.get('bedrooms') || undefined,
      bathrooms: searchParams.get('bathrooms') || undefined,
      monthlyRent: searchParams.get('monthlyRent') || undefined,
      securityDeposit: searchParams.get('securityDeposit') || undefined,
      leaseStartDate: searchParams.get('leaseStartDate') || undefined,
      leaseTerm: searchParams.get('leaseTerm') || undefined,
      utilitiesIncluded: searchParams.get('utilitiesIncluded') || undefined,
      tenantUtilities: searchParams.get('tenantUtilities') || undefined,
      additionalTerms: searchParams.get('additionalTerms') || undefined,
    }

    // Generate prefilled PDF
    const pdf = generateManitobaContractPDF(contractData)
    const pdfBuffer = pdf.output('arraybuffer')

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Manitoba_Rental_Contract_Prefilled_${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    })

  } catch (error) {
    console.error('PDF Contract prefill error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
