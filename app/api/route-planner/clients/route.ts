import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { query } = await request.json()
    
    // Build search query for clients/leads with addresses
    const whereClause = {
      AND: [
        {
          OR: [
            { firstName: { not: null } },
            { lastName: { not: null } }
          ]
        },
        { address: { not: null } }, // Only include leads with addresses
        ...(query && query.length >= 2 ? [{
          OR: [
            { firstName: { contains: query, mode: 'insensitive' as const } },
            { lastName: { contains: query, mode: 'insensitive' as const } },
            { address: { contains: query, mode: 'insensitive' as const } },
            { email: { contains: query, mode: 'insensitive' as const } },
            { phone: { contains: query, mode: 'insensitive' as const } }
          ]
        }] : [])
      ]
    }

    // Fetch clients/leads with relevant fields
    const leads = await prisma.lead.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        status: true,
        createdAt: true
      },
      orderBy: query && query.length >= 2 ? [
        { updatedAt: 'desc' },
        { createdAt: 'desc' }
      ] : [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ],
      take: query && query.length >= 2 ? 15 : 50 // Show more results when loading all
    })

    // Transform data for the route planner
    const formattedClients = leads.map(lead => ({
      id: lead.id,
      name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unnamed Client',
      address: lead.address || '',
      email: lead.email,
      phone: lead.phone,
      type: (lead.status === 'completed_jobs' ? 'client' : 'lead') as 'client' | 'lead'
    }))

    return NextResponse.json({ clients: formattedClients })

  } catch (error) {
    console.error('Error fetching clients for route planner:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

// Keep GET for backward compatibility
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    
    // Redirect to POST method
    const response = await POST(new NextRequest(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: search })
    }))
    
    const data = await response.json()
    return NextResponse.json(data.clients || [])

  } catch (error) {
    console.error('Error in GET route:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
} 