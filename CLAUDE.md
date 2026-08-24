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

# DocuSeal (contract e-signing) - all six are required, lib/docuseal.ts throws if missing
DOCUSEAL_API_KEY="..."                      # sent as the X-Auth-Token header
DOCUSEAL_API_URL="https://api.docuseal.com" # REST API host. Self-hosted: http://host:3000/api
DOCUSEAL_APP_URL="https://docuseal.com"     # where signers open documents
DOCUSEAL_TEMPLATE_GENERAL_CONTRACT="..."    # numeric template id
DOCUSEAL_TEMPLATE_THIRD_PARTY_AUTH="..."
DOCUSEAL_TEMPLATE_SCOPE_OF_WORK="..."
```

There is no `DOCUSEAL_URL` or `DOCUSEAL_TEMPLATE_ID`. Both were removed in the
Cloud migration; `DOCUSEAL_TEMPLATE_ID` had been declared three times in
`.env.local`, so the last value silently won for every route.

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

## Working Practice: Verify, Never Assume

Every claim about this codebase must be backed by something you actually ran or
read. A plausible explanation is a hypothesis, not a finding. Before changing
code to fix something, prove the thing is broken; after changing it, prove the
fix works.

**What does not count as verification**
- A TypeScript interface or type annotation. Types are erased at runtime and are
  routinely out of date. `scope-of-work/route.ts` declared 61 snake_case fields
  while the form emitted camelCase; the route spread `...formData` straight
  through, so the interface described a shape nothing ever produced.
- A comment, a variable name, or a doc (including this file).
- "The API probably works like X." Probe the real endpoint with a throwaway
  object and read what comes back.
- A grep over a partial checkout. Confirm you are searching the whole tree.
- A subagent's report. Spot-check its highest-severity claims yourself - one
  claimed the DocuSeal webhook was unreachable behind middleware; reading
  `middleware.ts` showed the opposite.

**What counts**
- Running the code, or calling the live API and printing the response.
- Reading the actual file end to end at the relevant lines.
- Rendering the artifact and looking at it.
- A diff between what was sent and what came back.

**Destructive or hard-to-reverse changes get a throwaway first.** Renaming a
DocuSeal template document was tested on a clone before touching the live
template; the call turned out to 422, and the real template was never at risk.

**Report uncertainty explicitly.** If something could not be verified, say so
and say why, rather than presenting it as fact. Never claim a check passed that
was not run.

## DocuSeal Integration

All DocuSeal access goes through `lib/docuseal.ts` - `docusealFetch()`,
`templateId()`, `signingUrl()`, `signatureRequestMessage()`. Nothing else may
read a `DOCUSEAL_*` environment variable.

API paths differ by deployment: Cloud is `https://api.docuseal.com/submissions`,
self-hosted is `http://host:3000/api/submissions`. `DOCUSEAL_API_URL` carries the
prefix, so call sites pass `/submissions`. Signing links live on
`DOCUSEAL_APP_URL`, a different host on Cloud.

### The three-place field-name contract

DocuSeal matches prefill values to template fields by **exact string**. A
mismatch does not error - the field simply arrives blank on the client's
contract. Each field name therefore exists in three places that must agree:

1. the `name=` attribute in the form component (e.g. `ScopeOfWorkForm.tsx`)
2. the key in the `values` object the route sends
3. the field name in the DocuSeal template itself

Scope of Work never names fields explicitly - the route spreads `...formData`,
so place 1 and place 2 are the same strings. `lib/scope-of-work-form.ts` is the
single payload builder for both submitting screens; it throws on a duplicate
`name=` rather than silently producing an array.

Template sources are version-controlled in `docuseal-templates/`. A template can
be recreated from source with one API call, which is what made the August 2026
outage recoverable.

### Verified DocuSeal API behaviour

Established by probing the live API, not inferred:

| Sent | Result |
|---|---|
| signature field <- `data:image/png;base64,...` | accepted, stored as a hosted signature image |
| date field <- `"August 24, 2026"` | normalised to `2026-08-24` |
| number field <- `""` | accepted, stored as null |
| text field <- an array | stored as the literal string `["one", "two"]` - always a bug |
| checkbox <- boolean / `"\u2713"` | both accepted; booleans are what we send |
| `POST /templates/pdf` `page` | **1-indexed**, while `GET` returns 0-indexed |
| `PUT /templates/{id}` | updates name/folder/roles only - not fields |
| `PUT /templates/{id}/documents` | 422; a document cannot be renamed in place |
| unknown key in `values` | silently ignored, no error |

### Known issues, not yet fixed

- `app/api/webhooks/docuseal/route.ts` verifies no signature or shared secret.
  It accepts an arbitrary `combined_document_url`, fetches it server-side and
  uploads the result to Google Drive - an unauthenticated SSRF and Drive write.
  This is internet-facing now that DocuSeal is Cloud-hosted.
- `middleware.ts` matcher is inert. The source reads `.*\..*` inside a
  double-quoted string, and JS drops the unknown escape, leaving `.*..*` - which
  matches any path, so the negative lookahead rejects everything. Only
  `/admin/:path*` and `/api/admin/:path*` are actually protected. Verified with
  `new RegExp()` against real paths.
- `validateApiCredentials` is `async`, so `!!token && validateApiCredentials(req)`
  ANDs against an always-truthy Promise. That branch is dead.
- `components/leads/ContractsSection.tsx` is unreferenced and sends
  `templateId: 3|4|5` to a route that reads `contractType` - if ever wired up,
  all three buttons would mail the general contract. Delete it.
- There is no warranty template in `TemplateKind`; a warranty flow existed only
  in that dead component.
