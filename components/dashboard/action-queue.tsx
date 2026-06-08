"use client"

import useSWR from "swr"
import Link from "next/link"
import {
  AlertCircle,
  Clock,
  FileSignature,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type QueueItem = {
  id: string
  type: "stale_lead" | "appt_no_notes" | "unsigned_contract" | "adjuster_followup"
  leadId: string
  title: string
  subtitle: string
  meta?: string
  href: string
}

interface QueueResponse {
  items: QueueItem[]
  counts: { stale: number; notes: number; contracts: number; adjuster: number; total: number }
}

const TYPE_STYLE: Record<
  QueueItem["type"],
  { icon: typeof Clock; ring: string; text: string; chip: string }
> = {
  appt_no_notes: {
    icon: Clock,
    ring: "bg-yellow-500/15 text-yellow-300",
    text: "text-yellow-300",
    chip: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30",
  },
  stale_lead: {
    icon: AlertCircle,
    ring: "bg-orange-500/15 text-orange-300",
    text: "text-orange-300",
    chip: "bg-orange-500/10 text-orange-300 border-orange-500/30",
  },
  unsigned_contract: {
    icon: FileSignature,
    ring: "bg-blue-500/15 text-blue-300",
    text: "text-blue-300",
    chip: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  },
  adjuster_followup: {
    icon: ShieldCheck,
    ring: "bg-emerald-500/15 text-emerald-300",
    text: "text-emerald-300",
    chip: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  },
}

function QueueRow({ item }: { item: QueueItem }) {
  const style = TYPE_STYLE[item.type]
  const Icon = style.icon
  return (
    <Link
      href={item.href}
      className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 transition-colors hover:bg-white/[0.06]"
    >
      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", style.ring)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{item.title}</p>
        <p className="truncate text-xs text-white/50">{item.subtitle}</p>
      </div>
      {item.meta && (
        <span
          className={cn(
            "hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium sm:inline",
            style.chip
          )}
        >
          {item.meta}
        </span>
      )}
      <ChevronRight className="h-4 w-4 shrink-0 text-white/30 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

export function ActionQueue() {
  const { data, isLoading } = useSWR<QueueResponse>("/api/dashboard/action-queue", fetcher, {
    revalidateOnFocus: false,
  })

  const items = data?.items ?? []
  const total = data?.counts?.total ?? 0

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-400" />
          <h2 className="text-lg font-bold text-white">Needs Your Attention</h2>
        </div>
        {total > 0 && (
          <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs font-semibold text-orange-300">
            {total}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8" style={{ color: "#A4D65E" }} />
          <p className="mt-2 text-sm font-medium text-white/70">You&apos;re all caught up</p>
          <p className="text-xs text-white/40">Nothing needs follow-up right now.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 10).map((item) => (
            <QueueRow key={item.id} item={item} />
          ))}
          {items.length > 10 && (
            <p className="pt-1 text-center text-xs text-white/40">
              +{items.length - 10} more
            </p>
          )}
        </div>
      )}
    </section>
  )
}
