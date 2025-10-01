import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { leadId, contractorPhone, notes } = body

    // Validate required fields
    if (!leadId || !contractorPhone) {
      return NextResponse.json(
        { error: 'Lead ID and contractor phone are required' },
        { status: 400 }
      )
    }

    // Clean and validate phone number format
    const cleanPhone = contractorPhone.replace(/\D/g, '') // Remove all non-digit characters
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: 'Invalid phone number format - must be at least 10 digits' },
        { status: 400 }
      )
    }

    // Check if lead exists
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, address: true, claimNumber: true }
    })

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Check if assignment already exists for this lead and contractor
    const existingAssignment = await prisma.photoAssignment.findFirst({
      where: {
        leadId,
        contractorPhone: cleanPhone
      }
    })

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Photo job already assigned to this contractor' },
        { status: 409 }
      )
    }

    // Create photo assignment
    const assignment = await prisma.photoAssignment.create({
      data: {
        leadId,
        contractorPhone: cleanPhone,
        assignedBy: session.user.id,
        notes: notes || null
      },
      include: {
        lead: {
          select: {
            id: true,
            address: true,
            claimNumber: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    console.log('✅ Photo assignment created:', {
      assignmentId: assignment.id,
      leadId: assignment.leadId,
      contractorPhone: assignment.contractorPhone,
      assignedBy: assignment.assignedBy
    })

    return NextResponse.json({
      success: true,
      assignment: {
        id: assignment.id,
        leadId: assignment.leadId,
        contractorPhone: assignment.contractorPhone,
        assignedAt: assignment.assignedAt,
        notes: assignment.notes,
        lead: assignment.lead
      }
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error creating photo assignment:', error)
    return NextResponse.json(
      {
        error: 'Failed to assign photo job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contractorPhone = searchParams.get('contractorPhone')
    const leadId = searchParams.get('leadId')

    if (!contractorPhone && !leadId) {
      return NextResponse.json(
        { error: 'Either contractorPhone or leadId parameter is required' },
        { status: 400 }
      )
    }

    // Build where clause based on provided parameters
    let whereClause: any = {}
    
    if (contractorPhone) {
      const cleanPhone = contractorPhone.replace(/[\s\-\(\)]/g, '')
      whereClause.contractorPhone = cleanPhone
    }
    
    if (leadId) {
      whereClause.leadId = leadId
    }

    // Get assignments
    const assignments = await prisma.photoAssignment.findMany({
      where: whereClause,
      include: {
        lead: {
          select: {
            id: true,
            address: true,
            claimNumber: true,
            firstName: true,
            lastName: true,
            status: true
          }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      assignments: assignments.map(assignment => ({
        id: assignment.id,
        leadId: assignment.leadId,
        contractorPhone: assignment.contractorPhone,
        assignedAt: assignment.assignedAt,
        notes: assignment.notes,
        completedAt: assignment.completedAt,
        lead: assignment.lead
      }))
    })

  } catch (error) {
    console.error('❌ Error fetching photo assignments:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch photo assignments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')
    
    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      )
    }

    // Check if assignment exists
    const assignment = await prisma.photoAssignment.findUnique({
      where: { id: assignmentId }
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Delete the assignment
    await prisma.photoAssignment.delete({
      where: { id: assignmentId }
    })

    console.log('✅ Photo assignment deleted:', {
      assignmentId,
      leadId: assignment.leadId,
      contractorPhone: assignment.contractorPhone
    })

    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully'
    })

  } catch (error) {
    console.error('❌ Error deleting photo assignment:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete assignment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
