import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/get-server-user';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const user = await getServerUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('document') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No document uploaded' }, { status: 400 });
    }

    // ** AI Vision Analysis Step **
    // In a real application, you would send the file to an AI service like GPT-4 Vision.
    // The AI would be prompted to return a JSON object with the name and address.
    // Example: `const aiResponse = await openai.chat.completions.create({...});`
    
    // For this demo, we will simulate a successful AI response with mock data.
    console.log('Simulating AI analysis of ID document:', file.name);
    const mockExtractedData = {
      fullName: 'John Doe', // This would come from the AI
      address: '123 Main St, Toronto, ON M5V 2N8', // This would also come from the AI
    };

    // ** Cross-Referencing Step **
    // Fetch the user's existing verification data to compare against.
    const existingUserData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        name: true,
        verificationData: true,
      },
    });

    const incomeAddressData = (existingUserData?.verificationData as any)?.income_address;

    if (!incomeAddressData?.address?.formatted) {
      console.error('Cross-referencing failed: Verified income/address data not found.');
      return NextResponse.json(
        { error: 'Income & Address must be verified before using Smart Scan.' },
        { status: 400 }
      );
    }

    const verifiedAddress = incomeAddressData.address.formatted;
    const verifiedName = existingUserData?.name;

    // Simple comparison logic (can be made more sophisticated with fuzzy matching)
    const isNameMatch = !!verifiedName && verifiedName.toLowerCase() === mockExtractedData.fullName.toLowerCase();
    const isAddressMatch = !!verifiedAddress && verifiedAddress.toLowerCase().includes(mockExtractedData.address.toLowerCase());

    console.log(`Cross-referencing results: Name match: ${isNameMatch}, Address match: ${isAddressMatch}`);

    if (isNameMatch && isAddressMatch) {
      // ** Automated Approval **
      const currentVerificationData = (existingUserData?.verificationData as any) || {};
      const updatedVerificationData = {
        ...currentVerificationData,
        id_smart_scan: {
          status: 'approved',
          extractedName: mockExtractedData.fullName,
          extractedAddress: mockExtractedData.address,
          matchedOn: new Date(),
        },
      };

      await prisma.user.update({
        where: { id: user.id },
        data: {
          idVerified: true,
          verificationData: updatedVerificationData,
        },
      });

      return NextResponse.json({
        status: 'approved',
        message: 'ID successfully verified and matched with your existing records.',
      });
    } else {
      // ** Flag for Manual Review **
      const currentVerificationData = (existingUserData?.verificationData as any) || {};
      const updatedVerificationData = {
        ...currentVerificationData,
        id_smart_scan: {
          status: 'rejected',
          reason: 'Mismatch found between ID and existing records.',
          extractedName: mockExtractedData.fullName,
          extractedAddress: mockExtractedData.address,
        },
      };

      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationData: updatedVerificationData,
        },
      });

      return NextResponse.json(
        { error: 'Could not automatically verify ID. A mismatch was found with your existing records. Please try again or submit for manual review.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('ID analysis error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during ID analysis.' },
      { status: 500 }
    );
  }
}
