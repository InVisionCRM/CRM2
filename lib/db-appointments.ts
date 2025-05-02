import { sql } from "@/lib/db"

export async function createCalendarEvent(eventData: {
  title: string
  description: string
  start_date: Date
  end_date: Date
  location?: string
  lead_id: string
  event_type: string
}) {
  try {
    const result = await sql`
     INSERT INTO calendar_events (
       title, 
       description, 
       start_date, 
       end_date, 
       location, 
       lead_id, 
       event_type
     ) VALUES (
       ${eventData.title},
       ${eventData.description},
       ${eventData.start_date},
       ${eventData.end_date},
       ${eventData.location},
       ${eventData.lead_id},
       ${eventData.event_type}
     )
     RETURNING id
   `
    return result[0].id
  } catch (error) {
    console.error("Error creating calendar event:", error)
    throw new Error("Failed to create calendar event")
  }
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  try {
    await sql`DELETE FROM calendar_events WHERE id = ${id}`
  } catch (error) {
    console.error(`Error deleting calendar event with ID ${id}:`, error)
    throw new Error("Failed to delete calendar event")
  }
}
