import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { LeadStatus, ActivityType } from '@prisma/client'
import crypto from 'crypto'; // Added for UUID generation

// Schema for validation
const contactUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName:  z.string().min(1, "Last name is required"),
  email:     z.string().email("Invalid email address").optional().or(z.literal("")),
  phone:     z.string().optional().or(z.literal("")),
  address:   z.string().optional().or(z.literal("")),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    
    console.log("Contact update request for lead:", id);
    console.log("Contact data:", data);
    
    // If it's a temporary ID, handle it properly
    const isTemporaryId = id.startsWith("temp-");
    
    // 1. Auth check
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      )
    }

    // 2. Extract and validate ID
    if (!id) {
      return new NextResponse(
        JSON.stringify({ message: 'Lead ID is required' }),
        { status: 400 }
      )
    }

    // 3. Parse & validate body
    const result = contactUpdateSchema.safeParse(data)
    if (!result.success) {
      return new NextResponse(
        JSON.stringify({
          message: 'Invalid data',
          errors:  result.error.errors
        }),
        { status: 400 }
      )
    }

    // 4. Handle new‑lead (temp‑ID) vs existing
    if (isTemporaryId) {
      // ensure user exists
      const user = await prisma.user.findUnique({ where: { id: session.user.id } })
      if (!user) {
        console.error(`No user for ID ${session.user.id}`)
        return new NextResponse(
          JSON.stringify({ message: 'Assigned user not found' }),
          { status: 400 }
        )
      }

      const permanentLeadId = crypto.randomUUID(); // Generate permanent ID

      const newLead = await prisma.lead.create({
        data: {
          id: permanentLeadId, // Use permanent ID for creation
          firstName:    data.firstName,
          lastName:     data.lastName,
          email:        data.email,
          phone:        data.phone,
          address:      data.address,
          status:       LeadStatus.follow_ups,
          assignedToId: session.user.id,
        }
      })

      await prisma.activity.create({
        data: {
          type:        ActivityType.LEAD_CREATED,
          title:       'Lead created',
          description: `New lead for ${data.firstName} ${data.lastName}`,
          userId:      session.user.id,
          leadId:      permanentLeadId, // Use permanent ID for activity log
        }
      })

      return new NextResponse(
        JSON.stringify({
          message: 'Lead created successfully',
          lead: {
            id:        permanentLeadId, // Return permanent ID
            firstName: newLead.firstName,
            lastName:  newLead.lastName,
            email:     newLead.email,
            phone:     newLead.phone,
            address:   newLead.address
          }
        }),
        { status: 201 }
      )
    }

    // 5. Update existing
    const existing = await prisma.lead.findUnique({ where: { id } })
    if (!existing) {
      return new NextResponse(
        JSON.stringify({ message: 'Lead not found' }),
        { status: 404 }
      )
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName:  data.lastName,
        email:     data.email,
        phone:     data.phone,
        address:   data.address,
        updatedAt: new Date(),
      }
    })

    await prisma.activity.create({
      data: {
        type:        ActivityType.LEAD_UPDATED,
        title:       'Contact information updated',
        description: `Updated contact for ${data.firstName} ${data.lastName}`,
        userId:      session.user.id,
        leadId:      id,
      }
    })

    return NextResponse.json({
      message: 'Contact updated successfully',
      lead: {
        id:        updated.id,
        firstName: updated.firstName,
        lastName:  updated.lastName,
        email:     updated.email,
        phone:     updated.phone,
        address:   updated.address
      }
    })

  } catch (error) {
    // Improve error logging
    console.error("Error updating lead contact:", error);
    return NextResponse.json(
      { error: "Failed to update lead contact", details: error.message },
      { status: 500 }
    );
  }
}
