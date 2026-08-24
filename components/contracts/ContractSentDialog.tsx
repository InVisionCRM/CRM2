"use client"

import { useState } from "react"
import { Check, Copy, Phone } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

/** Shape returned by POST /api/docuseal/send-contract. */
export interface ContractSentResult {
  sent: boolean
  sentAt: string | null
  submissionId: number
  templateName: string
  signingUrl: string
  client: { name: string; email: string; phone: string | null }
}

interface Props {
  result: ContractSentResult | null
  onClose: () => void
}

function formatSentAt(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  })
}

/** Strips formatting so tel: gets clean digits. */
function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`
}

export function ContractSentDialog({ result, onClose }: Props) {
  const [copied, setCopied] = useState(false)

  if (!result) return null

  const firstName = result.client.name.split(" ")[0] || "your client"
  const phone = result.client.phone

  const copyLink = async () => {
    await navigator.clipboard.writeText(result.signingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[360px] gap-0 rounded-2xl text-zinc-300 border border-[#59FF00]/25 bg-gradient-to-b from-[#141519] to-[#0d0e11] p-0 text-center shadow-[0_0_0_1px_rgba(0,0,0,.6),0_18px_50px_-14px_rgba(89,255,0,.22)]"
      >

        <div className="px-6 pb-6 pt-8">
          <div className="mx-auto mb-4 flex h-14 w-14 animate-[pulse_1.6s_ease-out_1] items-center justify-center rounded-full border-[1.5px] border-[#59FF00] bg-[#59FF00]/10 shadow-[0_0_22px_rgba(89,255,0,.35)]">
            <Check className="h-7 w-7 text-[#59FF00]" strokeWidth={3} />
          </div>

          <DialogTitle className="mb-1.5 text-center text-[19px] font-bold tracking-tight text-white">
            Contract sent
          </DialogTitle>
          <p className="mb-5 text-sm leading-relaxed text-zinc-400">
            The {result.templateName.replace(/^In-Vision Construction /, "")} is on its way to{" "}
            <span className="font-semibold text-[#59FF00]">{result.client.name}</span>.
          </p>

          <dl className="mb-5 space-y-1 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3.5 py-3 text-left text-[12.5px] leading-relaxed text-zinc-300">
            <div className="flex gap-2">
              <dt className="w-14 shrink-0 text-zinc-500">Email</dt>
              <dd className="min-w-0 truncate">{result.client.email}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-14 shrink-0 text-zinc-500">Sent</dt>
              <dd>{formatSentAt(result.sentAt)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-14 shrink-0 text-zinc-500">Status</dt>
              <dd className={result.sent ? "text-[#59FF00]" : "text-amber-400"}>
                {result.sent ? "Delivered" : "Queued — not yet sent"}
              </dd>
            </div>
          </dl>

          {phone ? (
            <a
              href={telHref(phone)}
              className="mb-2.5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#59FF00] px-4 text-[14.5px] font-semibold text-[#06210a] shadow-[0_0_20px_rgba(89,255,0,.3)] transition-shadow hover:shadow-[0_0_28px_rgba(89,255,0,.45)]"
            >
              <Phone className="h-4 w-4" strokeWidth={2.5} />
              Call {firstName} · {phone}
            </a>
          ) : (
            <p className="mb-2.5 rounded-xl border border-white/[0.07] px-4 py-3 text-xs text-zinc-500">
              No phone number on this lead — add one to call from here.
            </p>
          )}

          <button
            onClick={copyLink}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? "Link copied" : "Copy signing link"}
          </button>

          <p className="mt-3 text-[11.5px] text-zinc-600">
            Most clients sign within 24 hours
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
