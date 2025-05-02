"use server"

import { revalidatePath } from "next/cache"
import { sql } from "@/lib/db"

// Type for contract data
export type ContractData = {
  lead_id: string
  contract_type: string
  contract_data: Record<string, any>
}

// Function to save contract data without PDF generation
export async function saveContractDataAction(contractData: ContractData) {
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
