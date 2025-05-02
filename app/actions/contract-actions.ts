"use server"

import { revalidatePath } from "next/cache"
import { sql } from "@/lib/db"
import { getLeadById } from "@/lib/db"
import { uploadToBlob } from "@/lib/blob"

// Type for contract data
export type ContractData = {
  lead_id: string
  contract_type: string
  signatures: Record<string, string>
  dates: Record<string, string>
  names: Record<string, string>
  fields: Record<string, string>
  pdf_url?: string
}

// Function to save a contract
export async function saveContractAction(
  data: ContractData,
  pdfFile?: File,
): Promise<{ success: boolean; message: string; contract_id?: string }> {
  try {
    console.log("Saving contract for lead:", data.lead_id)

    // Check if the lead exists
    const lead = await getLeadById(data.lead_id)
    if (!lead) {
      return {
        success: false,
        message: "Lead not found",
      }
    }

    let pdfUrl = data.pdf_url || null

    // Upload PDF if provided
    if (pdfFile) {
      const uploadedFile = await uploadToBlob(pdfFile, data.lead_id)
      pdfUrl = uploadedFile.url
      console.log("Contract PDF uploaded:", pdfUrl)
    }

    // Convert JSON objects to strings for database storage
    const signaturesJson = JSON.stringify(data.signatures)
    const datesJson = JSON.stringify(data.dates)
    const namesJson = JSON.stringify(data.names)
    const fieldsJson = JSON.stringify(data.fields)

    // Check if contract already exists for this lead
    const existingContract = await sql<{ id: string }[]>`
      SELECT id FROM contracts 
      WHERE lead_id = ${data.lead_id} 
      AND contract_type = ${data.contract_type}
    `

    let result
    const now = new Date()

    if (existingContract && existingContract.length > 0) {
      // Update existing contract
      const contractId = existingContract[0].id
      result = await sql`
        UPDATE contracts 
        SET 
          signatures = ${signaturesJson},
          dates = ${datesJson},
          names = ${namesJson},
          fields = ${fieldsJson},
          pdf_url = ${pdfUrl},
          updated_at = ${now}
        WHERE id = ${contractId}
        RETURNING id
      `
      console.log(`Contract ${contractId} updated successfully`)
    } else {
      // Create new contract
      const contractId = crypto.randomUUID()
      result = await sql`
        INSERT INTO contracts (
          id, 
          lead_id, 
          contract_type,
          signatures, 
          dates, 
          names,
          fields,
          pdf_url,
          created_at, 
          updated_at
        )
        VALUES (
          ${contractId},
          ${data.lead_id},
          ${data.contract_type},
          ${signaturesJson},
          ${datesJson},
          ${namesJson},
          ${fieldsJson},
          ${pdfUrl},
          ${now},
          ${now}
        )
        RETURNING id
      `
      console.log(`Contract ${contractId} created successfully`)
    }

    // Revalidate relevant paths
    revalidatePath(`/leads/${data.lead_id}`)
    revalidatePath("/contracts")

    return {
      success: true,
      message: "Contract saved successfully",
      contract_id: result[0]?.id,
    }
  } catch (error) {
    console.error("Error saving contract:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to save contract",
    }
  }
}

// Function to get a client's contracts
export async function getClientContracts(leadId: string) {
  try {
    const contracts = await sql`
      SELECT id, lead_id, contract_type, pdf_url, created_at, updated_at
      FROM contracts
      WHERE lead_id = ${leadId}
      ORDER BY updated_at DESC
    `

    return {
      success: true,
      contracts,
    }
  } catch (error) {
    console.error("Error fetching client contracts:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch contracts",
      contracts: [],
    }
  }
}

// Add this new server action to save contract data without PDF generation
export async function saveContractDataAction(contractData: {
  lead_id: string
  contract_type: string
  contract_data: Record<string, any>
}) {
  try {
    // Check if a contract already exists for this lead and type
    const existingContracts = await sql`
      SELECT id FROM contracts 
      WHERE lead_id = ${contractData.lead_id} AND contract_type = ${contractData.contract_type}
    `

    let contractId

    if (existingContracts.length > 0) {
      // Update existing contract
      const result = await sql`
        UPDATE contracts 
        SET 
          contract_data = ${contractData.contract_data},
          updated_at = NOW()
        WHERE lead_id = ${contractData.lead_id} AND contract_type = ${contractData.contract_type}
        RETURNING id
      `
      contractId = result[0].id
    } else {
      // Insert new contract
      const now = new Date()
      const result = await sql`
        INSERT INTO contracts (
          lead_id, 
          contract_type, 
          contract_data, 
          created_at, 
          updated_at
        )
        VALUES (
          ${contractData.lead_id},
          ${contractData.contract_type},
          ${contractData.contract_data},
          ${now},
          ${now}
        )
        RETURNING id
      `
      contractId = result[0].id
    }

    // Revalidate the lead page to show updated contract status
    revalidatePath(`/leads/${contractData.lead_id}`)

    return { success: true, contractId }
  } catch (error) {
    console.error("Error saving contract data:", error)
    return {
      success: false,
      message: `Failed to save contract: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}
