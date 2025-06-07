import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: Request) {
  try {
    // Get search parameters
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    
    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    // Search leads by name, email, phone, or address
    const leads = await prisma.lead.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        googleDriveFolderId: true,
        insuranceCompany: true,
        insurancePolicyNumber: true,
        insuranceAdjusterName: true,
        insuranceAdjusterPhone: true,
        insuranceAdjusterEmail: true,
      },
    })

    return NextResponse.json(leads)
  } catch (error) {
    console.error('Error searching leads:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 