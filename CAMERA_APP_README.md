# Roofing Camera App - Separate Mobile Application

A dedicated mobile camera application for roofing contractors to capture and upload photos to the main CRM system without accessing sensitive customer data.

## 🎯 Purpose

This separate app allows roofing subcontractors to:
- Take photos of roof damage/construction progress
- Upload photos directly to specific leads
- Access only photo-related functionality
- **Never see customer personal information, pricing, or financial data**

## 🏗️ Architecture Overview

### Technology Stack
- **Frontend**: Next.js 15.3.3 with React 18
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with custom API key system
- **File Storage**: Vercel Blob (primary) + Google Drive (backup)
- **Mobile**: PWA (Progressive Web App) for native-like experience
- **Styling**: Tailwind CSS with shadcn/ui components

### Database Schema (Relevant Tables)

```sql
-- Lead identification (minimal data only - same as CRM)
model Lead {
  id                       String        @id
  firstName                String?       @db.VarChar(255)
  lastName                 String?       @db.VarChar(255)
  address                  String?       @db.VarChar(510)
  claimNumber              String?       -- For contractor identification
  status                   LeadStatus    @default(follow_ups)
  latitude                 Decimal?      @db.Decimal(10, 7)
  longitude                Decimal?      @db.Decimal(10, 7)
  createdAt                DateTime      @default(now()) @db.Timestamptz(6)
  updatedAt                DateTime      @updatedAt @db.Timestamptz(6)
  photos                   LeadPhoto[]
}

-- Photo storage (identical to CRM)
model LeadPhoto {
  id           String   @id @default(uuid())
  name         String
  description  String?
  url          String
  thumbnailUrl String?
  mimeType     String?
  size         Int?
  leadId       String
  uploadedById String?  @db.Uuid
  createdAt    DateTime @default(now()) @db.Timestamptz(6)
  updatedAt    DateTime @updatedAt @db.Timestamptz(6)
  driveFileId  String?
  lead         Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  User         User?    @relation(fields: [uploadedById], references: [id])
}

-- File storage (identical to CRM - dual storage)
model File {
  id              String   @id @default(cuid())
  url             String   -- Primary URL (Vercel Blob)
  name            String
  size            Int
  type            String
  category        String?
  leadId          String
  blobUrl         String?  -- Vercel Blob URL
  driveFileId     String?  -- Google Drive file ID
  storageLocation String   @default("drive") -- "drive", "blob", or "both"
  createdAt       DateTime @default(now()) @db.Timestamptz(6)
  updatedAt       DateTime @updatedAt @db.Timestamptz(6)
  lead            Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
}

-- Simple photo job assignments
model PhotoAssignment {
  id              String   @id @default(cuid())
  leadId          String
  contractorPhone String   NOT NULL
  assignedAt      DateTime @default(now()) @db.Timestamptz(6)
  assignedBy      String   NOT NULL -- CRM user who assigned
  notes           String?  -- Optional instructions
  lead            Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  
  @@index([contractorPhone])
  @@index([leadId])
}
```

## 📱 Core Features

### 1. Simple Job Assignment
- **CRM Integration**: "Give Photo Access" button on lead pages
- **Instant Assignment**: Jobs appear immediately in contractor's app
- **No Complex Setup**: Contractors just see their assigned jobs

### 2. Identical Photo Interface
- **Same UI as CRM**: Exact same photo components and styling
- **Native Camera Access**: Use device camera with high-quality settings
- **Photo Categories**: Before, During, After, Damage, Materials, etc.
- **Photo Annotation**: Draw on photos, add text overlays (identical to CRM)
- **Batch Upload**: Take multiple photos and upload together

### 3. Photo Management (Identical to CRM)
- **Automatic Compression**: Optimize photos for storage and upload
- **Thumbnail Generation**: Create thumbnails for quick preview
- **Dual Storage**: Upload to both Vercel Blob and Google Drive
- **Progress Tracking**: Show upload progress with retry capability

### 4. Security & Access Control
- **Job-Specific Access**: Contractors only see assigned leads
- **No Data Exposure**: Zero access to customer details, pricing, or financial data
- **Audit Trail**: Log all photo uploads with contractor identification
- **Simple Authentication**: Phone-based job assignment system

