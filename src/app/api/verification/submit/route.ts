import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, generateEmailVerificationToken } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/send-verification-email';
import { uploadFile } from '@/lib/storage';
import { backgroundCheckService } from '@/lib/background-check-service';
import { documentAnalyzerService } from '@/lib/document-analyzer';
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

        const formData = await request.formData();
    const verificationType = formData.get('verificationType') as string;
    const data = JSON.parse(formData.get('data') as string);
    const documentFile = formData.get('document') as File | null;

    // Validate verification type
    const validTypes = ['email', 'phone', 'id', 'address', 'income', 'background', 'income_address']
    if (!validTypes.includes(verificationType)) {
      return NextResponse.json(
        { error: 'Invalid verification type' },
        { status: 400 }
      )
    }

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Parse existing verification data
    const existingData = currentUser.verificationData 
      ? JSON.parse(currentUser.verificationData) 
      : {}
    
    const existingDocs = currentUser.verificationDocs 
      ? JSON.parse(currentUser.verificationDocs) 
      : []

    // Update verification data
    const updatedData = {
      ...existingData,
      [verificationType]: {
        ...data,
        submittedAt: new Date().toISOString(),
        status: 'pending' // pending | approved | rejected
      }
    }


    // For development, auto-approve certain verifications
    const updateFields: any = {
      verificationData: JSON.stringify(updatedData)
    }

    // For email, send a verification link instead of auto-approving
    if (verificationType === 'email' && data.email === user.email) {
      const token = generateEmailVerificationToken(user.email);
      const host = request.headers.get('host')!;
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const baseUrl = `${protocol}://${host}`;
      
      await sendVerificationEmail(user.email, token, baseUrl);

      // Don't auto-approve, just mark as pending
      updatedData[verificationType].status = 'pending';
      
      // Update user data without changing verification status yet
      await prisma.user.update({
        where: { id: user.id },
        data: { verificationData: JSON.stringify(updatedData) }
      });

      return NextResponse.json({
        success: true,
        message: 'Verification email sent! Please check your inbox.',
        verificationType,
        status: 'pending_email'
      });
    }

    // For phone, generate a code and mark as pending
    if (verificationType === 'phone' && data.phone) {
      const phoneCode = Math.floor(100000 + Math.random() * 900000).toString();
      const codeExpires = new Date(Date.now() + 10 * 60 * 1000); // Code valid for 10 minutes

      updatedData[verificationType] = {
        ...updatedData[verificationType],
        phone: data.phone,
        status: 'pending_code',
        phoneCode,
        codeExpires: codeExpires.toISOString()
      };

      // In production, you would send this code via SMS
      console.log(`
=== PHONE VERIFICATION (Development Mode) ===`);
      console.log(`To: ${data.phone}`);
      console.log(`Verification Code: ${phoneCode}`);
      console.log(`=========================================\n`);

      updateFields.verificationData = JSON.stringify(updatedData);
      updateFields.phone = data.phone; // Update the phone number on the user record

      await prisma.user.update({
        where: { id: user.id },
        data: updateFields
      });

      return NextResponse.json({
        success: true,
        message: 'Verification code sent to your phone.',
        verificationType,
        status: 'pending_code'
      });
    }

    if (verificationType === 'id') {
      if (!documentFile) {
        return NextResponse.json({ error: 'ID verification requires a document.' }, { status: 400 });
      }
      const uploadResult = await uploadFile(documentFile);
      updatedData[verificationType].documentUrl = uploadResult.url;

      // Get previously verified data for cross-document validation
      const previouslyVerifiedData = {
        name: currentUser.name || data.idType, // Use provided name or fallback
        address: updatedData.address?.extractedAddress || updatedData.income?.extractedAddress
      };

      // Use AI to analyze ID with cross-document validation
      const idAnalysisResult = await documentAnalyzerService.analyzeID(
        uploadResult.url,
        currentUser.name || 'Unknown User',
        previouslyVerifiedData
      );

      updatedData[verificationType].status = idAnalysisResult.status;
      updatedData[verificationType].aiAnalysis = idAnalysisResult;

      if (idAnalysisResult.status === 'approved') {
        updateFields.idVerified = true;
        updatedData[verificationType].approvedAt = new Date().toISOString();
      }
    }

    if (verificationType === 'income_address') {
      if (!documentFile) {
        return NextResponse.json({ error: 'Income & Address verification requires a document.' }, { status: 400 });
      }
      const uploadResult = await uploadFile(documentFile);
      const fullAddress = `${data.street}, ${data.city}, ${data.postalCode}`;

      // Use AI to analyze the document for both income and address
      const analysisResult = await documentAnalyzerService.analyze(uploadResult.url, data.amount, fullAddress);

      // Update income verification
      updatedData.income = {
        ...(updatedData.income || {}),
        status: analysisResult.income.status,
        aiAnalysis: analysisResult.income,
        documentUrl: uploadResult.url,
      };
      if (analysisResult.income.status === 'approved') {
        updateFields.incomeVerified = true;
        updatedData.income.approvedAt = new Date().toISOString();
      }

      // Update address verification
      updatedData.address = {
        ...(updatedData.address || {}),
        status: analysisResult.address.status,
        aiAnalysis: analysisResult.address,
        documentUrl: uploadResult.url,
      };
      if (analysisResult.address.status === 'approved') {
        updateFields.addressVerified = true;
        updatedData.address.approvedAt = new Date().toISOString();
      }
    }

    if (verificationType === 'background' && data.consent) {
      // The initiateCheck service now handles its own state updates.
            await backgroundCheckService.initiateCheck(user.id, currentUser);
      // We don't need to modify updatedData here anymore for this type.
      // The response will be sent, and the webhook will handle the final status.
    }

    // Update verification data with new status
    updateFields.verificationData = JSON.stringify(updatedData)

    // Check if user should be marked as overall verified
    const verificationChecks = [
      updateFields.emailVerified ?? currentUser.emailVerified,
      updateFields.phoneVerified ?? currentUser.phoneVerified,
      updateFields.idVerified ?? currentUser.idVerified
    ]
    
    // User is verified if they have at least email, phone, and ID verified
    if (verificationChecks.every(Boolean)) {
      updateFields.verified = true
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateFields
    })

    return NextResponse.json({
      success: true,
      message: `${verificationType} verification submitted successfully`,
      verificationType,
      status: updatedData[verificationType].status
    })

  } catch (error) {
    console.error('Submit verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
