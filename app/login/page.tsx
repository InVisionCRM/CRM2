import { Metadata, Viewport } from 'next'
import LoginPageClient from '@/components/login-page-client'

export const metadata: Metadata = {
  title: 'Login - CRM',
  description: 'Login to your CRM account',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function LoginPage() {
  return <LoginPageClient />
}
