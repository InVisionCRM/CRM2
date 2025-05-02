import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import { getContractsByLeadId, getContractById, upsertContract } from "@/lib/db/contracts"

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

    // Create or update contract using Prisma
    const contract = await upsertContract(lead_id, contract_type, {
      leadId: lead_id,
      contractType: contract_type,
      signatures,
      dates,
      names,
      addresses,
      contactInfo,
    })

    return NextResponse.json({
      success: true,
      message: "Contract saved successfully",
      contractId: contract.id,
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
      const contract = await getContractById(contractId)

      if (!contract) {
        return NextResponse.json({ success: false, message: "Contract not found" }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        contract,
      })
    } else if (leadId) {
      // Fetch contracts for the specified lead
      const contracts = await getContractsByLeadId(leadId)

      return NextResponse.json({
        success: true,
        contracts,
      })
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid query parameters" },
        { status: 400 },
      )
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