## 🔧 Files to Port from Main CRM

### Core Components
```
components/
├── photos/
│   ├── take-photo-modal.tsx          # Main camera interface
│   ├── take-photo-drawer.tsx         # Mobile camera drawer
│   ├── photo-canvas.tsx              # Photo annotation/drawing
│   └── photo-crop-component.tsx      # Photo cropping functionality
├── ui/
│   ├── button.tsx                    # UI components
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── progress.tsx
│   └── toast.tsx
└── file-upload.tsx                   # File upload handling
```

### API Routes (Minimal Set)
```
app/api/
├── photo-assignments/
│   ├── route.ts                      # Assign/get photo jobs
│   └── [contractorPhone]/route.ts    # Get jobs for contractor
├── photos/
│   ├── upload/route.ts               # Photo upload endpoint (identical to CRM)
│   ├── list/route.ts                 # List photos for a lead (identical to CRM)
│   └── delete/route.ts               # Delete photo (identical to CRM)
└── files/
    └── upload-dual/route.ts          # Dual storage upload (identical to CRM)
```

### Database & Services
```
lib/
├── db/
│   ├── prisma.ts                     # Database connection (identical to CRM)
│   └── photos.ts                     # Photo database operations (identical to CRM)
├── services/
│   └── dualFileStorage.ts            # Dual storage service (identical to CRM)
└── utils.ts                          # Utility functions (identical to CRM)
```

### Types & Schemas
```
types/
├── photo.ts                          # Photo-related types (identical to CRM)
├── lead.ts                           # Lead types (identical to CRM)
└── api.ts                            # API response types
```

## 🚀 Implementation Plan

### Phase 1: Core Setup (Week 1)
1. **Project Initialization**
   ```bash
   npx create-next-app@latest roofing-camera-app --typescript --tailwind --app
   cd roofing-camera-app
   npm install @prisma/client prisma @vercel/blob
   ```

2. **Database Setup**
   - Copy Prisma schema (add PhotoAssignment table)
   - Set up PostgreSQL database
   - Run migrations

3. **Component Copy**
   - Copy photo components from main CRM
   - Copy photo actions and services
   - Set up identical UI styling

### Phase 2: Job Assignment System (Week 2)
1. **CRM Integration**
   - Add "Give Photo Access" button to lead pages
   - Create photo assignment API endpoints
   - Set up contractor phone-based assignments

2. **Camera App Interface**
   - Create main job list page
   - Link to existing photo components
   - Implement identical photo interface

### Phase 3: API Integration (Week 3)
1. **Photo Endpoints**
   - Copy existing photo upload endpoints
   - Copy photo management endpoints
   - Ensure identical functionality

2. **Job Assignment Endpoints**
   - Photo assignment creation
   - Job retrieval by contractor phone
   - Assignment management

### Phase 4: Mobile Optimization (Week 4)
1. **PWA Setup**
   - Configure service worker
   - Add offline support
   - Implement app manifest
   - Add install prompts

2. **Mobile UX**
   - Touch-optimized interface
   - Gesture support
   - Mobile-specific camera features
   - Responsive design

## 🔐 Security Implementation

### Simple Job Assignment Flow
```typescript
// CRM side - assign photo job
interface PhotoAssignmentRequest {
  leadId: string;
  contractorPhone: string;
  notes?: string;
}

// Camera app side - get assigned jobs
interface PhotoJob {
  id: string;
  leadId: string;
  leadAddress: string;
  leadClaimNumber: string;
  assignedAt: string;
  notes?: string;
}
```

### Phone-Based Authentication
```typescript
// middleware.ts - simple phone validation
export async function middleware(request: NextRequest) {
  const contractorPhone = request.headers.get('x-contractor-phone');
  
  if (!contractorPhone) {
    return NextResponse.json({ error: 'Phone number required' }, { status: 401 });
  }
  
  // Validate phone format and check for active assignments
  const hasActiveJobs = await checkActiveAssignments(contractorPhone);
  if (!hasActiveJobs) {
    return NextResponse.json({ error: 'No active photo jobs' }, { status: 401 });
  }
}
```

