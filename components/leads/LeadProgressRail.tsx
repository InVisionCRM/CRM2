"use client"

import { useState } from "react"
import useSWR from "swr"
import { Check, Clock, FileText, Loader2, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

type StageState = "done" | "active" | "todo"

interface Stage {
  key: string
  label: string
  state: StageState
  /** Already phrased by the API - each stage says what it means. */
  detail: string
  submissionId: number | null
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const LOOK: Record<StageState, { chrome: string; label: string; sub: string }> = {
  done: {
    chrome: "border-[#59FF00]/40 bg-[#59FF00]/[0.08] shadow-[0_0_14px_rgba(89,255,0,.12)]",
    label: "text-[#59FF00]",
    sub: "text-[#59FF00]/70",
  },
  active: {
    chrome: "border-amber-500/40 bg-amber-500/[0.08]",
    label: "text-amber-300",
    sub: "text-amber-300/70",
  },
  todo: {
    chrome: "border-white/10 bg-white/[0.03]",
    label: "text-zinc-500",
    sub: "text-zinc-600",
  },
}

export function LeadProgressRail({ leadId }: { leadId: string }) {
  const [opening, setOpening] = useState<number | null>(null)
  const { data, error, isLoading } = useSWR<{ stages: Stage[] }>(
    `/api/leads/${encodeURIComponent(leadId)}/progress`,
    fetcher,
  )

  /* The documents endpoint answers with a JSON list, not the file itself. */
  const openDoc = async (submissionId: number) => {
    setOpening(submissionId)
    try {
      const res = await fetch(`/api/docuseal/submissions/${submissionId}/documents`)
      const docs = await res.json()
      if (Array.isArray(docs) && docs.length > 0) {
        window.open(docs[0].url, "_blank", "noopener")
      }
    } finally {
      setOpening(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading job progress…
      </div>
    )
  }
  if (error || !data?.stages) return null

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500">
        Job Progress
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {data.stages.map((s) => {
          const look = LOOK[s.state]
          const Icon = s.state === "done" ? Check : s.state === "active" ? Clock : Minus
          return (
            <div key={s.key} className={cn("rounded-xl border px-3 py-2.5", look.chrome)}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", look.label)} strokeWidth={3} />
                  <span className={cn("truncate text-[12.5px] font-semibold", look.label)}>
                    {s.label}
                  </span>
                </div>

                {/* the word View, clickable, only once there is a signed document */}
                {s.state === "done" && s.submissionId !== null && (
                  <button
                    onClick={() => openDoc(s.submissionId!)}
                    disabled={opening === s.submissionId}
                    className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold text-[#59FF00] underline underline-offset-2 transition-colors hover:bg-[#59FF00]/10 disabled:opacity-60"
                  >
                    {opening === s.submissionId ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <FileText className="h-3 w-3" />
                    )}
                    View
                  </button>
                )}
              </div>

              <p className={cn("mt-0.5 pl-[22px] text-[11px]", look.sub)}>
                {s.detail}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
