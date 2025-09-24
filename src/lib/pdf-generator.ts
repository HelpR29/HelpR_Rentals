import jsPDF from 'jspdf'

export interface ContractData {
  landlordName?: string
  landlordEmail?: string
  landlordPhone?: string
  tenantName?: string
  tenantEmail?: string
  tenantPhone?: string
  propertyAddress?: string
  propertyType?: string
  bedrooms?: string
  bathrooms?: string
  monthlyRent?: string
  securityDeposit?: string
  leaseStartDate?: string
  leaseTerm?: string
  utilitiesIncluded?: string
  tenantUtilities?: string
  additionalTerms?: string
}

export function generateManitobaContractPDF(data: ContractData): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const margin = 20
  let yPosition = 30

  // Header with Logo
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(59, 130, 246) // Blue color for Helpr
  doc.text('Helpr', margin, yPosition)
  doc.setTextColor(0, 0, 0) // Reset to black
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Smart Rentals', margin, yPosition + 8)
  yPosition += 25

  // Main Title
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('RESIDENTIAL TENANCY AGREEMENT', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 10
  
  doc.setFontSize(14)
  doc.text('Province of Manitoba', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 20

  // Date
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPosition)
  yPosition += 20

  // Parties Section
  doc.setFont('helvetica', 'bold')
  doc.text('PARTIES', margin, yPosition)
  yPosition += 10
  
  doc.setFont('helvetica', 'normal')
  doc.text(`Landlord/Host: ${data.landlordName || '_'.repeat(40)}`, margin, yPosition)
  yPosition += 8
  doc.text(`Email: ${data.landlordEmail || '_'.repeat(40)}`, margin, yPosition)
  yPosition += 8
  doc.text(`Phone: ${data.landlordPhone || '_'.repeat(40)}`, margin, yPosition)
  yPosition += 15

  doc.text(`Tenant: ${data.tenantName || '_'.repeat(40)}`, margin, yPosition)
  yPosition += 8
  doc.text(`Email: ${data.tenantEmail || '_'.repeat(40)}`, margin, yPosition)
  yPosition += 8
  doc.text(`Phone: ${data.tenantPhone || '_'.repeat(40)}`, margin, yPosition)
  yPosition += 20

  // Property Details
  doc.setFont('helvetica', 'bold')
  doc.text('PROPERTY DETAILS', margin, yPosition)
  yPosition += 10
  
  doc.setFont('helvetica', 'normal')
  doc.text(`Address: ${data.propertyAddress || '_'.repeat(50)}`, margin, yPosition)
  yPosition += 8
  doc.text(`Type: ${data.propertyType || '_'.repeat(30)}`, margin, yPosition)
  yPosition += 8
  doc.text(`Bedrooms: ${data.bedrooms || '___'}    Bathrooms: ${data.bathrooms || '___'}`, margin, yPosition)
  yPosition += 20

  // Rental Terms
  doc.setFont('helvetica', 'bold')
  doc.text('RENTAL TERMS', margin, yPosition)
  yPosition += 10
  
  doc.setFont('helvetica', 'normal')
  doc.text(`Monthly Rent: $${data.monthlyRent || '_'.repeat(10)}`, margin, yPosition)
  yPosition += 8
  doc.text(`Security Deposit: $${data.securityDeposit || '_'.repeat(10)} (Max 1/2 month rent - MB law)`, margin, yPosition)
  yPosition += 8
  doc.text(`Lease Term: ${data.leaseTerm || '_'.repeat(20)}`, margin, yPosition)
  yPosition += 8
  doc.text(`Start Date: ${data.leaseStartDate || '_'.repeat(20)}`, margin, yPosition)
  yPosition += 20

  // Check if we need a new page
  if (yPosition > 250) {
    doc.addPage()
    yPosition = 30
  }

  // Manitoba Legal Compliance - Detailed
  doc.setFont('helvetica', 'bold')
  doc.text('MANITOBA RESIDENTIAL TENANCIES ACT COMPLIANCE', margin, yPosition)
  yPosition += 10
  
  doc.setFont('helvetica', 'normal')
  doc.text('This agreement is governed by The Residential Tenancies Act (C.C.S.M. c. R119) of Manitoba.', margin, yPosition)
  yPosition += 8
  doc.text('For disputes: Residential Tenancies Branch - Phone: 204-945-2476', margin, yPosition)
  yPosition += 15

  doc.setFont('helvetica', 'bold')
  doc.text('MANDATORY MANITOBA TENANT RIGHTS:', margin, yPosition)
  yPosition += 8
  
  doc.setFont('helvetica', 'normal')
  const tenantRights = [
    '• Right to peaceful enjoyment without unreasonable interference',
    '• Protection against rent increases without 90 days written notice',
    '• Right to 24 hours written notice before landlord entry (except emergencies)',
    '• Protection against illegal eviction - proper legal process required',
    '• Right to written rent receipts upon request',
    '• Security deposit limited to maximum 1/2 month rent',
    '• Right to have security deposit held in trust account',
    '• Protection under Manitoba Human Rights Code against discrimination'
  ]
  
  tenantRights.forEach(right => {
    const splitText = doc.splitTextToSize(right, pageWidth - 2 * margin - 10)
    doc.text(splitText, margin + 5, yPosition)
    yPosition += splitText.length * 6 + 2
  })
  yPosition += 10

  doc.setFont('helvetica', 'bold')
  doc.text('MANDATORY LANDLORD OBLIGATIONS:', margin, yPosition)
  yPosition += 8
  
  doc.setFont('helvetica', 'normal')
  const landlordRights = [
    '• Maintain property in good repair and fit for habitation',
    '• Provide essential services (heat, water, electricity as applicable)',
    '• Respect tenant privacy - proper notice required for entry',
    '• Return security deposit within 14 days of tenancy end (if no damages)',
    '• Provide written notice for rent increases (90 days minimum)',
    '• Follow legal eviction procedures through Residential Tenancies Branch',
    '• Maintain common areas in safe and clean condition'
  ]
  
  landlordRights.forEach(right => {
    const splitText = doc.splitTextToSize(right, pageWidth - 2 * margin - 10)
    doc.text(splitText, margin + 5, yPosition)
    yPosition += splitText.length * 6 + 2
  })
  yPosition += 15

  // Check if we need a new page
  if (yPosition > 250) {
    doc.addPage()
    yPosition = 30
  }

  // Legal Notice Requirements
  doc.setFont('helvetica', 'bold')
  doc.text('NOTICE REQUIREMENTS (Manitoba Law):', margin, yPosition)
  yPosition += 8
  
  doc.setFont('helvetica', 'normal')
  const noticeReqs = [
    '• Tenant to Landlord: 1 month notice to terminate monthly tenancy',
    '• Landlord to Tenant: 3 months notice to terminate monthly tenancy',
    '• Rent Increase: 90 days written notice required',
    '• Entry for Inspection: 24 hours written notice required',
    '• Entry for Repairs: Reasonable notice required'
  ]
  
  noticeReqs.forEach(req => {
    const splitText = doc.splitTextToSize(req, pageWidth - 2 * margin - 10)
    doc.text(splitText, margin + 5, yPosition)
    yPosition += splitText.length * 6 + 2
  })
  yPosition += 20

  // Utilities
  doc.setFont('helvetica', 'bold')
  doc.text('UTILITIES & SERVICES', margin, yPosition)
  yPosition += 10
  
  doc.setFont('helvetica', 'normal')
  doc.text(`Included: ${data.utilitiesIncluded || '_'.repeat(40)}`, margin, yPosition)
  yPosition += 8
  doc.text(`Tenant Responsible: ${data.tenantUtilities || '_'.repeat(40)}`, margin, yPosition)
  yPosition += 20

  // Additional Terms
  doc.setFont('helvetica', 'bold')
  doc.text('ADDITIONAL TERMS', margin, yPosition)
  yPosition += 10
  
  doc.setFont('helvetica', 'normal')
  const additionalText = data.additionalTerms || 'Any additional terms to be added here:'
  const splitText = doc.splitTextToSize(additionalText, pageWidth - 2 * margin)
  doc.text(splitText, margin, yPosition)
  yPosition += splitText.length * 6 + 20

  // Check if we need a new page for signatures
  if (yPosition > 220) {
    doc.addPage()
    yPosition = 30
  }

  // Signatures
  doc.setFont('helvetica', 'bold')
  doc.text('SIGNATURES', margin, yPosition)
  yPosition += 20
  
  doc.setFont('helvetica', 'normal')
  doc.text('Landlord Signature: ________________________________    Date: ___________', margin, yPosition)
  yPosition += 20
  doc.text('Tenant Signature: ________________________________    Date: ___________', margin, yPosition)
  yPosition += 30

  // Footer
  doc.setFontSize(10)
  doc.text('This contract complies with Manitoba Residential Tenancies Act.', margin, yPosition)
  doc.text('For legal advice, consult a qualified attorney.', margin, yPosition + 6)
  
  // Helpr branding in footer
  doc.setTextColor(59, 130, 246)
  doc.text('Generated by Helpr - Smart Rentals Platform', pageWidth / 2, yPosition + 18, { align: 'center' })
  doc.setTextColor(0, 0, 0)

  return doc
}

