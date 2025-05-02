import { sql } from "@vercel/postgres"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const leadId = params.id
    const body = await req.json()

    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      streetAddress,
      city,
      state,
      zipcode,
      insurance_company,
      insurance_policy_number,
      insurance_phone,
      insurance_adjuster_name,
      insurance_adjuster_phone,
      insurance_adjuster_email,
      insurance_deductible,
      adjuster_appointment_date,
      adjuster_appointment_time,
      adjuster_appointment_notes,
      latitude,
      longitude,
      notes,
      status,
    } = body

    const name = `${firstName} ${lastName}`.trim()

    await sql`
      UPDATE leads SET
        name = ${name},
        first_name = ${firstName},
        last_name = ${lastName},
        email = ${email},
        phone = ${phone},
        address = ${address},
        street_address = ${streetAddress},
        city = ${city},
        state = ${state},
        zipcode = ${zipcode},
        insurance_company = ${insurance_company},
        insurance_policy_number = ${insurance_policy_number},
        insurance_phone = ${insurance_phone},
        insurance_adjuster_name = ${insurance_adjuster_name},
        insurance_adjuster_phone = ${insurance_adjuster_phone},
        insurance_adjuster_email = ${insurance_adjuster_email},
        insurance_deductible = ${insurance_deductible},
        adjuster_appointment_date = ${adjuster_appointment_date},
        adjuster_appointment_time = ${adjuster_appointment_time},
        adjuster_appointment_notes = ${adjuster_appointment_notes},
        latitude = ${latitude},
        longitude = ${longitude},
        notes = ${notes},
        status = ${status}
      WHERE id = ${leadId}
    `

    return Response.json({ success: true, id: leadId })
  } catch (error) {
    console.error("Error updating lead contact:", error)
    return new Response("Failed to update lead contact", { status: 500 })
  }
}
