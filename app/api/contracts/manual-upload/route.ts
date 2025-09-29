import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  console.log('📄 Creating manual contract upload record');
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leadId, fileName, pdfUrl } = await req.json();
    
    if (!leadId || !fileName) {
      return NextResponse.json({ 
        error: 'Lead ID and file name are required' 
      }, { status: 400 });
    }

    // Check if lead exists
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, firstName: true, lastName: true }
    });

    if (!lead) {
      return NextResponse.json({ 
        error: 'Lead not found' 
      }, { status: 404 });
    }

    // Create contract record
    const contract = await prisma.contract.create({
      data: {
        leadId: leadId,
        contractType: 'manual_upload',
        signatures: { uploadedBy: session.user.name || session.user.email || 'user' },
        dates: { uploadedAt: new Date().toISOString() },
        names: { 
          fileName: fileName,
          clientName: `${lead.firstName || ''} ${lead.lastName || ''}`.trim()
        },
        addresses: {},
        contactInfo: {},
        pdfUrl: pdfUrl || null,
        status: 'completed'
      }
    });

    console.log('✅ Manual contract record created:', contract.id);
    
    return NextResponse.json({ 
      success: true, 
      contractId: contract.id,
      message: 'Contract marked as completed'
    });

  } catch (error) {
    console.error('❌ Error creating manual contract record:', error);
    return NextResponse.json({ 
      error: 'Failed to create contract record',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 