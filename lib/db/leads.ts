import { sql } from "./client"
import type { Lead } from "@/types/lead"

export async function getLeads(): Promise<Lead[]> {
  try {
    const leads = await sql<Lead[]>`
      SELECT 
        id, 
        name, 
        first_name as "firstName", 
        last_name as "lastName", 
        email, 
        phone, 
        address, 
        street_address as "streetAddress",
        city,
        state,
        zipcode,
        status, 
        assigned_to as "assignedTo", 
        notes, 
        insurance_company as "insuranceCompany",
        insurance_policy_number as "insurancePolicyNumber",
        insurance_phone as "insurancePhone",
        insurance_secondary_phone as "insuranceSecondaryPhone",
        insurance_adjuster_name as "insuranceAdjusterName",
        insurance_adjuster_phone as "insuranceAdjusterPhone",
        insurance_adjuster_email as "insuranceAdjusterEmail",
        insurance_deductible as "insuranceDeductible",
        created_at as "createdAt", 
        updated_at as "updatedAt" 
      FROM leads 
      ORDER BY created_at DESC
    `
    return leads
  } catch (error) {
    console.error("Error fetching leads:", error)
    throw new Error("Failed to fetch leads")
  }
}

export async function getLeadById(id: string): Promise<Lead | null> {
  try {
    const leads = await sql<Lead[]>`
      SELECT 
        id, 
        name, 
        first_name as "firstName", 
        last_name as "lastName", 
        email, 
        phone, 
        address, 
        street_address as "streetAddress",
        city,
        state,
        zipcode,
        status, 
        assigned_to as "assignedTo", 
        notes,
        insurance_company as "insuranceCompany",
        insurance_policy_number as "insurancePolicyNumber",
        insurance_phone as "insurancePhone",
        insurance_secondary_phone as "insuranceSecondaryPhone",
        insurance_adjuster_name as "insuranceAdjusterName",
        insurance_adjuster_phone as "insuranceAdjusterPhone",
        insurance_adjuster_email as "insuranceAdjusterEmail",
        insurance_deductible as "insuranceDeductible",
        adjuster_appointment_date as "adjusterAppointmentDate",
        adjuster_appointment_time as "adjusterAppointmentTime",
        adjuster_appointment_notes as "adjusterAppointmentNotes",
        latitude,
        longitude,
        created_at as "createdAt", 
        updated_at as "updatedAt" 
      FROM leads 
      WHERE id = ${id}
    `
    return leads.length > 0 ? leads[0] : null
  } catch (error) {
    console.error(`Error fetching lead with ID ${id}:`, error)
    throw new Error("Failed to fetch lead")
  }
}

