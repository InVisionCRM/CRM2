import { sql } from "@/lib/db/client"

export interface Marker {
  id: string
  lat: number
  lng: number
  address: string
  notes?: string
  status?: string
  timestamp: string
  contact_info?: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
  }
  followUpDate?: string | null
  followUpTime?: string | null
  followUpNotes?: string | null
  sales_person_id?: string // Legacy field
  user_id?: string // New field that references users table
  visits?: Array<{
    date: string
    salesPersonId: string
    salesPersonName: string
    salesPersonEmail: string
    status: string
    notes: string
    followUpDate?: string
  }>
}

export async function getMarkers(): Promise<Marker[]> {
  try {
    const markers = await sql`
      SELECT * FROM vision_markers
      ORDER BY created_at DESC
    `
    return markers.map((marker) => ({
      ...marker,
      contact_info: marker.contact_info ? JSON.parse(marker.contact_info) : undefined,
      visits: marker.visits ? JSON.parse(marker.visits) : [],
    }))
  } catch (error) {
    console.error("Error fetching markers:", error)
    return []
  }
}

export async function getMarkerById(id: string): Promise<Marker | null> {
  try {
    const markers = await sql`
      SELECT * FROM vision_markers
      WHERE id = ${id}
    `

    if (markers.length === 0) {
      return null
    }

    const marker = markers[0]
    return {
      ...marker,
      contact_info: marker.contact_info ? JSON.parse(marker.contact_info) : undefined,
      visits: marker.visits ? JSON.parse(marker.visits) : [],
    }
  } catch (error) {
    console.error(`Error fetching marker ${id}:`, error)
    return null
  }
}

export async function getMarkersByAddress(address: string): Promise<Marker[]> {
  try {
    const markers = await sql`
      SELECT * FROM vision_markers
      WHERE address ILIKE ${`%${address}%`}
      ORDER BY created_at DESC
    `
    return markers.map((marker) => ({
      ...marker,
      contact_info: marker.contact_info ? JSON.parse(marker.contact_info) : undefined,
      visits: marker.visits ? JSON.parse(marker.visits) : [],
    }))
  } catch (error) {
    console.error(`Error searching markers by address ${address}:`, error)
    return []
  }
}

export async function createMarker(markerData: Partial<Marker>): Promise<Marker | null> {
  try {
    const {
      lat,
      lng,
      address,
      notes,
      status,
      contact_info,
      followUpDate,
      followUpTime,
      followUpNotes,
      sales_person_id,
      user_id, // New field
      visits = [],
    } = markerData

    // Create a new visit if we have status information
    if (status) {
      const newVisit = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        salesPersonId: sales_person_id || user_id || "unknown",
        salesPersonName: "Unknown",
        salesPersonEmail: "unknown@example.com",
        status,
        notes: notes || "",
        followUpDate,
      }

      visits.push(newVisit)
    }

    const now = new Date()
    const markerId = crypto.randomUUID()
    const contactInfoString = JSON.stringify(contact_info || {})
    const followUpString = JSON.stringify({
      date: followUpDate,
      time: followUpTime,
      notes: followUpNotes,
    })
    const visitsString = JSON.stringify(visits)

    // Use both fields for backward compatibility
    const result = await sql`
      INSERT INTO vision_markers (
        id, 
        lat, 
        lng, 
        address, 
        notes, 
        status, 
        contact_info, 
        follow_up,
        sales_person_id,
        user_id,
        visits,
        timestamp,
        created_at,
        updated_at
      ) 
      VALUES (
        ${markerId}, 
        ${lat}, 
        ${lng}, 
        ${address}, 
        ${notes || null}, 
        ${status || "New"}, 
        ${contactInfoString},
        ${followUpString},
        ${sales_person_id || null},
        ${user_id || null},
        ${visitsString},
        ${now},
        ${now},
        ${now}
      )
      RETURNING *
    `

    if (result.length === 0) {
      return null
    }

    const marker = result[0]
    return {
      ...marker,
      contact_info: marker.contact_info ? JSON.parse(marker.contact_info) : undefined,
      visits: marker.visits ? JSON.parse(marker.visits) : [],
    }
  } catch (error) {
    console.error("Error creating marker:", error)
    return null
  }
}

export async function updateMarker(id: string, markerData: Partial<Marker>): Promise<Marker | null> {
  try {
    console.log("Updating marker with ID:", id)
    console.log("Update data:", markerData)

    // First, get the existing marker
    const existingMarker = await getMarkerById(id)
    if (!existingMarker) {
      console.error(`Marker with ID ${id} not found`)
      return null
    }

    // Prepare the update data
    const {
      lat = existingMarker.lat,
      lng = existingMarker.lng,
      address = existingMarker.address,
      notes,
      status,
      contact_info,
      followUpDate,
      followUpTime,
      followUpNotes,
      sales_person_id,
      user_id, // New field
    } = markerData

    // Handle visits - if we have a new status, add a new visit
    let visits = existingMarker.visits || []

    // If visits are provided in the update data, use those instead
    if (markerData.visits) {
      visits = markerData.visits
    }
    // Otherwise, if we have status info, create a new visit
    else if (status) {
      const newVisit = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        salesPersonId: sales_person_id || user_id || "unknown",
        salesPersonName: "Unknown",
        salesPersonEmail: "unknown@example.com",
        status,
        notes: notes || "",
        followUpDate: followUpDate || undefined,
      }

      visits = [newVisit, ...visits]
    }

    const now = new Date()
    const contactInfoString = contact_info ? JSON.stringify(contact_info) : existingMarker.contact_info
    const followUpString = JSON.stringify({
      date: followUpDate !== undefined ? followUpDate : existingMarker.followUpDate,
      time: followUpTime !== undefined ? followUpTime : existingMarker.followUpTime,
      notes: followUpNotes !== undefined ? followUpNotes : existingMarker.followUpNotes,
    })
    const visitsString = JSON.stringify(visits)

    // Update the marker in the database - use both fields for backward compatibility
    const result = await sql`
      UPDATE vision_markers
      SET 
        lat = ${lat},
        lng = ${lng},
        address = ${address},
        notes = ${notes !== undefined ? notes : existingMarker.notes},
        status = ${status !== undefined ? status : existingMarker.status},
        contact_info = ${contactInfoString},
        follow_up = ${followUpString},
        sales_person_id = ${sales_person_id !== undefined ? sales_person_id : existingMarker.sales_person_id},
        user_id = ${user_id !== undefined ? user_id : existingMarker.user_id},
        visits = ${visitsString},
        updated_at = ${now}
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return null
    }

    const updatedMarker = result[0]
    return {
      ...updatedMarker,
      contact_info: updatedMarker.contact_info ? JSON.parse(updatedMarker.contact_info) : undefined,
      visits: updatedMarker.visits ? JSON.parse(updatedMarker.visits) : [],
    }
  } catch (error) {
    console.error(`Error updating marker ${id}:`, error)
    throw error
  }
}

export async function deleteMarker(id: string): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM vision_markers
      WHERE id = ${id}
    `
    return result.count > 0
  } catch (error) {
    console.error(`Error deleting marker ${id}:`, error)
    return false
  }
}
