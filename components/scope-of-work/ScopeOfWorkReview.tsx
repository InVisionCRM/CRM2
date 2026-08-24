"use client"

import { useState } from "react"
import { AlertTriangle, ExternalLink, Loader2, Send, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { ContractSentResult } from "@/components/contracts/ContractSentDialog"

/** What POST /api/docuseal/scope-of-work returns: an unsent draft. */
export interface ScopeOfWorkDraft {
  submissionId: number
  submitterId: number
  previewUrl: string
  client: { name: string; email: string; phone: string | null }
}

interface Props {
  draft: ScopeOfWorkDraft | null
  /** Called once the client has actually been emailed. */
  onSent: (result: ContractSentResult) => void
  /** Called after the draft is discarded, or when the rep backs out. */
  onDiscarded: () => void
}

/**
 * Shows the real rendered PDF - the exact document the client will receive -
 * and mails it only on explicit approval. Backing out discards the draft, and
 * because the draft was created unsent, nothing ever reached the client.
 */
export function ScopeOfWorkReview({ draft, onSent, onDiscarded }: Props) {
  const [busy, setBusy] = useState<"send" | "discard" | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!draft) return null

  const send = async () => {
    setBusy("send")
    setError(null)
    try {
      const res = await fetch(`/api/docuseal/scope-of-work/${draft.submissionId}/send`, {
        method: "POST",
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.details || body.error || "Could not send")
      onSent({
        ...body,
        client: {
          name: body.client?.name || draft.client.name,
          email: body.client?.email || draft.client.email,
          phone: body.client?.phone ?? draft.client.phone,
        },
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send")
      setBusy(null)
    }
  }

  const discard = async () => {
    setBusy("discard")
    setError(null)
    try {
      await fetch(`/api/docuseal/scope-of-work/${draft.submissionId}`, { method: "DELETE" })
    } finally {
      setBusy(null)
      onDiscarded()
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && busy === null && discard()}>
      <DialogContent
        className="flex h-[100dvh] max-h-[100dvh] w-screen max-w-none flex-col gap-0 rounded-none border-0 bg-[#0A0A0B] p-0 text-zinc-200 sm:h-[92vh] sm:max-h-[92vh] sm:w-[min(760px,94vw)] sm:max-w-none sm:rounded-2xl sm:border sm:border-white/10"
      >
        <div className="shrink-0 border-b border-white/10 px-4 py-3 sm:px-5">
          <DialogTitle className="text-[17px] font-bold tracking-tight text-white">
            Review before sending
          </DialogTitle>
          <p className="mt-0.5 text-xs text-zinc-500">
            This is exactly what {draft.client.name} will receive. Nothing has been sent yet.
          </p>
        </div>

        {/* the genuine rendered document, not a summary of it */}
        <div className="min-h-0 flex-1 bg-[#141519]">
          <iframe
            src={draft.previewUrl}
            title="Scope of work preview"
            className="h-full w-full border-0"
          />
        </div>

        <div className="shrink-0 border-t border-white/10 bg-[#0d0e11] px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 sm:px-5">
          {error && (
            <div className="mb-2.5 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          <a
            href={draft.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-2.5 flex items-center justify-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300"
          >
            <ExternalLink className="h-3 w-3" />
            Open full size
          </a>

          <div className="flex gap-2">
            <button
              onClick={discard}
              disabled={busy !== null}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200 disabled:opacity-50"
            >
              {busy === "discard" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Discard
            </button>
            <button
              onClick={send}
              disabled={busy !== null}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#59FF00] px-4 text-[15px] font-semibold text-[#06210a] shadow-[0_0_20px_rgba(89,255,0,.3)] transition-shadow hover:shadow-[0_0_28px_rgba(89,255,0,.45)] disabled:opacity-60"
            >
              {busy === "send" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" strokeWidth={2.5} />}
              {busy === "send" ? "Sending…" : `Send to ${draft.client.name.split(" ")[0]}`}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