### Data Access Restrictions
```typescript
// Only allow access to assigned leads
const allowedLeadFields = {
  id: true,
  address: true,
  claimNumber: true,
  status: true,
  latitude: true,
  longitude: true
};

// Photo upload restrictions (identical to CRM)
const photoUploadValidation = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxPhotosPerUpload: 20
};
```

## 📊 Database Schema Changes

### New Tables for Camera App
```sql
-- Simple photo job assignments
CREATE TABLE "PhotoAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT (cuid()),
    "leadId" TEXT NOT NULL,
    "contractorPhone" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,
    "notes" TEXT,
    
    FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE
);

-- Photo upload logs (optional audit trail)
CREATE TABLE "PhotoUploadLog" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT (cuid()),
    "leadId" TEXT NOT NULL,
    "contractorPhone" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT
);
```

## 🔄 API Endpoints

### Job Assignment (CRM Integration)
```
POST /api/photo-assignments
- Body: { leadId: string, contractorPhone: string, notes?: string }
- Response: { success: boolean, assignmentId: string }

GET /api/photo-assignments?contractorPhone=555-1234
- Response: { assignments: PhotoAssignment[] }
```

### Photo Management (Identical to CRM)
```
POST /api/photos/upload
- Body: FormData with files, leadId, category, description
- Response: { success: boolean, photos?: Photo[] }

GET /api/photos/list?leadId=lead123
- Response: { success: boolean, photos?: Photo[] }

DELETE /api/photos/delete?photoId=photo123
- Response: { success: boolean }
```

## 📱 Mobile App Configuration

### PWA Manifest
```json
{
  "name": "Roofing Camera App",
  "short_name": "RoofCam",
  "description": "Camera app for roofing contractors",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#59FF00",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Next.js Configuration
```javascript
// next.config.js
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['lh3.googleusercontent.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
    ],
  },
  // PWA configuration
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },
};
```

## 🚀 Deployment Strategy

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://..."
DATABASE_URL_UNPOOLED="postgresql://..."

# Authentication
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="https://camera.yourdomain.com"

# File Storage
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"

# Google Drive (Service Account)
GOOGLE_SERVICE_ACCOUNT_EMAIL="..."
GOOGLE_PRIVATE_KEY="..."
GOOGLE_DRIVE_FOLDER_ID="..."

# Camera App Specific
CAMERA_APP_SECRET="your-camera-app-secret"
```

### Vercel Deployment
```bash
# Deploy to Vercel
vercel --prod

# Environment setup
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add BLOB_READ_WRITE_TOKEN
# ... add all environment variables
```

## 📋 Maintenance & Updates

### Monitoring
- **Photo Upload Success Rate**: Track upload failures and retry logic
- **Authentication Attempts**: Monitor for suspicious access patterns
- **Storage Usage**: Monitor Vercel Blob and Google Drive usage
- **Performance Metrics**: Track upload times and app responsiveness

### Regular Maintenance Tasks
1. **Weekly**: Review camera access logs for anomalies
2. **Monthly**: Clean up old photo thumbnails and temporary files
3. **Quarterly**: Update camera user access codes
4. **As Needed**: Update photo categories based on contractor feedback

### Backup Strategy
- **Database**: Automated daily backups via Vercel/Neon
- **Photos**: Dual storage (Vercel Blob + Google Drive)
- **Access Codes**: Secure backup of camera user credentials

## 🔧 Development Commands

```bash
# Setup
npm install
npx prisma generate
npx prisma db push

# Development
npm run dev

# Build
npm run build
npm start

# Database
npx prisma studio
npx prisma migrate dev

# Testing
npm run test
npm run test:e2e
```

## 📞 Support & Documentation

### For Contractors
- **Simple Access**: Just need 6-digit access code
- **Offline Support**: Photos saved locally when no internet
- **Photo Categories**: Clear categories for different photo types
- **Upload Progress**: Visual feedback during uploads

### For CRM Admins
- **User Management**: Easy camera user creation/deactivation
- **Access Logs**: Complete audit trail of photo uploads
- **Lead Assignment**: Control which contractors can access which leads
- **Storage Monitoring**: Track photo storage usage and costs

This architecture ensures complete separation of concerns while maintaining the security and functionality needed for professional roofing operations.
