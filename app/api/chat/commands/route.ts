import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { command, spaceId, userId, userEmail } = body

    if (!command) {
      return NextResponse.json({ error: "No command provided" }, { status: 400 })
    }

    // Parse command
    const parts = command.trim().split(' ')
    const cmd = parts[0].toLowerCase()
    const args = parts.slice(1)

    let result: any = {}

    switch (cmd) {
      case '/status':
        result = await handleStatusCommand(args, spaceId)
        break
      case '/files':
        result = await handleFilesCommand(args, spaceId)
        break
      case '/upload':
        result = await handleUploadCommand(args)
        break
      case '/photos':
        result = await handlePhotosCommand(args, spaceId)
        break
      case '/contracts':
        result = await handleContractsCommand(args, spaceId)
        break
      case '/update':
        result = await handleUpdateCommand(args, spaceId, userEmail)
        break
      case '/help':
        result = await handleHelpCommand()
        break
      default:
        result = { text: "Unknown command. Type /help for available commands." }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error handling chat command:', error)
    return NextResponse.json(
      { error: 'Failed to process command' },
      { status: 500 }
    )
  }
}

async function getLeadFromSpaceId(spaceId: string) {
  // Extract lead ID from space name (format: "Lead: Name - Claim# - ID")
  const spaceName = spaceId.split('/').pop() || ''
  const match = spaceName.match(/Lead: .* - Claim#([A-Z0-9]+) - ([a-f0-9-]+)/)
  
  if (!match) {
    // Fallback to old format if new format doesn't match
    const oldMatch = spaceName.match(/Lead: .* - ([a-f0-9-]+)/)
    if (!oldMatch) {
      return null
    }
    const leadId = oldMatch[1]
    return await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        files: true,
        contracts: true,
        leadPhotos: true,
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })
  }

  const claimNumber = match[1]
  const leadId = match[2]
  
  // Try to find by claim number first, then by ID
  let lead = await prisma.lead.findFirst({
    where: { claimNumber: claimNumber },
    include: {
      files: true,
      contracts: true,
      leadPhotos: true,
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  })
  
  if (!lead) {
    lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        files: true,
        contracts: true,
        leadPhotos: true,
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })
  }
  
  return lead
}

async function getLeadById(leadId: string) {
  return await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      files: true,
      contracts: true,
      leadPhotos: true,
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  })
}

async function handleStatusCommand(args: string[], spaceId?: string) {
  let lead: any = null

  if (args.length > 0) {
    // Command: /status [lead_id]
    lead = await getLeadById(args[0])
  } else if (spaceId) {
    // Command: /status (inside chat space)
    lead = await getLeadFromSpaceId(spaceId)
  }

  if (!lead) {
    return { text: "❌ Lead not found. Please provide a valid lead ID or use this command inside a lead's chat space." }
  }

  return {
    text: `📊 **Lead Status**
    
**Name:** ${lead.firstName || ''} ${lead.lastName || ''}
**Claim #:** ${lead.claimNumber || 'Not provided'}
**Status:** ${lead.status}
**Email:** ${lead.email || 'Not provided'}
**Phone:** ${lead.phone || 'Not provided'}
**Address:** ${lead.address || 'Not provided'}
**Created:** ${new Date(lead.createdAt).toLocaleDateString()}

**Recent Activity:**
${lead.activities.map((activity: any) => `• ${activity.content} (${new Date(activity.createdAt).toLocaleDateString()})`).join('\n')}`
  }
}

async function handleFilesCommand(args: string[], spaceId?: string) {
  let lead: any = null

  if (args.length > 0) {
    lead = await getLeadById(args[0])
  } else if (spaceId) {
    lead = await getLeadFromSpaceId(spaceId)
  }

  if (!lead) {
    return { text: "❌ Lead not found." }
  }

  if (!lead.files || lead.files.length === 0) {
    return { text: "📁 No files found for this lead." }
  }

  const fileList = lead.files.map((file: any) => 
    `• ${file.name} (${file.type})`
  ).join('\n')

  const claimInfo = lead.claimNumber ? ` (Claim #${lead.claimNumber})` : ''
  return {
    text: `📁 **Files for ${lead.firstName || ''} ${lead.lastName || ''}${claimInfo}**
    
${fileList}

**Total:** ${lead.files.length} file(s)`
  }
}

