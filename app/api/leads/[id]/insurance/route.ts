import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

/* ─────────── validation schema ─────────── */
const insuranceUpdateSchema = z.object({
  insuranceCompany:        z.string().nullable().optional(),
  insurancePolicyNumber:   z.string().nullable().optional(),
  insurancePhone:          z.string().nullable().optional(),
  insuranceDeductible:     z.string().nullable().optional(),
  insuranceSecondaryPhone: z.string().nullable().optional(),
  dateOfLoss:              z.string().nullable().optional(),
  damageType:              z.enum(['HAIL', 'WIND', 'FIRE', 'WIND_AND_HAIL']).nullable().optional(),
  claimNumber:             z.string().nullable().optional(),
})

/* ─────────── PATCH handler ─────────── */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    /* 1. auth check */
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      )
    }

    /* 2. dynamic param */
    const { id: leadId } = await params
    if (!leadId) {
      return new NextResponse(
        JSON.stringify({ message: 'Lead ID is required' }),
        { status: 400 }
      )
    }

    /* 3. validate body */
    const body = await request.json()
    console.log('🔍 Insurance API - Received body:', JSON.stringify(body, null, 2))
    
    const result = insuranceUpdateSchema.safeParse(body)
    if (!result.success) {
      console.error('❌ Insurance validation failed:', {
        errors: result.error.errors,
        receivedData: body,
        expectedSchema: {
          insuranceCompany: 'string | null | undefined',
          insurancePolicyNumber: 'string | null | undefined', 
          insurancePhone: 'string | null | undefined',
          insuranceDeductible: 'string | null | undefined',
          insuranceSecondaryPhone: 'string | null | undefined',
          dateOfLoss: 'string | null | undefined',
          damageType: 'HAIL | WIND | FIRE | WIND_AND_HAIL | null | undefined',
          claimNumber: 'string | null | undefined'
        }
      })
      return new NextResponse(
        JSON.stringify({ message: 'Invalid data', errors: result.error.errors }),
        { status: 400 }
      )
    }
    const data = result.data
    console.log('✅ Insurance validation passed:', data)

    /* 4. make sure the lead exists */
    const existingLead = await prisma.lead.findUnique({ where: { id: leadId } })
    if (!existingLead) {
      return new NextResponse(
        JSON.stringify({ message: 'Lead not found' }),
        { status: 404 }
      )
    }

    /* 5. convert date string → Date | null */
    let dateOfLoss: Date | null | undefined = undefined
    if (data.dateOfLoss !== undefined) {
      dateOfLoss =
        data.dateOfLoss === null || data.dateOfLoss.trim() === ''
          ? null
          : new Date(data.dateOfLoss)
      if (dateOfLoss && isNaN(dateOfLoss.getTime())) {
        return new NextResponse(
          JSON.stringify({ message: 'Invalid date format for dateOfLoss' }),
          { status: 400 }
        )
      }
    }

    /* 6. update lead */
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        insuranceCompany:        data.insuranceCompany,
        insurancePolicyNumber:   data.insurancePolicyNumber,
        insurancePhone:          data.insurancePhone,
        insuranceDeductible:     data.insuranceDeductible,
        insuranceSecondaryPhone: data.insuranceSecondaryPhone,
        dateOfLoss,
        damageType:              data.damageType,
        claimNumber:             data.claimNumber,
        updatedAt:               new Date(),
      },
    })

    /* 7. activity log */
    await prisma.activity.create({
      data: {
        type:        'LEAD_UPDATED',
        title:       'Insurance information updated',
        description: `Insurance information updated for lead ${leadId}`,
        userId:      session.user.id,
        leadId,
      },
    })

    /* 8. success */
    return new NextResponse(
      JSON.stringify({
        message: 'Insurance information updated successfully',
        lead: {
          id:                    updatedLead.id,
          insuranceCompany:      updatedLead.insuranceCompany,
          insurancePolicyNumber: updatedLead.insurancePolicyNumber,
          insurancePhone:        updatedLead.insurancePhone,
          insuranceDeductible:   updatedLead.insuranceDeductible,
          insuranceSecondaryPhone: updatedLead.insuranceSecondaryPhone,
          dateOfLoss:            updatedLead.dateOfLoss,
          damageType:            updatedLead.damageType,
          claimNumber:           updatedLead.claimNumber,
        },
      }),
      { status: 200 }
    )
  } catch (err) {
    console.error('Error updating lead insurance information:', err)
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    )
  }
}
