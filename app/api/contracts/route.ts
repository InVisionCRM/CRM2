import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth-utils"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { lead_id, contract_type, contract_data } = body

    // Validate required fields
    if (!lead_id || !contract_type || !contract_data) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: lead_id, contract_type, or contract_data" },
        { status: 400 },
      )
    }

    // Extract specific fields from contract_data
    const {
      name,
      date,
      projectAddress,
      billingAddress,
      phone,
      email,
      agreesSignature,
      agreesDate,
      homeOwnerInitials1,
      homeOwnerInitials2,
      homeOwnerInitials3,
      homeOwnerInitials4,
      homeOwnerInitials5,
      emailFacsimile,
      // Add any other fields you need to extract
    } = contract_data

    // Prepare the data objects for JSON columns
    const signatures = {
      clientSignature: agreesSignature || null,
      homeOwnerInitials1: homeOwnerInitials1 || null,
      homeOwnerInitials2: homeOwnerInitials2 || null,
      homeOwnerInitials3: homeOwnerInitials3 || null,
      homeOwnerInitials4: homeOwnerInitials4 || null,
      homeOwnerInitials5: homeOwnerInitials5 || null,
    }

    const dates = {
      contractDate: date || null,
      agreesDate: agreesDate || null,
    }

    const names = {
      clientName: name || null,
    }

    const addresses = {
      projectAddress: projectAddress || null,
      billingAddress: billingAddress || null,
    }

    const contactInfo = {
      phone: phone || null,
      email: email || null,
      emailFacsimile: emailFacsimile || null,
    }

    // Check if a contract already exists for this lead and type
    const existingContracts = await sql`
      SELECT id FROM contracts 
      WHERE lead_id = ${lead_id} AND contract_type = ${contract_type}
    `

    let contractId

    if (existingContracts.length > 0) {
      // Update existing contract
      contractId = existingContracts[0].id

      await sql`
        UPDATE contracts 
        SET 
          signatures = ${signatures},
          dates = ${dates},
          names = ${names},
          addresses = ${addresses},
          contact_info = ${contactInfo},
          updated_at = NOW()
        WHERE id = ${contractId}
      `
    } else {
      // Insert new contract
      const result = await sql`
        INSERT INTO contracts (
          lead_id, 
          contract_type, 
          signatures,
          dates,
          names,
          addresses,
          contact_info,
          created_at, 
          updated_at
        )
        VALUES (
          ${lead_id},
          ${contract_type},
          ${signatures},
          ${dates},
          ${names},
          ${addresses},
          ${contactInfo},
          NOW(),
          NOW()
        )
        RETURNING id
      `
      contractId = result[0].id
    }

    return NextResponse.json({
      success: true,
      message: "Contract saved successfully",
      contractId,
    })
  } catch (error) {
    console.error("Error saving contract:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Failed to save contract: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get("lead_id")
    const contractId = searchParams.get("contract_id")

    if (!leadId && !contractId) {
      return NextResponse.json(
        { success: false, message: "Missing required query parameter: lead_id or contract_id" },
        { status: 400 },
      )
    }

    if (contractId) {
      // Fetch specific contract by ID
      const contract = await sql`
        SELECT id, lead_id, contract_type, signatures, dates, names, addresses, contact_info, created_at, updated_at, pdf_url
        FROM contracts 
        WHERE id = ${contractId}
      `

      if (contract.length === 0) {
        return NextResponse.json({ success: false, message: "Contract not found" }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        contract: contract[0],
      })
    } else {
      // Fetch contracts for the specified lead
      const contracts = await sql`
        SELECT id, lead_id, contract_type, signatures, dates, names, addresses, contact_info, created_at, updated_at, pdf_url
        FROM contracts 
        WHERE lead_id = ${leadId}
        ORDER BY updated_at DESC
      `

      return NextResponse.json({
        success: true,
        contracts,
      })
    }
  } catch (error) {
    console.error("Error fetching contracts:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Failed to fetch contracts: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
