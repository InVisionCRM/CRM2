import { NextResponse } from "next/server"
import { getLeadById, updateLead, deleteLead } from "@/lib/db/leads"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const lead = await getLeadById(id)

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    return NextResponse.json(lead)
  } catch (error) {
    console.error(`Error fetching lead:`, error)
    return NextResponse.json({ error: "Failed to fetch lead" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()

    // Transform the incoming data to match our function parameters
    const updateData = {
      firstName: body.first_name,
      lastName: body.last_name,
      email: body.email,
      phone: body.phone,
      address: body.address,
      streetAddress: body.street_address,
      city: body.city,
      state: body.state,
      zipcode: body.zipcode,
      status: body.status,
      assignedTo: body.assigned_to,
      notes: body.notes,
    }

    // Clean undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    const updatedLead = await updateLead(id, updateData)

    if (!updatedLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    return NextResponse.json(updatedLead)
  } catch (error) {
    console.error(`Error updating lead:`, error)
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const success = await deleteLead(id)

    if (!success) {
      return NextResponse.json({ error: "Lead not found or could not be deleted" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Lead deleted successfully" })
  } catch (error) {
    console.error(`Error deleting lead:`, error)
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 })
  }
}