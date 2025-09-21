// This is a mock service that simulates using an AI model (like GPT-4 with Vision)
// to analyze an income document (e.g., a pay stub).

export interface DocumentAnalysisResult {
  income: {
    status: 'approved' | 'pending';
    reason: string;
    extractedIncome?: number;
    confidenceScore?: number;
  };
  address: {
    status: 'approved' | 'pending';
    reason: string;
    extractedAddress?: string;
    confidenceScore?: number;
  };
}

export interface IDAnalysisResult {
  status: 'approved' | 'pending' | 'rejected';
  reason: string;
  extractedName?: string;
  extractedAddress?: string;
  extractedDOB?: string;
  idNumber?: string;
  confidenceScore?: number;
  crossDocumentValidation?: {
    nameMatch: boolean;
    addressMatch: boolean;
    overallMatch: boolean;
    confidenceScore: number;
    discrepancies: string[];
  };
}

class DocumentAnalyzerService {
  async analyze(documentUrl: string, statedIncome: number, statedAddress: string): Promise<DocumentAnalysisResult> {
    console.log(`[DocumentAnalyzer] Analyzing document: ${documentUrl} for income: ${statedIncome} and address: ${statedAddress}`);

    // In a real application, you would:
    // 1. Download the document from storage (e.g., S3).
    // 2. Send the document image/PDF to an AI vision model.
    // 3. The AI would extract text and identify key fields (name, employer, net pay, pay period).
    // 4. You would calculate the annual income based on the extracted data.

    // --- MOCK SIMULATION ---
    const incomeResult = this.analyzeIncome(statedIncome);
    const addressResult = this.analyzeAddress(statedAddress);

    return { income: incomeResult, address: addressResult };
  }

  private analyzeIncome(statedIncome: number): DocumentAnalysisResult['income'] {
    const isConfident = Math.random() > 0.3; // 70% chance
    if (isConfident) {
      const incomeVariance = (Math.random() - 0.5) * 0.2; // +/- 10%
      const extractedIncome = statedIncome * (1 + incomeVariance);
      if (Math.abs(extractedIncome - statedIncome) / statedIncome <= 0.15) {
        return {
          status: 'approved',
          reason: 'AI analysis confirmed income.',
          extractedIncome,
          confidenceScore: Math.random() * (100 - 85) + 85,
        };
      }
    }
    return {
      status: 'pending',
      reason: 'AI analysis inconclusive for income.',
      confidenceScore: Math.random() * (80 - 40) + 40,
    };
  }

  private analyzeAddress(statedAddress: string): DocumentAnalysisResult['address'] {
    const isConfident = Math.random() > 0.5; // 50% chance
    if (isConfident) {
      // For simplicity, we'll assume the AI can read it perfectly if confident
      return {
        status: 'approved',
        reason: 'AI analysis confirmed address.',
        extractedAddress: statedAddress,
        confidenceScore: Math.random() * (100 - 90) + 90,
      };
    }
    return {
      status: 'pending',
      reason: 'AI analysis inconclusive for address.',
      confidenceScore: Math.random() * (70 - 30) + 30,
    };
  }

  async analyzeID(
    idDocumentUrl: string, 
    userProvidedName: string,
    previouslyVerifiedData?: {
      address?: string;
      name?: string;
    }
  ): Promise<IDAnalysisResult> {
    console.log(`[DocumentAnalyzer] Analyzing ID document: ${idDocumentUrl} for user: ${userProvidedName}`);

    // In a real application, you would:
    // 1. Download the ID document from storage
    // 2. Send to AI vision model (GPT-4 Vision, AWS Textract, etc.)
    // 3. Extract: name, address, DOB, ID number, photo
    // 4. Cross-reference with previously verified documents
    // 5. Perform facial recognition if photo available

    // --- MOCK SIMULATION ---
    const extractionConfidence = Math.random(); // 0-1

    // Simulate AI extracting information from ID
    const extractedName = this.simulateNameExtraction(userProvidedName);
    const extractedAddress = previouslyVerifiedData?.address || "123 Main St, City, 12345";
    const extractedDOB = "1990-01-01";
    const idNumber = "DL" + Math.floor(Math.random() * 1000000);

    // Perform cross-document validation if we have previous data
    let crossDocumentValidation;
    if (previouslyVerifiedData) {
      crossDocumentValidation = this.performCrossDocumentValidation(
        extractedName,
        extractedAddress,
        previouslyVerifiedData
      );
    }

    // Determine status based on extraction confidence and cross-validation
    let status: 'approved' | 'pending' | 'rejected';
    let reason: string;

    if (extractionConfidence > 0.8 && crossDocumentValidation?.overallMatch) {
      status = 'approved';
      reason = 'AI successfully verified ID and cross-validated with previous documents.';
    } else if (extractionConfidence > 0.5) {
      status = 'pending';
      reason = crossDocumentValidation?.overallMatch === false 
        ? 'ID extracted but discrepancies found with previous documents. Manual review required.'
        : 'ID partially readable. Manual review required for verification.';
    } else {
      status = 'rejected';
      reason = 'ID document quality too poor for AI analysis. Please upload a clearer image.';
    }

    return {
      status,
      reason,
      extractedName,
      extractedAddress,
      extractedDOB,
      idNumber,
      confidenceScore: Math.round(extractionConfidence * 100),
      crossDocumentValidation
    };
  }

  private simulateNameExtraction(providedName: string): string {
    // Simulate AI extracting name with potential variations
    const variations = [
      providedName,
      providedName.toUpperCase(),
      providedName.split(' ').reverse().join(', '), // Last, First format
    ];
    return variations[Math.floor(Math.random() * variations.length)];
  }

  private performCrossDocumentValidation(
    extractedName: string,
    extractedAddress: string,
    previousData: { address?: string; name?: string }
  ) {
    const discrepancies: string[] = [];
    
    // Name matching (fuzzy logic simulation)
    const nameMatch = this.fuzzyMatch(extractedName, previousData.name || '');
    if (!nameMatch) {
      discrepancies.push(`Name mismatch: ID shows "${extractedName}", previous documents show "${previousData.name}"`);
    }

    // Address matching (fuzzy logic simulation)  
    const addressMatch = this.fuzzyMatch(extractedAddress, previousData.address || '');
    if (!addressMatch) {
      discrepancies.push(`Address mismatch: ID shows "${extractedAddress}", previous documents show "${previousData.address}"`);
    }

    const overallMatch = nameMatch && addressMatch;
    const confidenceScore = (nameMatch ? 50 : 0) + (addressMatch ? 50 : 0);

    return {
      nameMatch,
      addressMatch,
      overallMatch,
      confidenceScore,
      discrepancies
    };
  }

  private fuzzyMatch(str1: string, str2: string): boolean {
    // Simple fuzzy matching simulation
    // In reality, you'd use sophisticated string matching algorithms
    const normalized1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalized2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Allow for 80% similarity
    const similarity = this.calculateSimilarity(normalized1, normalized2);
    return similarity > 0.8;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance approximation
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    // Simple implementation for demo purposes
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }
}
export const documentAnalyzerService = new DocumentAnalyzerService();
