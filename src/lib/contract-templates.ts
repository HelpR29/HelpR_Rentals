export interface ContractTemplate {
  id: string
  name: string
  type: 'lease' | 'application' | 'inspection' | 'maintenance' | 'termination'
  jurisdiction: 'manitoba' | 'canada'
  content: string
  variables: ContractVariable[]
  legalReferences: string[]
  lastUpdated: Date
}

export interface ContractVariable {
  name: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'currency'
  required: boolean
  description: string
  defaultValue?: string
}

export class ContractTemplateManager {
  // 🏠 RESIDENTIAL LEASE TEMPLATE (MANITOBA)
  static getResidentialLeaseTemplate(): ContractTemplate {
    return {
      id: 'mb-residential-lease',
      name: 'Manitoba Residential Lease Agreement',
      type: 'lease',
      jurisdiction: 'manitoba',
      content: `RESIDENTIAL TENANCY AGREEMENT
Province of Manitoba

This agreement is made between:

LANDLORD: {{landlordName}}
Address: {{landlordAddress}}
Phone: {{landlordPhone}}
Email: {{landlordEmail}}

TENANT: {{tenantName}}
Phone: {{tenantPhone}}
Email: {{tenantEmail}}

RENTAL PROPERTY:
Address: {{propertyAddress}}
Unit: {{unitNumber}}
City: {{city}}, Manitoba
Postal Code: {{postalCode}}

TERMS AND CONDITIONS:

1. RENT AND PAYMENT
   - Monthly Rent: ${{monthlyRent}}
   - Due Date: {{rentDueDate}} of each month
   - Payment Method: {{paymentMethod}}
   - Late Fee: ${{lateFee}} after {{gracePeriod}} days

2. SECURITY DEPOSIT
   - Amount: ${{securityDeposit}}
   - Held in trust as per Manitoba Residential Tenancies Act
   - Interest rate: {{interestRate}}% annually

3. LEASE TERM
   - Start Date: {{leaseStartDate}}
   - End Date: {{leaseEndDate}}
   - Term: {{leaseTerm}} months

4. UTILITIES AND SERVICES
   {{#if utilitiesIncluded}}
   - Utilities Included: {{utilitiesList}}
   {{else}}
   - Tenant responsible for all utilities
   {{/if}}

5. PROPERTY CONDITION
   - Furnished: {{#if furnished}}Yes{{else}}No{{/if}}
   - Pets Allowed: {{#if petsAllowed}}Yes - with ${{petDeposit}} deposit{{else}}No{{/if}}
   - Smoking: {{#if smokingAllowed}}Permitted{{else}}Prohibited{{/if}}

6. MAINTENANCE AND REPAIRS
   - Landlord responsible for: Major repairs, structural issues, heating system
   - Tenant responsible for: Minor repairs under ${{minorRepairLimit}}, cleaning, lawn care

7. ENTRY AND INSPECTION
   - 24-hour notice required except in emergencies
   - Quarterly inspections permitted with notice

8. TERMINATION
   - {{terminationNotice}} days written notice required
   - Early termination fee: ${{earlyTerminationFee}}

9. LEGAL COMPLIANCE
   This agreement is governed by the Manitoba Residential Tenancies Act and regulations.

SIGNATURES:

Landlord: _________________________ Date: _________
{{landlordName}}

Tenant: _________________________ Date: _________
{{tenantName}}

Witness: _________________________ Date: _________`,
      variables: [
        { name: 'landlordName', type: 'text', required: true, description: 'Full name of landlord' },
        { name: 'landlordAddress', type: 'text', required: true, description: 'Landlord contact address' },
        { name: 'landlordPhone', type: 'text', required: true, description: 'Landlord phone number' },
        { name: 'landlordEmail', type: 'text', required: true, description: 'Landlord email address' },
        { name: 'tenantName', type: 'text', required: true, description: 'Full name of tenant' },
        { name: 'tenantPhone', type: 'text', required: true, description: 'Tenant phone number' },
        { name: 'tenantEmail', type: 'text', required: true, description: 'Tenant email address' },
        { name: 'propertyAddress', type: 'text', required: true, description: 'Full property address' },
        { name: 'unitNumber', type: 'text', required: false, description: 'Unit/apartment number' },
        { name: 'city', type: 'text', required: true, description: 'City name', defaultValue: 'Winnipeg' },
        { name: 'postalCode', type: 'text', required: true, description: 'Postal code' },
        { name: 'monthlyRent', type: 'currency', required: true, description: 'Monthly rent amount' },
        { name: 'rentDueDate', type: 'number', required: true, description: 'Day of month rent is due', defaultValue: '1' },
        { name: 'paymentMethod', type: 'text', required: true, description: 'How rent should be paid', defaultValue: 'E-transfer' },
        { name: 'lateFee', type: 'currency', required: true, description: 'Late payment fee', defaultValue: '25' },
        { name: 'gracePeriod', type: 'number', required: true, description: 'Grace period in days', defaultValue: '5' },
        { name: 'securityDeposit', type: 'currency', required: true, description: 'Security deposit amount' },
        { name: 'interestRate', type: 'number', required: true, description: 'Interest rate on deposit', defaultValue: '1.0' },
        { name: 'leaseStartDate', type: 'date', required: true, description: 'Lease start date' },
        { name: 'leaseEndDate', type: 'date', required: true, description: 'Lease end date' },
        { name: 'leaseTerm', type: 'number', required: true, description: 'Lease term in months', defaultValue: '12' },
        { name: 'utilitiesIncluded', type: 'boolean', required: true, description: 'Are utilities included?' },
        { name: 'utilitiesList', type: 'text', required: false, description: 'List of included utilities' },
        { name: 'furnished', type: 'boolean', required: true, description: 'Is property furnished?' },
        { name: 'petsAllowed', type: 'boolean', required: true, description: 'Are pets allowed?' },
        { name: 'petDeposit', type: 'currency', required: false, description: 'Pet deposit amount', defaultValue: '200' },
        { name: 'smokingAllowed', type: 'boolean', required: true, description: 'Is smoking allowed?' },
        { name: 'minorRepairLimit', type: 'currency', required: true, description: 'Tenant repair responsibility limit', defaultValue: '100' },
        { name: 'terminationNotice', type: 'number', required: true, description: 'Notice period in days', defaultValue: '30' },
        { name: 'earlyTerminationFee', type: 'currency', required: true, description: 'Early termination penalty', defaultValue: '500' }
      ],
      legalReferences: [
        'Manitoba Residential Tenancies Act C.C.S.M. c. R119',
        'Manitoba Regulation 300/87',
        'Residential Tenancies Branch Guidelines'
      ],
      lastUpdated: new Date()
    }
  }

