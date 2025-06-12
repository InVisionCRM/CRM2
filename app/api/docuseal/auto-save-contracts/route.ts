import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  console.log('🔵 Manual contract auto-save triggered');
  
  try {
    const { submissionId, leadEmail } = await req.json();
    
    if (!process.env.DOCUSEAL_URL || !process.env.DOCUSEAL_API_KEY) {
      return NextResponse.json({ 
        error: 'DocuSeal configuration missing' 
      }, { status: 500 });
    }

    let submissionsToProcess = [];

    if (submissionId) {
      // Handle single submission by ID (existing functionality)
      const submissionResponse = await fetch(
        `${process.env.DOCUSEAL_URL}/api/submissions/${submissionId}`,
        {
          headers: {
            'X-Auth-Token': process.env.DOCUSEAL_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!submissionResponse.ok) {
        throw new Error(`Failed to fetch submission: ${submissionResponse.statusText}`);
      }

      const submission = await submissionResponse.json();
      submissionsToProcess = [submission];
      
    } else if (leadEmail) {
      // Handle multiple submissions by lead email (new functionality)
      console.log('🔍 Fetching completed contracts for lead:', leadEmail);
      
      const submissionsResponse = await fetch(
        `${process.env.DOCUSEAL_URL}/api/submissions?limit=50`,
        {
          headers: {
            'X-Auth-Token': process.env.DOCUSEAL_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!submissionsResponse.ok) {
        throw new Error(`Failed to fetch submissions: ${submissionsResponse.statusText}`);
      }

      const submissionsData = await submissionsResponse.json();
      const allSubmissions = Array.isArray(submissionsData) ? submissionsData : submissionsData.data || [];
      
      // Filter for completed submissions matching the lead email
      submissionsToProcess = allSubmissions.filter((submission: any) => {
        const hasMatchingEmail = submission.submitters?.some((submitter: any) => 
          submitter.email?.toLowerCase() === leadEmail.toLowerCase()
        );
        return hasMatchingEmail && submission.status === 'completed';
      });

      console.log(`📋 Found ${submissionsToProcess.length} completed contracts for ${leadEmail}`);
      
    } else {
      return NextResponse.json({ 
        error: 'Either submissionId or leadEmail is required' 
      }, { status: 400 });
    }

    if (submissionsToProcess.length === 0) {
      return NextResponse.json({ 
        error: 'No completed submissions found',
        savedCount: 0
      }, { status: 404 });
    }

    let savedCount = 0;
    let errors = [];

    // Process each completed submission
    for (const submission of submissionsToProcess) {
      try {
        console.log(`📄 Processing submission ${submission.id} - ${submission.status}`);
        
        if (submission.status !== 'completed') {
          console.log(`⏭️ Skipping submission ${submission.id} - not completed (${submission.status})`);
          continue;
        }

        // Create webhook payload format
        const webhookPayload = {
          event_type: 'submission.completed',
          timestamp: new Date().toISOString(),
          data: {
            id: submission.id,
            name: submission.name,
            slug: submission.slug,
            status: submission.status,
            audit_log_url: submission.audit_log_url,
            combined_document_url: submission.combined_document_url,
            completed_at: submission.completed_at,
            submitters: submission.submitters?.map((s: any) => ({
              id: s.id,
              email: s.email,
              name: s.name,
              completed_at: s.completed_at,
              status: s.status
            })) || [],
            template: submission.template ? {
              id: submission.template.id,
              name: submission.template.name,
              folder_name: submission.template.folder_name
            } : null
          }
        };

        // Call our webhook handler internally
        const webhookResponse = await fetch(`${new URL(req.url).origin}/api/webhooks/docuseal`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(webhookPayload)
        });

        const webhookResult = await webhookResponse.json();

        if (webhookResponse.ok) {
          console.log(`✅ Successfully processed submission ${submission.id}`);
          savedCount++;
        } else {
          console.error(`❌ Failed to process submission ${submission.id}:`, webhookResult);
          errors.push(`Submission ${submission.id}: ${webhookResult.error || 'Unknown error'}`);
        }

      } catch (submissionError) {
        console.error(`💥 Error processing submission ${submission.id}:`, submissionError);
        errors.push(`Submission ${submission.id}: ${submissionError instanceof Error ? submissionError.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: savedCount > 0,
      message: `${savedCount} contract(s) auto-saved successfully`,
      savedCount,
      totalProcessed: submissionsToProcess.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('💥 Error in manual contract auto-save:', error);
    
    return NextResponse.json({ 
      error: 'Failed to auto-save contract',
      details: error instanceof Error ? error.message : 'Unknown error',
      savedCount: 0
    }, { status: 500 });
  }
} 