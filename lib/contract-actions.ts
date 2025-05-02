"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db/prisma"

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
    const existingContract = await prisma.contract.findFirst({
      where: {
        leadId: contractData.lead_id,
        contractType: contractData.contract_type,
      },
    })

    let result

    if (existingContract) {
      // Update existing contract
      result = await prisma.contract.update({
        where: { id: existingContract.id },
        data: {
          // Store contract_data in the appropriate fields based on the schema
          signatures: contractData.contract_data.signatures || {},
          dates: contractData.contract_data.dates || {},
          names: contractData.contract_data.names || {},
          addresses: contractData.contract_data.addresses || {},
          contactInfo: contractData.contract_data.contact_info || {},
          updatedAt: new Date(),
        },
      })
    } else {
      // Insert new contract
      result = await prisma.contract.create({
        data: {
          leadId: contractData.lead_id,
          contractType: contractData.contract_type,
          signatures: contractData.contract_data.signatures || {},
          dates: contractData.contract_data.dates || {},
          names: contractData.contract_data.names || {},
          addresses: contractData.contract_data.addresses || {},
          contactInfo: contractData.contract_data.contact_info || {},
        },
      })
    }

    // Revalidate the lead page to show updated contract status
    revalidatePath(`/leads/${contractData.lead_id}`)

    return { success: true, contractId: result.id }
  } catch (error) {
    console.error("Error saving contract data:", error)
    return {
      success: false,
      message: `Failed to save contract: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}
