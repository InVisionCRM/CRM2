import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for validation
const insuranceUpdateSchema = z.object({
  insuranceCompany: z.string().optional().or(z.literal("")),
  insurancePolicyNumber: z.string().optional().or(z.literal("")),
  insurancePhone: z.string().optional().or(z.literal("")),
  insuranceDeductible: z.string().optional().or(z.literal("")),
  insuranceSecondaryPhone: z.string().optional().or(z.literal("")),
  dateOfLoss: z.string().optional().or(z.literal("")),
  damageType: z.enum(["HAIL", "WIND", "FIRE", "WIND_AND_HAIL"]).optional().or(z.literal("")),
  claimNumber: z.string().optional().or(z.literal(""))
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
    const validationResult = insuranceUpdateSchema.safeParse(body)
    
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

    // Convert date of loss string to DateTime if provided
    let dateOfLoss = undefined
    if (data.dateOfLoss && data.dateOfLoss.trim() !== '') {
      dateOfLoss = new Date(data.dateOfLoss)
    }

    // Update the lead insurance information
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        insuranceCompany: data.insuranceCompany,
        insurancePolicyNumber: data.insurancePolicyNumber,
        insurancePhone: data.insurancePhone,
        insuranceDeductible: data.insuranceDeductible,
        insuranceSecondaryPhone: data.insuranceSecondaryPhone,
        dateOfLoss: dateOfLoss,
        damageType: data.damageType || null,
        claimNumber: data.claimNumber,
        updatedAt: new Date()
      }
    })

    // Create activity log for this update
    await prisma.activity.create({
      data: {
        type: 'LEAD_UPDATED',
        title: 'Insurance information updated',
        description: `Insurance information updated for lead ${id}`,
        userId: session.user.id,
        leadId: id,
      }
    })

    return NextResponse.json({ 
      message: 'Insurance information updated successfully',
      lead: {
        id: updatedLead.id,
        insuranceCompany: updatedLead.insuranceCompany,
        insurancePolicyNumber: updatedLead.insurancePolicyNumber,
        insurancePhone: updatedLead.insurancePhone,
        insuranceDeductible: updatedLead.insuranceDeductible,
        insuranceSecondaryPhone: updatedLead.insuranceSecondaryPhone,
        dateOfLoss: updatedLead.dateOfLoss,
        damageType: updatedLead.damageType,
        claimNumber: updatedLead.claimNumber
      }
    })
  } catch (error) {
    console.error('Error updating lead insurance information:', error)
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    )
  }
} 