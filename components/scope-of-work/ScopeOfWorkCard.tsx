"use client"

import { useState } from "react"
import useSWR from "swr"
import { CheckCircle2, Clock, Download, FileText, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Scope {
  submissionId: number
  status: string
  sentAt: string | null
  completedAt: string | null
  values: Record<string, unknown>
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : ""
}
function on(v: unknown): boolean {
  return v === true || v === "true" || v === "✓"
}
function date(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

/** Short flags worth seeing at a glance on the lead. */
function flags(v: Record<string, unknown>): string[] {
  const out: string[] = []
  if (on(v.addingYes)) out.push("Adding ventilation")
  if (on(v.ventilation_existing)) out.push("Pre-existing ventilation")
  if (on(v.gutterGuardsYes)) out.push("Has gutter guards")
  if (on(v.solarOwned)) out.push("Solar — owned")
  if (on(v.solarLeased)) out.push("Solar — leased")
  if (on(v.critterYes)) out.push("Critter cage")
  if (on(v.dishKeep)) out.push("Satellite: keep")
  if (on(v.dishDispose)) out.push("Satellite: dispose")
  if (on(v.detachedYes)) out.push("Detached structure")
  if (on(v.drivewayYes)) out.push("Driveway damage")
  return out
}

export function ScopeOfWorkCard({ leadId }: { leadId: string }) {
  const [opening, setOpening] = useState(false)
  const { data, error, isLoading } = useSWR<{ scope: Scope | null }>(
    `/api/docuseal/scope-of-work/for-lead?leadId=${encodeURIComponent(leadId)}`,
    fetcher,
  )

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading scope of work…
      </div>
    )
  }
  if (error || data?.scope === undefined) return null

  if (data.scope === null) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center">
        <FileText className="mx-auto mb-2 h-6 w-6 text-zinc-700" />
        <p className="text-sm font-medium text-zinc-400">No scope of work sent yet</p>
      </div>
    )
  }

  const s = data.scope
  const v = s.values
  const signed = s.status === "completed"
  /* The documents endpoint returns a JSON list, not the file - resolve it to a
     real PDF URL before opening, or the tab shows JSON. */
  const openSignedPdf = async () => {
    setOpening(true)
    try {
      const res = await fetch(`/api/docuseal/submissions/${s.submissionId}/documents`)
      const docs = await res.json()
      if (Array.isArray(docs) && docs.length > 0) {
        window.open(docs[0].url, "_blank", "noopener")
      }
    } finally {
      setOpening(false)
    }
  }

  const rows: Array<[string, string]> = [
    ["Roof", str(v.roofSpec)],
    ["Gutters", [on(v.guttersDownspouts) ? "Gutters & downspouts" : on(v.guttersNone) ? "None" : "", str(v.gutterColor)].filter(Boolean).join(" · ")],
    ["Siding", str(v.sidingSpec) || str(v.sidingColor)],
    ["Solar", str(v.solarCompany)],
  ].filter(([, val]) => val !== "") as Array<[string, string]>

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14.5px] font-semibold text-white">Scope of Work</p>
          <p className="mt-0.5 text-[11.5px] text-zinc-500">
            Sent {date(s.sentAt)}
            {s.completedAt ? ` · signed ${date(s.completedAt)}` : ""}
          </p>
        </div>
        <span
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium",
            signed
              ? "border-[#59FF00]/35 bg-[#59FF00]/10 text-[#59FF00]"
              : "border-amber-500/35 bg-amber-500/10 text-amber-300",
          )}
        >
          {signed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
          {signed ? "Signed" : "Awaiting signature"}
        </span>
      </div>

      {rows.length > 0 && (
        <dl className="mb-3 grid grid-cols-[76px_1fr] gap-x-3 gap-y-1.5 text-[12.5px]">
          {rows.map(([k, val]) => (
            <div key={k} className="contents">
              <dt className="text-zinc-600">{k}</dt>
              <dd className="min-w-0 break-words text-zinc-300">{val}</dd>
            </div>
          ))}
        </dl>
      )}

      {flags(v).length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {flags(v).map((f) => (
            <span key={f} className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-zinc-400">
              {f}
            </span>
          ))}
        </div>
      )}

      {signed && (
        <button
          onClick={openSignedPdf}
          disabled={opening}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#59FF00]/30 bg-[#59FF00]/10 text-sm font-medium text-[#59FF00] hover:bg-[#59FF00]/20 disabled:opacity-60"
        >
          {opening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Signed PDF
        </button>
      )}
    </div>
  )
}
