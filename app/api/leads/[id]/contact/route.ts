import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for validation
const contactUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      )
    }

    // Get the lead ID from params
    const { id } = params
    if (!id) {
      return new NextResponse(
        JSON.stringify({ message: 'Lead ID is required' }),
        { status: 400 }
      )
    }

    // Parse and validate the request body
    const body = await request.json()
    const validationResult = contactUpdateSchema.safeParse(body)
    
    if (!validationResult.success) {
      return new NextResponse(
        JSON.stringify({ 
          message: 'Invalid data', 
          errors: validationResult.error.errors 
        }),
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id }
    })

    if (!existingLead) {
      return new NextResponse(
        JSON.stringify({ message: 'Lead not found' }),
        { status: 404 }
      )
    }

    // Update the lead contact information
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        updatedAt: new Date()
      }
    })

    // Create activity log for this update
    await prisma.activity.create({
      data: {
        type: 'LEAD_UPDATED',
        title: 'Contact information updated',
        description: `Contact information updated for ${data.firstName} ${data.lastName}`,
        userId: session.user.id,
        leadId: id,
        status: 'COMPLETED'
      }
    })

    return NextResponse.json({ 
      message: 'Contact information updated successfully',
      lead: {
        id: updatedLead.id,
        firstName: updatedLead.firstName,
        lastName: updatedLead.lastName,
        email: updatedLead.email,
        phone: updatedLead.phone,
        address: updatedLead.address
      }
    })
  } catch (error) {
    console.error('Error updating lead contact information:', error)
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    )
  }
}