// Get the next client ID from the sequence
export async function getNextClientId(): Promise<string> {
  try {
    // Check if the sequence table has data
    const checkData = await sql`
      SELECT COUNT(*) as count FROM client_id_sequence
    `

    // If no data, insert initial row
    if (checkData[0].count === 0) {
      console.log("Initializing client_id_sequence table")
      await sql`
        INSERT INTO client_id_sequence (id, last_id) 
        VALUES (1, 10000)
      `
    }

    // Get and update the ID in a transaction
    const result = await sql<{ last_id: number }[]>`
      UPDATE client_id_sequence 
      SET last_id = last_id + 1 
      WHERE id = 1
      RETURNING last_id
    `

    if (!result || result.length === 0) {
      throw new Error("Failed to get next client ID")
    }

    // Return as a string
    return result[0].last_id.toString()
  } catch (error) {
    console.error("Error getting next client ID:", error)
    throw new Error(`Failed to get next client ID: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function createLead(data: {
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  address?: string | null
  streetAddress?: string | null
  city?: string | null
  state?: string | null
  zipcode?: string | null
  status: string
  assignedTo?: string | null
  notes?: string | null
}): Promise<Lead> {
  try {
    // Get the next client ID
    const id = await getNextClientId()
    const now = new Date()
    const fullName = `${data.firstName} ${data.lastName}`.trim()

    console.log(`Creating lead with ID: ${id}`)

    // Insert the lead with only the fields that exist in the table
    const leads = await sql<Lead[]>`
      INSERT INTO leads (
        id, 
        name, 
        first_name, 
        last_name, 
        email, 
        phone, 
        address, 
        street_address,
        city,
        state,
        zipcode,
        status, 
        assigned_to, 
        notes,
        created_at, 
        updated_at
      )
      VALUES (
        ${id},
        ${fullName},
        ${data.firstName},
        ${data.lastName},
        ${data.email || null},
        ${data.phone || null},
        ${data.address || null},
        ${data.streetAddress || null},
        ${data.city || null},
        ${data.state || null},
        ${data.zipcode || null},
        ${data.status},
        ${data.assignedTo || null},
        ${data.notes || null},
        ${now},
        ${now}
      )
      RETURNING 
        id, 
        name, 
        first_name as "firstName", 
        last_name as "lastName", 
        email, 
        phone, 
        address, 
        street_address as "streetAddress",
        city,
        state,
        zipcode,
        status, 
        assigned_to as "assignedTo", 
        notes,
        created_at as "createdAt", 
        updated_at as "updatedAt"
    `

    if (!leads || leads.length === 0) {
      throw new Error("Failed to create lead: No rows returned")
    }

    console.log("Lead created successfully:", leads[0])
    return leads[0]
  } catch (error) {
    console.error("Error creating lead:", error)
    throw new Error(`Failed to create lead: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function updateLead(
  id: string,
  data: {
    firstName?: string
    lastName?: string
    email?: string | null
    phone?: string | null
    address?: string | null
    streetAddress?: string | null
    city?: string | null
    state?: string | null
    zipcode?: string | null
    status?: string
    assignedTo?: string | null
    notes?: string | null
  },
): Promise<Lead | null> {
  try {
    // First, check if the lead exists
    const existingLead = await getLeadById(id)
    if (!existingLead) {
      console.error(`Lead with ID ${id} not found for update`)
      return null
    }

    const now = new Date()

    // Calculate the full name if either first or last name is being updated
    let fullName = existingLead.name
    if (data.firstName !== undefined || data.lastName !== undefined) {
      const firstName = data.firstName !== undefined ? data.firstName : existingLead.firstName
      const lastName = data.lastName !== undefined ? data.lastName : existingLead.lastName
      fullName = `${firstName} ${lastName}`.trim()
    }

    const result = await sql<Lead[]>`
      UPDATE leads 
      SET 
        name = ${fullName},
        first_name = ${data.firstName !== undefined ? data.firstName : existingLead.firstName},
        last_name = ${data.lastName !== undefined ? data.lastName : existingLead.lastName},
        email = ${data.email !== undefined ? data.email : existingLead.email},
        phone = ${data.phone !== undefined ? data.phone : existingLead.phone},
        address = ${data.address !== undefined ? data.address : existingLead.address},
        street_address = ${data.streetAddress !== undefined ? data.streetAddress : existingLead.streetAddress},
        city = ${data.city !== undefined ? data.city : existingLead.city},
        state = ${data.state !== undefined ? data.state : existingLead.state},
        zipcode = ${data.zipcode !== undefined ? data.zipcode : existingLead.zipcode},
        status = ${data.status !== undefined ? data.status : existingLead.status},
        assigned_to = ${data.assignedTo !== undefined ? data.assignedTo : existingLead.assignedTo},
        notes = ${data.notes !== undefined ? data.notes : existingLead.notes},
        updated_at = ${now}
      WHERE id = ${id}
      RETURNING 
        id, 
        name, 
        first_name as "firstName", 
        last_name as "lastName", 
        email, 
        phone, 
        address, 
        street_address as "streetAddress",
        city,
        state,
        zipcode,
        status, 
        assigned_to as "assignedTo", 
        notes,
        created_at as "createdAt", 
        updated_at as "updatedAt"
    `

    return result.length > 0 ? result[0] : null
  } catch (error) {
    console.error(`Error updating lead with ID ${id}:`, error)
    throw new Error(`Failed to update lead: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function deleteLead(id: string): Promise<boolean> {
  try {
    // First, check if the lead exists
    const existingLead = await getLeadById(id)
    if (!existingLead) {
      console.error(`Lead with ID ${id} not found for deletion`)
      return false
    }

    // Delete associated files first to avoid foreign key constraint issues
    console.log(`Deleting files for lead ${id}`)
    await sql`DELETE FROM files WHERE lead_id = ${id}`

    // Then delete the lead
    console.log(`Deleting lead ${id}`)
    const result = await sql`DELETE FROM leads WHERE id = ${id}`

    return result.count > 0
  } catch (error) {
    console.error(`Error deleting lead with ID ${id}:`, error)
    throw new Error(`Failed to delete lead: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
