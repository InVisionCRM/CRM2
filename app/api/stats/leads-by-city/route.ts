import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Get all leads with addresses
    const leads = await prisma.lead.findMany({
      where: {
        address: {
          not: null
        }
      },
      select: {
        id: true,
        address: true,
        status: true
      }
    })

    // Extract zip code from address and count leads
    const zipCount: Record<string, number> = {}
    
    leads.forEach(lead => {
      if (lead.address) {
        // Extract zip code from address using regex (matches 5-digit zip codes)
        const zipMatch = lead.address.match(/\b\d{5}\b/)
        
        if (zipMatch) {
          const zipCode = zipMatch[0]
          zipCount[zipCode] = (zipCount[zipCode] || 0) + 1
        }
      }
    })

    // Sort zip codes by lead count and get top 3
    const topZipCodes = Object.entries(zipCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([zipCode, count], index) => ({
        zipCode,
        count,
        rank: index + 1,
        percentage: leads.length > 0 ? Math.round((count / leads.length) * 100) : 0
      }))

    return NextResponse.json({ 
      topZipCodes: topZipCodes || [],
      totalLeads: leads.length 
    })
  } catch (error) {
    console.error('Error fetching leads by city:', error)
    return NextResponse.json({ error: 'Failed to fetch leads by city' }, { status: 500 })
  }
} 