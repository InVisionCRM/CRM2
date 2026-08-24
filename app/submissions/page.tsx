"use client"

import { useCallback, useEffect, useState } from "react"
import {
  AlertTriangle, Archive, CheckCircle2, Clock, Copy, Download,
  Eye, FileText, Loader2, RefreshCw, Search, XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ types */

interface Submitter {
  email: string
  name: string | null
  slug: string
  status: string
  sent_at: string | null
  opened_at: string | null
  completed_at: string | null
}

interface Submission {
  id: number
  status: string
  slug: string
  audit_log_url: string | null
  combined_document_url: string | null
  completed_at: string | null
  created_at: string
  archived_at: string | null
  submitters?: Submitter[]
  template?: { id: number; name: string; folder_name: string } | null
  displayStatus?: string
}

/**
 * Only these four are honoured by DocuSeal's submission-level `?status=` filter.
 * Submitter-level states (opened, sent, partially completed) return zero rows
 * server-side, so they are never used as a server filter here.
 */
const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Awaiting signature" },
  { value: "completed", label: "Signed" },
  { value: "declined", label: "Declined" },
  { value: "expired", label: "Expired" },
] as const

const PAGE_SIZE = 25

/* -------------------------------------------------------------- presentation */

/** Single source of truth: icon, colour and label all derive from one value. */
function statusStyle(submission: Submission) {
  const raw = (submission.displayStatus || submission.status || "").toLowerCase()
  if (raw.startsWith("complet") || raw === "signed")
    return { label: "Signed", Icon: CheckCircle2, cls: "border-[#59FF00]/35 bg-[#59FF00]/10 text-[#59FF00]" }
  if (raw.startsWith("declin"))
    return { label: "Declined", Icon: XCircle, cls: "border-red-500/35 bg-red-500/10 text-red-400" }
  if (raw.startsWith("expir"))
    return { label: "Expired", Icon: AlertTriangle, cls: "border-orange-500/35 bg-orange-500/10 text-orange-400" }
  if (raw.startsWith("partial"))
    return { label: "Partially signed", Icon: Clock, cls: "border-sky-500/35 bg-sky-500/10 text-sky-300" }
  if (raw.startsWith("open"))
    return { label: "Opened", Icon: Eye, cls: "border-sky-500/35 bg-sky-500/10 text-sky-300" }
  if (raw.startsWith("sent") || raw.startsWith("await") || raw.startsWith("pend"))
    return { label: "Awaiting signature", Icon: Clock, cls: "border-amber-500/35 bg-amber-500/10 text-amber-300" }
  return { label: submission.displayStatus || submission.status || "Unknown", Icon: FileText, cls: "border-white/10 bg-white/5 text-zinc-400" }
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  })
}

function signerLabel(s: Submission): string {
  const list = s.submitters ?? []
  if (list.length === 0) return "No signer"
  return list.map((x) => x.name || x.email).join(", ")
}

/* -------------------------------------------------------------------- page */

