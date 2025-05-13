import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for validation
const adjusterUpdateSchema = z.object({
  insuranceAdjusterName: z.string().optional().or(z.literal("")),
  insuranceAdjusterPhone: z.string().optional().or(z.literal("")),
  insuranceAdjusterEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  adjusterAppointmentDate: z.string().optional().or(z.literal("")),
  adjusterAppointmentTime: z.string().optional().or(z.literal("")),
  adjusterAppointmentNotes: z.string().optional().or(z.literal(""))
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
    const validationResult = adjusterUpdateSchema.safeParse(body)
    
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

    // Convert appointment date string to DateTime if provided
    let appointmentDate = undefined
    if (data.adjusterAppointmentDate && data.adjusterAppointmentDate.trim() !== '') {
      appointmentDate = new Date(data.adjusterAppointmentDate)
    }

    // Update the lead adjuster information
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        insuranceAdjusterName: data.insuranceAdjusterName,
        insuranceAdjusterPhone: data.insuranceAdjusterPhone,
        insuranceAdjusterEmail: data.insuranceAdjusterEmail,
        adjusterAppointmentDate: appointmentDate,
        adjusterAppointmentTime: data.adjusterAppointmentTime,
        adjusterAppointmentNotes: data.adjusterAppointmentNotes,
        updatedAt: new Date()
      }
    })

    // Create activity log for this update
    await prisma.activity.create({
      data: {
        type: 'LEAD_UPDATED',
        title: 'Adjuster information updated',
        description: `Adjuster information updated for lead ${id}`,
        userId: session.user.id,
        leadId: id,
      }
    })

    return NextResponse.json({ 
      message: 'Adjuster information updated successfully',
      lead: {
        id: updatedLead.id,
        insuranceAdjusterName: updatedLead.insuranceAdjusterName,
        insuranceAdjusterPhone: updatedLead.insuranceAdjusterPhone,
        insuranceAdjusterEmail: updatedLead.insuranceAdjusterEmail,
        adjusterAppointmentDate: updatedLead.adjusterAppointmentDate,
        adjusterAppointmentTime: updatedLead.adjusterAppointmentTime,
        adjusterAppointmentNotes: updatedLead.adjusterAppointmentNotes
      }
    })
  } catch (error) {
    console.error('Error updating adjuster information:', error)
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    )
  }
} 