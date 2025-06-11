import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

// Schema for validation
const adjusterUpdateSchema = z.object({
  insuranceAdjusterName: z.string().nullable().optional(),
  insuranceAdjusterPhone: z.string().nullable().optional(),
  insuranceAdjusterEmail: z
    .string()
    .email()
    .or(z.literal(''))
    .nullable()
    .optional(),
  adjusterAppointmentDate: z.string().nullable().optional(),
  adjusterAppointmentTime: z.string().nullable().optional(),
  adjusterAppointmentNotes: z.string().nullable().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      )
    }

    // Get the lead ID from params
    const { id: leadId } = await params
    if (!leadId) {
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

    // Convert appointment date string to DateTime if provided
    let adjusterAppointmentDate: Date | null | undefined
    if (data.adjusterAppointmentDate !== undefined) {
      if (
        data.adjusterAppointmentDate === null ||
        data.adjusterAppointmentDate.trim() === ''
      ) {
        adjusterAppointmentDate = null
      } else {
        const parsedDate = new Date(data.adjusterAppointmentDate)
        if (isNaN(parsedDate.getTime())) {
          return new NextResponse(
            JSON.stringify({
              message: 'Invalid date format for adjusterAppointmentDate',
            }),
            { status: 400 },
          )
        }
        adjusterAppointmentDate = parsedDate
      }
    }

    // Update the lead adjuster information
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        insuranceAdjusterName: data.insuranceAdjusterName,
        insuranceAdjusterPhone: data.insuranceAdjusterPhone,
        insuranceAdjusterEmail:
          data.insuranceAdjusterEmail === ''
            ? null
            : data.insuranceAdjusterEmail,
        adjusterAppointmentDate,
        adjusterAppointmentTime: data.adjusterAppointmentTime,
        adjusterAppointmentNotes: data.adjusterAppointmentNotes,
        updatedAt: new Date(),
      },
    })

    // Create activity log for this update
    await prisma.activity.create({
      data: {
        type: 'LEAD_UPDATED',
        title: 'Adjuster information updated',
        description: `Adjuster information updated for lead ${leadId}`,
        userId: session.user.id,
        leadId: leadId,
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
      JSON.stringify({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    )
  }
} 