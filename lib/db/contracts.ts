import { prisma } from './prisma'
import { Contract, Prisma } from '@prisma/client'

interface CreateContractInput {
  leadId: string
  contractType: string
  signatures: Prisma.JsonObject
  dates: Prisma.JsonObject
  names: Prisma.JsonObject
  addresses: Prisma.JsonObject
  contactInfo: Prisma.JsonObject
  pdfUrl?: string | null
}

interface UpdateContractInput extends Partial<CreateContractInput> {}

/**
 * Get all contracts for a lead
 */
export async function getContractsByLeadId(leadId: string): Promise<Contract[]> {
  try {
    const contracts = await prisma.contract.findMany({
      where: { leadId },
      orderBy: { updatedAt: 'desc' }
    })
    return contracts
  } catch (error) {
    console.error(`Error fetching contracts for lead ${leadId}:`, error)
    throw new Error(`Failed to fetch contracts: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Get a single contract by ID
 */
export async function getContractById(id: string): Promise<Contract | null> {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id }
    })
    return contract
  } catch (error) {
    console.error(`Error fetching contract ${id}:`, error)
    throw new Error(`Failed to fetch contract: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Create or update a contract
 */
export async function upsertContract(leadId: string, contractType: string, data: CreateContractInput): Promise<Contract> {
  try {
    // Check if contract exists
    const existingContract = await prisma.contract.findFirst({
      where: {
        leadId,
        contractType
      }
    })

    if (existingContract) {
      // Update existing contract
      const contract = await prisma.contract.update({
        where: { id: existingContract.id },
        data: {
          signatures: data.signatures,
          dates: data.dates,
          names: data.names,
          addresses: data.addresses,
          contactInfo: data.contactInfo,
          pdfUrl: data.pdfUrl
        }
      })
      return contract
    } else {
      // Create new contract
      const contract = await prisma.contract.create({
        data: {
          leadId,
          contractType,
          signatures: data.signatures,
          dates: data.dates,
          names: data.names,
          addresses: data.addresses,
          contactInfo: data.contactInfo,
          pdfUrl: data.pdfUrl
        }
      })
      return contract
    }
  } catch (error) {
    console.error("Error upserting contract:", error)
    throw new Error(`Failed to upsert contract: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Update a contract's PDF URL
 */
export async function updateContractPdfUrl(id: string, pdfUrl: string): Promise<Contract> {
  try {
    const contract = await prisma.contract.update({
      where: { id },
      data: { pdfUrl }
    })
    return contract
  } catch (error) {
    console.error(`Error updating contract PDF URL ${id}:`, error)
    throw new Error(`Failed to update contract PDF URL: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Delete a contract
 */
export async function deleteContract(id: string): Promise<Contract> {
  try {
    const contract = await prisma.contract.delete({
      where: { id }
    })
    return contract
  } catch (error) {
    console.error(`Error deleting contract ${id}:`, error)
    throw new Error(`Failed to delete contract: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
} 