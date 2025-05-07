import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"
import type { Lead } from "@/types/lead"
import { LeadStatus } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    if (!status) {
      return NextResponse.json({ error: "Status parameter is required" }, { status: 400 })
    }

    if (!Object.values(LeadStatus).includes(status as LeadStatus)) {
      return NextResponse.json({ error: "Invalid status parameter" }, { status: 400 })
    }

    const leads = await prisma.lead.findMany({
      where: {
        status: status as LeadStatus,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        status: true,
        assignedToId: true,
        notes: true,
        insuranceCompany: true,
        insurancePolicyNumber: true,
        insurancePhone: true,
        insuranceSecondaryPhone: true,
        insuranceAdjusterName: true,
        insuranceAdjusterPhone: true,
        insuranceAdjusterEmail: true,
        insuranceDeductible: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(leads)
  } catch (error) {
    console.error("Error fetching leads by status:", error)
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 })
  }
}
