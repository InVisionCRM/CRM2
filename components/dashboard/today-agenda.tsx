"use client"

import useSWR from "swr"
import Link from "next/link"
import { format } from "date-fns"
import {
  Navigation,
  Phone,
  MessageSquare,
  MapPin,
  CalendarDays,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
} from "lucide-react"
import { cn } from "@/lib/utils"

const ACCENT = "#A4D65E"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Appointment shape returned by /api/appointments (includes the full lead relation)
interface ApptLead {
  id: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  address: string | null
  latitude: string | number | null
  longitude: string | number | null
}
interface Appt {
  id: string
  title: string
  startTime: string
  endTime: string
  status: string
  purpose: string
  address: string | null
  notes: string | null
  leadId: string
  lead: ApptLead | null
}

const PURPOSE_STYLE: Record<string, string> = {
  INSPECTION: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  FILE_CLAIM: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  FOLLOW_UP: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  ADJUSTER: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  BUILD_DAY: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  OTHER: "bg-gray-500/15 text-gray-300 border-gray-500/30",
}

const PURPOSE_LABEL: Record<string, string> = {
  INSPECTION: "Inspection",
  FILE_CLAIM: "File Claim",
  FOLLOW_UP: "Follow Up",
  ADJUSTER: "Adjuster",
  BUILD_DAY: "Build Day",
  OTHER: "Visit",
}

function leadName(lead: ApptLead | null, fallback: string) {
  if (!lead) return fallback
  return [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim() || fallback
}

function weatherIcon(main: string | undefined) {
  switch ((main || "").toLowerCase()) {
    case "clear":
      return Sun
    case "clouds":
      return Cloud
    case "rain":
      return CloudRain
    case "drizzle":
      return CloudDrizzle
    case "snow":
      return CloudSnow
    case "thunderstorm":
      return CloudLightning
    case "mist":
    case "fog":
    case "haze":
      return CloudFog
    default:
      return Cloud
  }
}

function WeatherBadge({ lat, lon }: { lat: number; lon: number }) {
  const { data } = useSWR(
    `/api/weather/forecast?lat=${lat}&lon=${lon}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 600000 }
  )
  const today = data?.daily?.[0]
  const current = data?.current
  if (!today && !current) return null

  const main = current?.weather?.[0]?.main ?? today?.weather?.[0]?.main
  const Icon = weatherIcon(main)
  const hi = today?.temp?.max != null ? Math.round(today.temp.max) : null
  const lo = today?.temp?.min != null ? Math.round(today.temp.min) : null
  const desc = current?.weather?.[0]?.description ?? today?.weather?.[0]?.description ?? ""

  return (
    <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 text-xs text-white/70">
      <Icon className="h-3.5 w-3.5" style={{ color: ACCENT }} />
      {hi != null && (
        <span className="font-medium text-white/90">
          {hi}°{lo != null && <span className="text-white/50">/{lo}°</span>}
        </span>
      )}
      <span className="capitalize text-white/50 hidden sm:inline">{desc}</span>
    </div>
  )
}

function ActionButton({
  href,
  icon: Icon,
  label,
  accent,
}: {
  href: string
  icon: typeof Phone
  label: string
  accent?: boolean
}) {
  return (
    <a
      href={href}
      target={accent ? "_blank" : undefined}
      rel="noreferrer"
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors",
        accent
          ? "border-[#A4D65E]/40 bg-[#A4D65E]/10 text-[#A4D65E] hover:bg-[#A4D65E]/20"
          : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </a>
  )
}

function AgendaCard({ appt }: { appt: Appt }) {
  const lead = appt.lead
  const name = leadName(lead, appt.title)
  const address = lead?.address || appt.address
  const phone = lead?.phone
  const lat = lead?.latitude != null ? Number(lead.latitude) : null
  const lon = lead?.longitude != null ? Number(lead.longitude) : null
  const start = new Date(appt.startTime)

  const navHref =
    lat != null && lon != null && !Number.isNaN(lat) && !Number.isNaN(lon)
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`
      : address
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
        : null

  return (
    <div className="flex gap-3">
      {/* Time rail */}
      <div className="flex w-14 shrink-0 flex-col items-end pt-1">
        <span className="text-sm font-semibold text-white">{format(start, "h:mm")}</span>
        <span className="text-[10px] uppercase tracking-wide text-white/40">
          {format(start, "a")}
        </span>
      </div>

      {/* Timeline dot + line */}
      <div className="relative flex flex-col items-center">
        <span
          className="mt-1.5 h-3 w-3 rounded-full border-2"
          style={{ borderColor: ACCENT, background: "#0d0e0d" }}
        />
        <span className="mt-1 w-px flex-1 bg-white/10" />
      </div>

      {/* Card */}
      <div className="mb-4 flex-1 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/leads/${appt.leadId}`}
              className="block truncate text-sm font-semibold text-white hover:underline"
            >
              {name}
            </Link>
            {address && (
              <div className="mt-0.5 flex items-center gap-1 text-xs text-white/50">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{address}</span>
              </div>
            )}
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
              PURPOSE_STYLE[appt.purpose] || PURPOSE_STYLE.OTHER
            )}
          >
            {PURPOSE_LABEL[appt.purpose] || "Visit"}
          </span>
        </div>

        {lat != null && lon != null && !Number.isNaN(lat) && !Number.isNaN(lon) && (
          <div className="mt-2.5">
            <WeatherBadge lat={lat} lon={lon} />
          </div>
        )}

        <div className="mt-3 flex gap-2">
          {navHref && (
            <ActionButton href={navHref} icon={Navigation} label="Navigate" accent />
          )}
          {phone && <ActionButton href={`tel:${phone}`} icon={Phone} label="Call" />}
          {phone && <ActionButton href={`sms:${phone}`} icon={MessageSquare} label="Text" />}
        </div>
      </div>
    </div>
  )
}

export function TodayAgenda() {
  const today = new Date()
  const iso = format(today, "yyyy-MM-dd")
  const { data, isLoading } = useSWR<Appt[]>(
    `/api/appointments?startDate=${iso}&endDate=${iso}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  const appts = Array.isArray(data) ? data : []

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" style={{ color: ACCENT }} />
          <h2 className="text-lg font-bold text-white">Today&apos;s Agenda</h2>
        </div>
        <span className="text-xs text-white/40">{format(today, "EEEE, MMM d")}</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      ) : appts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-white/20" />
          <p className="mt-2 text-sm font-medium text-white/70">No appointments today</p>
          <p className="text-xs text-white/40">Time to knock some doors 🚪</p>
        </div>
      ) : (
        <div>
          {appts.map((appt) => (
            <AgendaCard key={appt.id} appt={appt} />
          ))}
        </div>
      )}
    </section>
  )
}