export function generateManitobaChecklistPDF(checklistType: string, items: string[]): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const margin = 20
  let yPosition = 30

  // Header with Logo
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(59, 130, 246) // Blue color for Helpr
  doc.text('Helpr', margin, yPosition)
  doc.setTextColor(0, 0, 0) // Reset to black
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Smart Rentals', margin, yPosition + 8)
  yPosition += 25

  // Main Title
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  const title = checklistType === 'move-in' ? 'MANITOBA MOVE-IN CHECKLIST' : 
                checklistType === 'move-out' ? 'MANITOBA MOVE-OUT CHECKLIST' :
                'MANITOBA RENTAL CHECKLIST'
  doc.text(title, pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 20

  // Date and Property Info
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPosition)
  yPosition += 10
  doc.text('Property Address: _________________________________________________', margin, yPosition)
  yPosition += 10
  doc.text('Tenant Name: _____________________________________________________', margin, yPosition)
  yPosition += 10
  doc.text('Landlord Name: ___________________________________________________', margin, yPosition)
  yPosition += 20

  // Checklist Items
  doc.setFont('helvetica', 'bold')
  doc.text('CHECKLIST ITEMS', margin, yPosition)
  yPosition += 15

  doc.setFont('helvetica', 'normal')
  items.forEach((item, index) => {
    // Check if we need a new page
    if (yPosition > 270) {
      doc.addPage()
      yPosition = 30
    }

    // Remove emoji and format item
    const cleanItem = item.replace(/✅|📋/g, '').trim()
    
    // Add checkbox
    doc.rect(margin, yPosition - 4, 4, 4)
    
    // Add item text
    const itemText = `${index + 1}. ${cleanItem}`
    const splitText = doc.splitTextToSize(itemText, pageWidth - margin - 30)
    doc.text(splitText, margin + 10, yPosition)
    yPosition += Math.max(splitText.length * 6, 8) + 3
  })

  yPosition += 20

  // Signatures
  if (yPosition > 240) {
    doc.addPage()
    yPosition = 30
  }

  doc.setFont('helvetica', 'bold')
  doc.text('COMPLETION VERIFICATION', margin, yPosition)
  yPosition += 20

  doc.setFont('helvetica', 'normal')
  doc.text('Tenant Signature: ________________________________    Date: ___________', margin, yPosition)
  yPosition += 15
  doc.text('Landlord Signature: ________________________________    Date: ___________', margin, yPosition)
  yPosition += 20

  // Footer
  doc.setFontSize(10)
  doc.text('This checklist complies with Manitoba rental standards.', margin, yPosition)
  
  // Helpr branding in footer
  doc.setTextColor(59, 130, 246)
  doc.text('Generated by Helpr - Smart Rentals Platform', pageWidth / 2, yPosition + 12, { align: 'center' })
  doc.setTextColor(0, 0, 0)

  return doc
}