  // 📝 RENTAL APPLICATION TEMPLATE
  static getRentalApplicationTemplate(): ContractTemplate {
    return {
      id: 'mb-rental-application',
      name: 'Rental Application Form',
      type: 'application',
      jurisdiction: 'manitoba',
      content: `RENTAL APPLICATION
{{propertyAddress}}

APPLICANT INFORMATION:
Full Name: {{applicantName}}
Date of Birth: {{dateOfBirth}}
Phone: {{phone}}
Email: {{email}}
Current Address: {{currentAddress}}
Move-in Date: {{moveInDate}}

EMPLOYMENT INFORMATION:
Employer: {{employer}}
Position: {{position}}
Monthly Income: ${{monthlyIncome}}
Employment Duration: {{employmentDuration}}

RENTAL HISTORY:
Previous Landlord: {{previousLandlord}}
Previous Address: {{previousAddress}}
Rent Amount: ${{previousRent}}
Reason for Moving: {{reasonForMoving}}

REFERENCES:
1. {{reference1Name}} - {{reference1Phone}}
2. {{reference2Name}} - {{reference2Phone}}

ADDITIONAL OCCUPANTS:
{{additionalOccupants}}

PETS:
{{petInformation}}

I certify that the information provided is true and complete.

Signature: _________________________ Date: _________
{{applicantName}}`,
      variables: [
        { name: 'propertyAddress', type: 'text', required: true, description: 'Property being applied for' },
        { name: 'applicantName', type: 'text', required: true, description: 'Full name of applicant' },
        { name: 'dateOfBirth', type: 'date', required: true, description: 'Date of birth' },
        { name: 'phone', type: 'text', required: true, description: 'Phone number' },
        { name: 'email', type: 'text', required: true, description: 'Email address' },
        { name: 'currentAddress', type: 'text', required: true, description: 'Current address' },
        { name: 'moveInDate', type: 'date', required: true, description: 'Desired move-in date' },
        { name: 'employer', type: 'text', required: true, description: 'Current employer' },
        { name: 'position', type: 'text', required: true, description: 'Job position' },
        { name: 'monthlyIncome', type: 'currency', required: true, description: 'Monthly gross income' },
        { name: 'employmentDuration', type: 'text', required: true, description: 'How long at current job' },
        { name: 'previousLandlord', type: 'text', required: false, description: 'Previous landlord name' },
        { name: 'previousAddress', type: 'text', required: false, description: 'Previous rental address' },
        { name: 'previousRent', type: 'currency', required: false, description: 'Previous rent amount' },
        { name: 'reasonForMoving', type: 'text', required: false, description: 'Reason for leaving previous rental' },
        { name: 'reference1Name', type: 'text', required: true, description: 'First reference name' },
        { name: 'reference1Phone', type: 'text', required: true, description: 'First reference phone' },
        { name: 'reference2Name', type: 'text', required: true, description: 'Second reference name' },
        { name: 'reference2Phone', type: 'text', required: true, description: 'Second reference phone' },
        { name: 'additionalOccupants', type: 'text', required: false, description: 'Other people living in unit' },
        { name: 'petInformation', type: 'text', required: false, description: 'Pet details if applicable' }
      ],
      legalReferences: [
        'Manitoba Human Rights Code',
        'Personal Information Protection Act'
      ],
      lastUpdated: new Date()
    }
  }

  // 🔄 TEMPLATE PROCESSING
  static processTemplate(template: ContractTemplate, variables: Record<string, any>): string {
    let processedContent = template.content

    // Replace simple variables
    template.variables.forEach(variable => {
      const value = variables[variable.name] || variable.defaultValue || ''
      const placeholder = `{{${variable.name}}}`
      processedContent = processedContent.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value.toString())
    })

    // Process conditional statements
    processedContent = this.processConditionals(processedContent, variables)

    return processedContent
  }

  private static processConditionals(content: string, variables: Record<string, any>): string {
    // Handle {{#if variable}} ... {{else}} ... {{/if}} blocks
    const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g
    
    return content.replace(ifRegex, (match, variable, ifContent, elseContent = '') => {
      const value = variables[variable]
      return value ? ifContent : elseContent
    })
  }
}

export const contractTemplates = {
  residentialLease: ContractTemplateManager.getResidentialLeaseTemplate(),
  rentalApplication: ContractTemplateManager.getRentalApplicationTemplate()
}
