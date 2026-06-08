import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import { prisma } from "@/lib/db/prisma"
import { startOfDay, endOfDay, differenceInCalendarDays } from "date-fns"

// Leads with no activity in this many days are considered "stale"
const STALE_DAYS = 7

type QueueItem = {
  id: string
  type: "stale_lead" | "appt_no_notes" | "unsigned_contract" | "adjuster_followup"
  leadId: string
  title: string
  subtitle: string
  meta?: string
  href: string
  // lower = more urgent, used for sorting the unified list
  priority: number
}

function leadName(lead: { firstName: string | null; lastName: string | null }) {
  return [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim() || "Unnamed lead"
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const isAdmin = session.user.role === "ADMIN"
    const now = new Date()
    const staleCutoff = new Date(now.getTime() - STALE_DAYS * 24 * 60 * 60 * 1000)

    // Non-admins only see their own assigned leads / appointments.
    const leadScope = isAdmin ? {} : { assignedToId: userId }

    const [staleLeadRows, apptRows, contractRows, adjusterRows] = await Promise.all([
      // 1. Leads with no activity in the last STALE_DAYS days (or never touched)
      prisma.lead.findMany({
        where: {
          ...leadScope,
          status: { notIn: ["completed_jobs", "zero_balance", "denied"] },
          activities: { none: { createdAt: { gte: staleCutoff } } },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          status: true,
          activities: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
        },
        take: 8,
        orderBy: { updatedAt: "asc" },
      }),

      // 2. Today's appointments that still have no notes logged
      prisma.appointment.findMany({
        where: {
          userId,
          startTime: { gte: startOfDay(now), lte: endOfDay(now) },
          OR: [{ notes: null }, { notes: "" }],
        },
        select: {
          id: true,
          title: true,
          startTime: true,
          purpose: true,
          leadId: true,
          lead: { select: { firstName: true, lastName: true } },
        },
        orderBy: { startTime: "asc" },
      }),

      // 3. Contracts sent for signing but not yet signed
      prisma.contract.findMany({
        where: {
          status: "sent",
          lead: leadScope,
        },
        select: {
          id: true,
          leadId: true,
          contractType: true,
          updatedAt: true,
          lead: { select: { firstName: true, lastName: true } },
        },
        take: 8,
        orderBy: { updatedAt: "asc" },
      }),

      // 4. Adjuster meetings whose date has passed but the claim hasn't moved forward
      prisma.lead.findMany({
        where: {
          ...leadScope,
          adjusterAppointmentDate: { not: null, lte: endOfDay(now) },
          status: { notIn: ["completed_jobs", "zero_balance", "denied"] },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          adjusterAppointmentDate: true,
          insuranceCompany: true,
        },
        take: 8,
        orderBy: { adjusterAppointmentDate: "asc" },
      }),
    ])

    const items: QueueItem[] = []

    for (const lead of staleLeadRows) {
      const last = lead.activities[0]?.createdAt
      const days = last ? differenceInCalendarDays(now, last) : null
      items.push({
        id: `stale-${lead.id}`,
        type: "stale_lead",
        leadId: lead.id,
        title: leadName(lead),
        subtitle: days === null ? "No activity logged yet" : `No activity in ${days} days`,
        meta: "Reach out",
        href: `/leads/${lead.id}`,
        priority: days === null ? 5 : Math.min(days, 60),
      })
    }

    for (const appt of apptRows) {
      items.push({
        id: `notes-${appt.id}`,
        type: "appt_no_notes",
        leadId: appt.leadId,
        title: appt.lead ? leadName(appt.lead) : appt.title,
        subtitle: "Appointment today — no notes yet",
        meta: "Log outcome",
        href: `/leads/${appt.leadId}`,
        priority: 1,
      })
    }

    for (const contract of contractRows) {
      const days = differenceInCalendarDays(now, contract.updatedAt)
      items.push({
        id: `contract-${contract.id}`,
        type: "unsigned_contract",
        leadId: contract.leadId,
        title: contract.lead ? leadName(contract.lead) : "Lead",
        subtitle: `Contract sent ${days <= 0 ? "today" : `${days} days ago`} — not signed`,
        meta: "Nudge to sign",
        href: `/leads/${contract.leadId}`,
        priority: 2 + Math.min(days, 30) / 30,
      })
    }

    for (const lead of adjusterRows) {
      const apptDate = lead.adjusterAppointmentDate as Date
      const days = differenceInCalendarDays(now, apptDate)
      items.push({
        id: `adjuster-${lead.id}`,
        type: "adjuster_followup",
        leadId: lead.id,
        title: leadName(lead),
        subtitle:
          days < 0
            ? `Adjuster meeting in ${Math.abs(days)} days`
            : days === 0
              ? "Adjuster meeting today"
              : `Adjuster met ${days} days ago — follow up`,
        meta: lead.insuranceCompany || "Insurance",
        href: `/leads/${lead.id}`,
        priority: days < 0 ? 4 : 1.5,
      })
    }

    items.sort((a, b) => a.priority - b.priority)

    return NextResponse.json({
      items,
      counts: {
        stale: staleLeadRows.length,
        notes: apptRows.length,
        contracts: contractRows.length,
        adjuster: adjusterRows.length,
        total: items.length,
      },
    })
  } catch (error) {
    console.error("Error building action queue:", error)
    return NextResponse.json({ error: "Failed to build action queue" }, { status: 500 })
  }
}
