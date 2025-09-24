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
  landlordSignatureDataUrl?: string
  tenantSignatureDataUrl?: string
  signatureDate?: string
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

  // Official Manitoba Form Header
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('SCHEDULE', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 15
  
  doc.setFontSize(12)
  doc.text('Form 1', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 15
  
  doc.setFontSize(14)
  doc.text('Standard Residential Tenancy Agreement', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 20

  // Legal Preamble (from official form)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const preamble = 'This form of Tenancy Agreement is prescribed under The Residential Tenancies Act (the Act) and applies to all residential tenancies in Manitoba, other than tenancies that include tenant services or tenancies respecting a mobile home, mobile home site, or both. Two copies must be signed by both landlord and tenant. One copy must be given to the tenant within 21 days after it is signed.'
  const preambleLines = doc.splitTextToSize(preamble, pageWidth - 2 * margin)
  doc.text(preambleLines, margin, yPosition)
  yPosition += preambleLines.length * 5 + 15

  doc.text('This Tenancy Agreement is made in duplicate between:', margin, yPosition)
  yPosition += 20

  // Parties Section (Official Form Format)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  
  // Landlord line with underline
  const landlordText = `${data.landlordName || '_'.repeat(50)}, the Landlord`
  doc.text(landlordText, margin, yPosition)
  doc.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2) // Underline
  yPosition += 10
  doc.setFontSize(9)
  doc.text('(Legal name, address and telephone number of landlord(s))', margin, yPosition)
  yPosition += 20

  doc.setFontSize(11)
  doc.text('and', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 20

  // Tenant line with underline
  const tenantText = `${data.tenantName || '_'.repeat(50)}, the Tenant`
  doc.text(tenantText, margin, yPosition)
  doc.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2) // Underline
  yPosition += 10
  doc.setFontSize(9)
  doc.text('Name of tenant(s)', margin, yPosition)
  yPosition += 25

  // 1. Rental Unit Section (Official Form)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('1. Rental Unit', margin, yPosition)
  yPosition += 15

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('The landlord agrees to rent to the tenant the rental unit at the following location:', margin, yPosition)
  yPosition += 15

  // Property address with underline
  const addressText = data.propertyAddress || '_'.repeat(60)
  doc.text(addressText, margin, yPosition)
  doc.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2) // Full width underline
  yPosition += 10
  doc.setFontSize(9)
  doc.text('Address', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 20

  // Condominium checkbox
  doc.setFontSize(11)
  doc.text('The unit is registered as a condominium', margin, yPosition)
  doc.rect(margin + 85, yPosition - 4, 4, 4) // Yes checkbox
  doc.text('Yes', margin + 95, yPosition)
  doc.rect(margin + 115, yPosition - 4, 4, 4) // No checkbox  
  doc.text('No', margin + 125, yPosition)
  yPosition += 15

  // Condominium note
  doc.setFontSize(9)
  const condoNote = 'Note: If the unit is registered as a condominium, the unit may be sold. If it is sold and the purchaser wants to move in, the tenant may be given notice to move, subject to this agreement and any rights or covenants living in the unit the tenant may have under The Residential Tenancies Act or The Condominium Act.'
  const condoNoteLines = doc.splitTextToSize(condoNote, pageWidth - 2 * margin)
  doc.text(condoNoteLines, margin, yPosition)
  yPosition += condoNoteLines.length * 4 + 20

  // 2. Term of Tenancy (Official Form)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('2. Term of Tenancy', margin, yPosition)
  yPosition += 15

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Complete either (a) or (b), but not both:', margin, yPosition)
  yPosition += 15

  // (a) Fixed Term Tenancy
  doc.setFont('helvetica', 'bold')
  doc.text('(a) Fixed Term Tenancy', margin, yPosition)
  yPosition += 10

  doc.setFont('helvetica', 'normal')
  const startDate = data.leaseStartDate || '_'.repeat(15)
  const endDate = '_'.repeat(15)
  doc.text(`The tenancy is for a fixed term beginning on ${startDate}, 20___ and ending on ${endDate}, 20___`, margin, yPosition)
  yPosition += 8

  const renewalText = 'Unless the tenancy has been terminated in accordance with the Act, the landlord shall offer the tenant a renewal of this agreement at least three months before the date the agreement ends. If the tenant does not sign and return the renewal at least two months before the date this agreement ends, this agreement will expire on that date.'
  const renewalLines = doc.splitTextToSize(renewalText, pageWidth - 2 * margin)
  doc.text(renewalLines, margin, yPosition)
  yPosition += renewalLines.length * 5 + 15

  // (b) Periodic Tenancy
  doc.setFont('helvetica', 'bold')
  doc.text('(b) Periodic Tenancy', margin, yPosition)
  yPosition += 10

  doc.setFont('helvetica', 'normal')
  doc.text(`The tenancy is periodic, beginning on ${startDate}, 20___ and continuing from (week to week, month to month, or other period)`, margin, yPosition)
  yPosition += 20

  // 3. Deposit Required
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('3. Deposit Required (maximum = ½ month\'s Rent Payable for security deposit, 1 month\'s Rent Payable for pet damage deposit)', margin, yPosition)
  yPosition += 15

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('The landlord acknowledges receipt from the tenant of:', margin, yPosition)
  yPosition += 10

  const securityAmount = data.securityDeposit || '_'.repeat(10)
  doc.text(`☐ a security deposit of $ ${securityAmount} on ____________, 20___`, margin, yPosition)
  yPosition += 8
  doc.text(`☐ a pet damage deposit of $ ____________ on ____________, 20___`, margin, yPosition)
  yPosition += 20

  // 4. Rent Payable
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('4. Rent Payable', margin, yPosition)
  yPosition += 15

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  const monthlyRent = data.monthlyRent || '_'.repeat(10)
  doc.text(`The tenant agrees to pay rent in the amount of $ ${monthlyRent} per month.`, margin, yPosition)
  yPosition += 10
  doc.text('Rent is payable in advance on the first day of each month.', margin, yPosition)
  yPosition += 10
  doc.text('The first month\'s rent is due on or before the commencement of the tenancy.', margin, yPosition)
  yPosition += 20

  // 5. Method of Rent Payment
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('5. Method of Rent Payment', margin, yPosition)
  yPosition += 12

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('The following payment methods may be used (check applicable):', margin, yPosition)
  yPosition += 10
  doc.text('☐ e-Transfer to: ____________________________', margin, yPosition)
  yPosition += 8
  doc.text('☐ Pre-authorized debit    ☐ Post-dated cheques', margin, yPosition)
  yPosition += 8
  doc.text('☐ Online portal           ☐ Other: ____________________________', margin, yPosition)
  yPosition += 8
  doc.setFontSize(9)
  doc.text('Note: Tenant is entitled to a rent receipt upon request. Keep receipts for all payments.', margin, yPosition)
  yPosition += 16

  // 6. Maintenance and Repairs
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('6. Maintenance and Repairs', margin, yPosition)
  yPosition += 12

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  const maintIntro = 'The landlord must keep the rental unit in good repair and comply with health, building and housing standards. The tenant must keep the unit reasonably clean, promptly report needed repairs, and not cause damage or permit damage by others.'
  let maintLines = doc.splitTextToSize(maintIntro, pageWidth - 2 * margin)
  doc.text(maintLines, margin, yPosition)
  yPosition += maintLines.length * 6 + 6

  doc.setFont('helvetica', 'bold')
  doc.text('Tenant Responsibilities include:', margin, yPosition)
  yPosition += 8
  doc.setFont('helvetica', 'normal')
  const tenantResp = [
    '• Keeping the unit clean and sanitary',
    '• Replacing light bulbs and smoke detector batteries where accessible',
    '• Notifying the landlord in a timely manner of issues requiring repair',
    '• Using appliances and fixtures reasonably and safely'
  ]
  tenantResp.forEach(item => { doc.text(item, margin + 5, yPosition); yPosition += 6 })
  yPosition += 6

  doc.setFont('helvetica', 'bold')
  doc.text('Landlord Responsibilities include:', margin, yPosition)
  yPosition += 8
  doc.setFont('helvetica', 'normal')
  const landlordResp = [
    '• Repairing structural elements, plumbing, heating and electrical systems',
    '• Maintaining provided appliances in working order',
    '• Ensuring compliance with health, safety and housing standards',
    '• Providing and maintaining smoke/carbon monoxide detectors as required'
  ]
  landlordResp.forEach(item => { doc.text(item, margin + 5, yPosition); yPosition += 6 })
  yPosition += 14

  // 7. Pets and Smoking Policies
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('7. Pets and Smoking Policies', margin, yPosition)
  yPosition += 12

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Pets: ☐ Allowed    ☐ Not Allowed   (If allowed, a pet damage deposit may be required where permitted by law)', margin, yPosition)
  yPosition += 8
  doc.text('Smoking/Vaping: ☐ Allowed    ☐ Not Allowed   (Restrictions may apply pursuant to posted building rules/bylaws)', margin, yPosition)
  yPosition += 18

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

  // Signatures and E‑Sign Support
  doc.setFont('helvetica', 'bold')
  doc.text('SIGNATURES AND ACKNOWLEDGMENTS', margin, yPosition)
  yPosition += 14

  doc.setFont('helvetica', 'normal')
  const sigDate = data.signatureDate || '____________'

  // Landlord signature box
  doc.text('Landlord Signature:', margin, yPosition)
  doc.rect(margin + 48, yPosition - 6, 60, 20)
  try { if (data.landlordSignatureDataUrl) doc.addImage(data.landlordSignatureDataUrl, undefined as any, margin + 50, yPosition - 5, 56, 16) } catch {}
  doc.text(`Date: ${sigDate}`, margin + 115, yPosition + 10)
  yPosition += 28

  // Tenant signature box
  doc.text('Tenant Signature:', margin, yPosition)
  doc.rect(margin + 48, yPosition - 6, 60, 20)
  try { if (data.tenantSignatureDataUrl) doc.addImage(data.tenantSignatureDataUrl, undefined as any, margin + 50, yPosition - 5, 56, 16) } catch {}
  doc.text(`Date: ${sigDate}`, margin + 115, yPosition + 10)
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