async function handlePhotosCommand(args: string[], spaceId?: string) {
  let lead: any = null

  if (args.length > 0) {
    lead = await getLeadById(args[0])
  } else if (spaceId) {
    lead = await getLeadFromSpaceId(spaceId)
  }

  if (!lead) {
    return { text: "❌ Lead not found." }
  }

  if (!lead.leadPhotos || lead.leadPhotos.length === 0) {
    return { text: "📸 No photos found for this lead." }
  }

  const photoList = lead.leadPhotos.map((photo: any) => 
    `• ${photo.description || 'Photo'} (${new Date(photo.createdAt).toLocaleDateString()})`
  ).join('\n')

  const claimInfo = lead.claimNumber ? ` (Claim #${lead.claimNumber})` : ''
  return {
    text: `📸 **Photos for ${lead.firstName || ''} ${lead.lastName || ''}${claimInfo}**
    
${photoList}

**Total:** ${lead.leadPhotos.length} photo(s)`
  }
}

async function handleContractsCommand(args: string[], spaceId?: string) {
  let lead: any = null

  if (args.length > 0) {
    lead = await getLeadById(args[0])
  } else if (spaceId) {
    lead = await getLeadFromSpaceId(spaceId)
  }

  if (!lead) {
    return { text: "❌ Lead not found." }
  }

  if (!lead.contracts || lead.contracts.length === 0) {
    return { text: "📄 No contracts found for this lead." }
  }

  const contractList = lead.contracts.map((contract: any) => 
    `• ${contract.type} - ${contract.status} (${new Date(contract.createdAt).toLocaleDateString()})`
  ).join('\n')

  const claimInfo = lead.claimNumber ? ` (Claim #${lead.claimNumber})` : ''
  return {
    text: `📄 **Contracts for ${lead.firstName || ''} ${lead.lastName || ''}${claimInfo}**
    
${contractList}

**Total:** ${lead.contracts.length} contract(s)`
  }
}

async function handleUpdateCommand(args: string[], spaceId?: string, userEmail?: string) {
  if (args.length < 1) {
    return { text: "❌ Usage: /update [status] or /update [lead_id] [status]" }
  }

  let lead: any = null
  let newStatus: string

  if (args.length === 1 && spaceId) {
    // Command: /update [status] (inside chat space)
    lead = await getLeadFromSpaceId(spaceId)
    newStatus = args[0]
  } else if (args.length === 2) {
    // Command: /update [lead_id] [status]
    lead = await getLeadById(args[0])
    newStatus = args[1]
  } else {
    return { text: "❌ Invalid command format. Use: /update [status] or /update [lead_id] [status]" }
  }

  if (!lead) {
    return { text: "❌ Lead not found." }
  }

  // Update lead status
  try {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: newStatus }
    })

    // Add activity
    await prisma.activity.create({
      data: {
        leadId: lead.id,
        content: `Status updated to ${newStatus} via chat command by ${userEmail || 'Unknown user'}`,
        type: 'STATUS_CHANGE'
      }
    })

    const claimInfo = lead.claimNumber ? ` (Claim #${lead.claimNumber})` : ''
    return {
      text: `✅ **Status Updated**
      
**Lead:** ${lead.firstName || ''} ${lead.lastName || ''}${claimInfo}
**New Status:** ${newStatus}
**Updated by:** ${userEmail || 'Unknown user'}`
    }
  } catch (error) {
    return { text: "❌ Failed to update status. Please try again." }
  }
}

async function handleUploadCommand(args: string[]) {
  const fileType = args[0] || 'general'
  
  return {
    text: `📁 **File Upload Instructions**

**To upload files to this lead:**
1. **Drag & drop** files directly into this chat
2. **Files will automatically sync** to the CRM
3. **You'll get confirmation** when sync is complete

**Supported file types:**
• 📄 Documents: PDF, DOC, DOCX
• 🖼️ Images: JPG, PNG, GIF
• 📊 Spreadsheets: XLS, XLSX
• 📋 Presentations: PPT, PPTX
• 📁 Other: Any file type

**File categories:**
• Contracts, estimates, ACV
• Photos and damage images
• Reports and documents
• Supplements and warranties

**Note:** Files uploaded here will appear in the CRM file manager for this lead.`
  }
}

async function handleHelpCommand() {
  return {
    text: `🤖 **CRM Chat Bot Commands**

**Inside Lead Chat Space:**
• /status - Check current lead status
• /files - List current lead files
• /photos - View current lead photos
• /contracts - Check current lead contracts
• /update [status] - Update current lead status
• /upload - Get file upload instructions

**From Anywhere:**
• /status [lead_id] - Check specific lead
• /files [lead_id] - List specific lead files
• /photos [lead_id] - View specific lead photos
• /contracts [lead_id] - Check specific lead contracts
• /update [lead_id] [status] - Update specific lead

**File Upload:**
• Drag & drop files directly into chat
• Files automatically sync to CRM
• Supported: Documents, images, spreadsheets

**Other:**
• /help - Show this help message`
  }
} 