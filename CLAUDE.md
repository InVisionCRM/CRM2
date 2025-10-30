# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development server
npm run dev

# Build the application
npm run build
npm run build:with-migrate  # Build with database migration

# Testing
npm run test                # Run Jest tests
npm run typecheck          # TypeScript type checking
npm run lint               # ESLint linting

# Database operations
npm run prisma:generate     # Generate Prisma client
npm run prisma:migrate      # Deploy Prisma migrations
npm run prisma:migrate:safe # Safe migration with confirmation

# PWA setup
npm run pwa:setup          # Generate PWA icons and screenshots
npm run pwa:icons          # Generate PWA icons only
npm run pwa:screenshots    # Generate PWA screenshots only

# Analysis and debugging
npm run analyze            # Bundle analyzer
npm run lighthouse         # Run Lighthouse performance audit

# Integrations
npm run create-chat-spaces      # Create Google Chat spaces for existing leads
npm run create-slack-channels   # Create Slack channels for existing leads
npm run populate-slack-channels # Add welcome messages to existing Slack channels
npm run rename-slack-channels   # Rename Slack channels with status prefixes (auto-sort)
```

## Architecture Overview

This is a **Next.js 15 App Router** application built as a **mobile-first Progressive Web App (PWA)** for roofing contractors. The architecture follows these key patterns:

### Core Technologies
- **Frontend**: React 18 + Next.js 15 (App Router) + TypeScript
- **Database**: PostgreSQL with Prisma ORM (hosted on Neon)
- **Authentication**: NextAuth.js with Google OAuth 2.0
- **File Storage**: Dual storage system (Google Drive + Vercel Blob)
- **Styling**: Tailwind CSS + Radix UI components
- **State Management**: SWR for data fetching and caching
- **PWA**: Next PWA with service worker and offline support

### Application Structure

#### Database Schema
The Prisma schema (`prisma/schema.prisma`) defines the core entities:
- **User**: Authentication and role-based access (ADMIN, MANAGER, USER)
- **Lead**: Central entity with comprehensive fields including insurance, adjuster, and location data
- **Appointment**: Scheduling with weather integration
- **Activity**: Audit trail for all lead interactions  
- **File**: Dual storage support (Google Drive + Vercel Blob)
- **Contract**: DocuSeal integration for digital signatures
- **VisionMarker/Visit**: Door-to-door sales tracking
- **GoogleCalendarEvent**: Calendar integration

#### Authentication Flow
NextAuth.js handles Google OAuth with these key features:
- JWT session strategy with access/refresh tokens
- Account linking for existing users
- Role-based permissions (Admin, Manager, User)
- Google API scopes for Drive, Calendar, Gmail, and Chat

#### API Routes Structure
- `/api/leads/[id]/` - Lead management (CRUD, files, activities, insurance)
- `/api/appointments/` - Calendar and scheduling
- `/api/files/` - Dual storage file operations
- `/api/auth/` - Authentication endpoints
- `/api/stats/` - Dashboard analytics
- `/api/chat/` - Google Chat integration
- `/api/docuseal/` - Contract management

### Key Components and Services

#### File Management (`lib/services/dualFileStorage.ts`)
Implements dual storage strategy:
- Primary: Vercel Blob for fast CDN access
- Secondary: Google Drive for collaboration and permanence
- Automatic fallback and sync capabilities

#### Google Drive Integration (`lib/hooks/useGoogleDrive.ts`)
- SWR-powered hook for Drive operations
- Folder navigation and file management
- Automatic token refresh handling

#### Lead Management (`components/leads/`)
- Tabbed interface (Overview, Insurance, Adjuster, Files, Activities, Jobs)
- Status-based neon color system
- Responsive mobile-first design

#### PWA Features
- Offline support with service worker
- Installable on mobile and desktop
- Background sync for critical operations
- Push notifications (future enhancement)

### Development Guidelines

#### Database Operations
Always use Prisma for database operations. The client is available at `@/lib/db/prisma`. Common patterns:
```typescript
import { prisma } from '@/lib/db/prisma'

// Include related data efficiently
const lead = await prisma.lead.findUnique({
  where: { id },
  include: { activities: true, files: true }
})
```

#### Authentication in API Routes
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const session = await getServerSession(authOptions)
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

#### File Upload Patterns
Use the dual storage service for new file uploads:
```typescript
import { DualFileStorageService } from '@/lib/services/dualFileStorage'

const dualStorage = new DualFileStorageService(session.accessToken)
const result = await dualStorage.uploadFile(file, { leadId, category })
```

#### SWR Data Fetching
Follow the established SWR patterns for client-side data fetching:
```typescript
import useSWR from 'swr'

const { data, error, mutate } = useSWR(`/api/leads/${id}`, fetcher)
```

### Important File Locations

- **Database Schema**: `prisma/schema.prisma`
- **Authentication**: `app/api/auth/[...nextauth]/route.ts`
- **Prisma Client**: `lib/prisma.ts` (exports from `lib/db/prisma`)
- **Google OAuth Scopes**: `lib/constants.ts`
- **Dual Storage Service**: `lib/services/dualFileStorage.ts`
- **PWA Configuration**: `next.config.js` and `public/manifest.json`
- **API Route Types**: `types/` directory

### Environment Variables Required

```env
# Database
DATABASE_URL="postgresql://..."
DATABASE_URL_UNPOOLED="postgresql://..."

# Authentication
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="..."

# Google OAuth & APIs
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# File Storage
BLOB_READ_WRITE_TOKEN="..." # Vercel Blob

# External Services
WEATHER_API_KEY="..."      # OpenWeatherMap
DOCUSEAL_API_TOKEN="..."   # Contract signing
```

### Testing

The project uses Jest for testing. Test files follow the `*.test.ts` pattern. Run tests with:
```bash
npm run test
```

### Mobile-First Considerations

This CRM prioritizes mobile experience:
- Touch-friendly UI components
- Responsive breakpoints (mobile → tablet → desktop)
- PWA capabilities for app-like experience
- Offline functionality for field use
- Optimized images and lazy loading

### Google Services Integration

The app integrates deeply with Google Workspace:
- **Drive**: File storage and collaboration
- **Calendar**: Appointment scheduling
- **Gmail**: Email communication
- **Chat**: Team collaboration spaces per lead

All Google integrations use the access token from the NextAuth session and handle token refresh automatically.