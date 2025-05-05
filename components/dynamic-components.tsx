"use client"

import dynamic from 'next/dynamic'

// Dynamic imports for components that use browser APIs
export const DynamicHero = dynamic(
  () => import('@/components/ui/hero').then((mod) => mod.Hero),
  { ssr: false }
)

export const DynamicAppointmentCalendar = dynamic(
  () => import('@/components/appointments/calendar').then((mod) => mod.Calendar),
  { ssr: false }
)

export const DynamicSignatureCanvas = dynamic(
  () => import('@/components/contracts/signature-canvas').then((mod) => mod.SignatureCanvas),
  { ssr: false }
)

export const DynamicGeneralContract = dynamic(
  () => import('@/components/contracts/general-contract').then((mod) => mod.GeneralContract),
  { ssr: false }
)

// GoogleMap is exported as default
export const DynamicGoogleMap = dynamic(
  () => import('@/components/map/google-map'),
  { ssr: false }
) 