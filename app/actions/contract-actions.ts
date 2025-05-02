"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db/prisma"
import { uploadToBlob } from "@/lib/blob"

// Type for contract data
export type ContractData = {
  lead_id: string
  contract_type: string
  signatures: Record<string, string>
  dates: Record<string, string>
  names: Record<string, string>
  addresses: Record<string, string>
  contact_info: Record<string, string>
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
    const lead = await prisma.lead.findUnique({
      where: { id: data.lead_id },
    })

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

    // Check if contract already exists for this lead
    const existingContract = await prisma.contract.findFirst({
      where: {
        leadId: data.lead_id,
        contractType: data.contract_type,
      },
      select: { id: true },
    })

    let result
    const now = new Date()

    if (existingContract) {
      // Update existing contract
      result = await prisma.contract.update({
        where: { id: existingContract.id },
        data: {
          signatures: data.signatures,
          dates: data.dates,
          names: data.names,
          addresses: data.addresses,
          contactInfo: data.contact_info,
          pdfUrl: pdfUrl,
          updatedAt: now,
        },
      })
      console.log(`Contract ${existingContract.id} updated successfully`)
    } else {
      // Create new contract
      result = await prisma.contract.create({
        data: {
          leadId: data.lead_id,
          contractType: data.contract_type,
          signatures: data.signatures,
          dates: data.dates,
          names: data.names,
          addresses: data.addresses,
          contactInfo: data.contact_info,
          pdfUrl: pdfUrl,
        },
      })
      console.log(`Contract ${result.id} created successfully`)
    }

    // Revalidate relevant paths
    revalidatePath(`/leads/${data.lead_id}`)
    revalidatePath("/contracts")

    return {
      success: true,
      message: "Contract saved successfully",
      contract_id: result.id,
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
    const contracts = await prisma.contract.findMany({
      where: { leadId },
      select: {
        id: true,
        leadId: true,
        contractType: true,
        pdfUrl: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    })

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
  contract_data: {
    signatures: Record<string, string>
    dates: Record<string, string>
    names: Record<string, string>
    addresses: Record<string, string>
    contact_info: Record<string, string>
  }
}) {
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
          signatures: contractData.contract_data.signatures,
          dates: contractData.contract_data.dates,
          names: contractData.contract_data.names,
          addresses: contractData.contract_data.addresses,
          contactInfo: contractData.contract_data.contact_info,
          updatedAt: new Date(),
        },
      })
    } else {
      // Insert new contract
      result = await prisma.contract.create({
        data: {
          leadId: contractData.lead_id,
          contractType: contractData.contract_type,
          signatures: contractData.contract_data.signatures,
          dates: contractData.contract_data.dates,
          names: contractData.contract_data.names,
          addresses: contractData.contract_data.addresses,
          contactInfo: contractData.contract_data.contact_info,
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