export default function SubmissionsPage() {
  const { toast } = useToast()

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [status, setStatus] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [appliedSearch, setAppliedSearch] = useState("")

  const [nextCursor, setNextCursor] = useState<number | null>(null)
  const [confirmArchive, setConfirmArchive] = useState<Submission | null>(null)
  const [archivingId, setArchivingId] = useState<number | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [reloadNonce, setReloadNonce] = useState(0)

  const buildQuery = useCallback((cursor?: number) => {
    const p = new URLSearchParams({ limit: String(PAGE_SIZE) })
    if (status !== "all") p.set("status", status)
    if (appliedSearch.trim()) p.set("q", appliedSearch.trim())
    if (cursor) p.set("after", String(cursor))
    return p.toString()
  }, [status, appliedSearch])

  /* Fetching is driven by state, never by a setTimeout after setState - that
     pattern closed over the previous filter and ran every query one selection
     behind. */
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`/api/docuseal/submissions?${buildQuery()}`)
      .then(async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(body.details || body.error || `Request failed (${res.status})`)
        return body
      })
      .then((body) => {
        if (cancelled) return
        setSubmissions(body.data ?? [])
        setNextCursor(body.pagination?.next ?? null)
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Failed to load submissions"))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [buildQuery, reloadNonce])

  const loadMore = async () => {
    if (!nextCursor) return
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/docuseal/submissions?${buildQuery(nextCursor)}`)
      const body = await res.json()
      if (!res.ok) throw new Error(body.details || body.error || "Failed to load more")
      setSubmissions((prev) => [...prev, ...(body.data ?? [])])
      setNextCursor(body.pagination?.next ?? null)
    } catch (e) {
      toast({ variant: "destructive", title: "Couldn't load more", description: e instanceof Error ? e.message : "" })
    } finally {
      setLoadingMore(false)
    }
  }

  const refresh = () => {
    setAppliedSearch(search)
    setReloadNonce((n) => n + 1)
  }

  /** Completed submissions have a document; combined_document_url is often null
      on Cloud, so the documents endpoint is the reliable source. */
  const openDocument = async (s: Submission) => {
    setBusyId(s.id)
    try {
      if (s.combined_document_url) {
        window.open(s.combined_document_url, "_blank", "noopener")
        return
      }
      const res = await fetch(`/api/docuseal/submissions/${s.id}/documents`)
      const docs = await res.json()
      if (!res.ok) throw new Error(docs.details || docs.error || "Could not fetch the document")
      if (!Array.isArray(docs) || docs.length === 0) throw new Error("DocuSeal has no document for this submission yet")
      window.open(docs[0].url, "_blank", "noopener")
    } catch (e) {
      toast({ variant: "destructive", title: "Contract unavailable", description: e instanceof Error ? e.message : "" })
    } finally {
      setBusyId(null)
    }
  }

  const copySigningLink = async (s: Submission) => {
    const slug = s.submitters?.[0]?.slug
    if (!slug) {
      toast({ variant: "destructive", title: "No signing link", description: "This submission has no signer." })
      return
    }
    await navigator.clipboard.writeText(`https://docuseal.com/s/${slug}`)
    toast({ title: "Signing link copied" })
  }

  const archive = async (s: Submission) => {
    setArchivingId(s.id)
    try {
      const res = await fetch(`/api/docuseal/submissions/${s.id}/archive`, { method: "DELETE" })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.details || body.error || "Archive failed")
      setSubmissions((prev) => prev.filter((x) => x.id !== s.id))
      toast({ title: "Archived", description: "It's hidden here but still recoverable in DocuSeal." })
      setConfirmArchive(null)
    } catch (e) {
      toast({ variant: "destructive", title: "Couldn't archive", description: e instanceof Error ? e.message : "" })
    } finally {
      setArchivingId(null)
    }
  }

  const counts = STATUS_FILTERS.slice(1).map((f) => ({
    ...f,
    n: submissions.filter((s) => statusStyle(s).label === (f.value === "pending" ? "Awaiting signature" : f.label)).length,
  }))

  return (
    <div className="min-h-screen bg-[#0A0A0B] px-4 py-6 text-zinc-200 sm:px-6">
      <div className="mx-auto max-w-4xl">

        <header className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight text-white">Contracts</h1>
          <p className="mt-1 text-sm text-zinc-500">Every contract sent for signature.</p>
        </header>

        {/* search + refresh */}
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <Input
              aria-label="Search contracts by client name or email"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") setAppliedSearch(search) }}
              onBlur={() => setAppliedSearch(search)}
              className="h-12 rounded-xl border-white/10 bg-white/[0.04] pl-9 text-base text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
          <Button
            onClick={refresh}
            aria-label="Refresh"
            className="h-12 w-12 shrink-0 rounded-xl border border-white/10 bg-white/[0.04] p-0 hover:bg-white/[0.08]"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>

        {/* status filter — every value here is one the API actually honours */}
        <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((f) => {
            const active = status === f.value
            const count = counts.find((c) => c.value === f.value)?.n
            return (
              <button
                key={f.value}
                onClick={() => setStatus(f.value)}
                aria-pressed={active}
                className={cn(
                  "min-h-[44px] rounded-xl border px-3.5 text-sm font-medium transition-colors",
                  active
                    ? "border-[#59FF00]/40 bg-[#59FF00]/10 text-[#59FF00] shadow-[0_0_14px_rgba(89,255,0,.18)]"
                    : "border-white/10 bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200",
                )}
              >
                {f.label}
                {f.value !== "all" && count !== undefined && count > 0 && (
                  <span className="ml-1.5 opacity-60">{count}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* error stays inline — the filters remain usable */}
        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-red-300">Couldn&apos;t load contracts</p>
              <p className="mt-0.5 break-words text-xs text-red-400/80">{error}</p>
            </div>
            <Button onClick={refresh} className="h-9 shrink-0 rounded-lg border border-red-500/30 bg-transparent px-3 text-xs text-red-300 hover:bg-red-500/10">
              Retry
            </Button>
          </div>
        )}

        <div aria-live="polite" className="sr-only">
          {loading ? "Loading contracts" : `${submissions.length} contracts shown`}
        </div>

        {/* list */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[132px] rounded-2xl bg-white/[0.04]" />
            ))}
          </div>
        ) : submissions.length === 0 && !error ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-14 text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
            <p className="text-sm font-medium text-zinc-300">
              {appliedSearch || status !== "all" ? "Nothing matches those filters" : "No contracts sent yet"}
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              {appliedSearch || status !== "all"
                ? "Try clearing the search or choosing All."
                : "Send one from a lead's page and it'll show up here."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {submissions.map((s) => {
              const { label, Icon, cls } = statusStyle(s)
              const isSigned = label === "Signed"
              return (
                <li key={s.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/[0.16]">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-white">{signerLabel(s)}</p>
                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                        {s.template?.name ?? "Untitled contract"}
                      </p>
                    </div>
                    <span className={cn("flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium", cls)}>
                      <Icon aria-hidden className="h-3.5 w-3.5" />
                      {label}
                    </span>
                  </div>

                  <dl className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-[11.5px] text-zinc-500">
                    <div className="flex gap-1.5">
                      <dt>Sent</dt>
                      <dd className="text-zinc-400">{formatDate(s.submitters?.[0]?.sent_at ?? s.created_at)}</dd>
                    </div>
                    {s.completed_at && (
                      <div className="flex gap-1.5">
                        <dt>Signed</dt>
                        <dd className="text-[#59FF00]/80">{formatDate(s.completed_at)}</dd>
                      </div>
                    )}
                  </dl>

                  <div className="flex flex-wrap gap-2">
                    {isSigned && (
                      <Button
                        onClick={() => openDocument(s)}
                        disabled={busyId === s.id}
                        className="min-h-[44px] flex-1 rounded-xl border border-[#59FF00]/30 bg-[#59FF00]/10 px-3 text-sm font-medium text-[#59FF00] hover:bg-[#59FF00]/20 sm:flex-none"
                      >
                        {busyId === s.id ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
                        Signed PDF
                      </Button>
                    )}
                    {!isSigned && (
                      <Button
                        onClick={() => copySigningLink(s)}
                        className="min-h-[44px] flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-zinc-300 hover:bg-white/[0.08] sm:flex-none"
                      >
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        Signing link
                      </Button>
                    )}
                    {s.audit_log_url && (
                      <Button
                        onClick={() => window.open(s.audit_log_url!, "_blank", "noopener")}
                        className="min-h-[44px] rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-zinc-400 hover:bg-white/[0.08]"
                      >
                        Audit log
                      </Button>
                    )}
                    <Button
                      onClick={() => setConfirmArchive(s)}
                      aria-label={`Archive contract for ${signerLabel(s)}`}
                      className="min-h-[44px] rounded-xl border border-white/10 bg-transparent px-3 text-sm font-medium text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300"
                    >
                      <Archive className="mr-1.5 h-3.5 w-3.5" />
                      Archive
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {/* honest footer: no fabricated total */}
        {!loading && submissions.length > 0 && (
          <div className="mt-5 text-center">
            {nextCursor ? (
              <Button
                onClick={loadMore}
                disabled={loadingMore}
                className="min-h-[48px] w-full rounded-xl border border-white/10 bg-white/[0.04] text-sm font-medium text-zinc-300 hover:bg-white/[0.08] sm:w-auto sm:px-8"
              >
                {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Load more
              </Button>
            ) : (
              <p className="text-xs text-zinc-600">
                {submissions.length} contract{submissions.length === 1 ? "" : "s"} — that&apos;s all of them
              </p>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={!!confirmArchive} onOpenChange={(o) => !o && setConfirmArchive(null)}>
        <AlertDialogContent className="max-w-[340px] rounded-2xl border border-white/10 bg-[#141519] text-zinc-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Archive this contract?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              It disappears from this list but stays in DocuSeal, so you can bring it back.
              Nothing is permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="min-h-[44px] rounded-xl border-white/10 bg-transparent text-zinc-300 hover:bg-white/5">
              Keep it
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); if (confirmArchive) archive(confirmArchive) }}
              disabled={archivingId !== null}
              className="min-h-[44px] rounded-xl bg-white/10 text-zinc-100 hover:bg-white/20"
            >
              {archivingId !== null ? "Archiving…" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
