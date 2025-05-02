# Roofing CRM API Documentation

This document provides comprehensive documentation for all API endpoints in the Roofing CRM application.

## Table of Contents

1. [Leads](#leads)
   - [Get All Leads](#get-all-leads)
   - [Get Lead by ID](#get-lead-by-id)
   - [Create Lead](#create-lead)
   - [Update Lead](#update-lead)
   - [Delete Lead](#delete-lead)
2. [Lead Notes](#lead-notes)
   - [Get Lead Notes](#get-lead-notes)
   - [Create Lead Note](#create-lead-note)
   - [Update Lead Note](#update-lead-note)
   - [Delete Lead Note](#delete-lead-note)
3. [Appointments](#appointments)
   - [Get Appointments](#get-appointments)
   - [Get Appointment by ID](#get-appointment-by-id)
   - [Create Appointment](#create-appointment)
   - [Update Appointment](#update-appointment)
   - [Delete Appointment](#delete-appointment)
4. [Files](#files)
   - [Get Files](#get-files)
   - [Upload File](#upload-file)
   - [Delete File](#delete-file)
5. [Property Details](#property-details)
   - [Get Property Details](#get-property-details)
   - [Create/Update Property Details](#createupdate-property-details)
6. [Insurance](#insurance)
   - [Get Insurance Info](#get-insurance-info)
   - [Create/Update Insurance Info](#createupdate-insurance-info)
7. [Authentication](#authentication)
   - [Login](#login)
   - [Register](#register)
   - [Logout](#logout)
   - [Get Current User](#get-current-user)
8. [Vision Markers](#vision-markers)
   - [Get All Vision Markers](#get-all-vision-markers)
   - [Create Vision Marker](#create-vision-marker)
   - [Get Vision Marker by ID](#get-vision-marker-by-id)
   - [Update Vision Marker](#update-vision-marker)
   - [Delete Vision Marker](#delete-vision-marker)
9. [Utility Functions](#utility-functions)
   - [lib/db-markers.ts](#libdb-markersts)

## Leads

### Get All Leads

**Route**: `GET /api/leads`

**Purpose**: Retrieves a list of all leads, with optional filtering by status.

**Consumed By**: `hooks/use-leads.ts`

**Query Parameters**:
\`\`\`typescript
{
  status?: string; // Optional filter by lead status
}
\`\`\`

**Response Payload**:
\`\`\`typescript
{
  leads: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    status: string;
    createdAt: string;
    appointmentDate?: string;
  }>;
}
\`\`\`

### Get Lead by ID

**Route**: `GET /api/leads/[id]`

**Purpose**: Retrieves detailed information about a specific lead.

**Consumed By**: `hooks/use-lead.ts`

**Path Parameters**:
\`\`\`typescript
{
  id: string; // Lead ID
}
\`\`\`

**Response Payload**:
\`\`\`typescript
{
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  notes: Array<{
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
  }>;
  appointments: Array<{
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    type: string;
    status: string;
    notes?: string;
  }>;
  propertyDetails?: {
    id: string;
    roofType: string;
    squareFootage: number;
    roofAge: number;
    lastInspection?: string;
  };
  insurance?: {
    id: string;
    provider: string;
    policyNumber: string;
    coverageAmount: number;
    deductible: number;
    adjusterName?: string;
    adjusterPhone?: string;
    adjusterEmail?: string;
    claimNumber?: string;
    claimStatus?: string;
    claimDate?: string;
  };
  files: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    category: string;
    size: number;
    uploadedAt: string;
  }>;
}
\`\`\`

### Create Lead

**Route**: `POST /api/leads`

**Purpose**: Creates a new lead in the system.

**Consumed By**: `hooks/use-create-lead.ts`

**Request Payload**:
\`\`\`typescript
{
  fullName: string;
  email: string;
  phone: string;
  address: string;
  status: string;
}
\`\`\`

**Response Payload**:
\`\`\`typescript
{
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
\`\`\`

### Update Lead

**Route**: `PUT /api/leads/[id]`

**Purpose**: Updates an existing lead's information.

**Consumed By**: `hooks/use-update-lead.ts`

**Path Parameters**:
\`\`\`typescript
{
  id: string; // Lead ID
}
\`\`\`

**Request Payload**:
\`\`\`typescript
{
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
}
\`\`\`

**Response Payload**:
\`\`\`typescript
{
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
\`\`\`

### Delete Lead

**Route**: `DELETE /api/leads/[id]`

**Purpose**: Deletes a lead from the system.

**Consumed By**: `hooks/use-delete-lead.ts`

**Path Parameters**:
\`\`\`typescript
{
  id: string; // Lead ID
}
\`\`\`

**Response Payload**:
\`\`\`typescript
{
  success: boolean;
  message: string;
}
\`\`\`

## Lead Notes

### Get Lead Notes

**Route**: `GET /api/leads/[id]/notes`

**Purpose**: Retrieves all notes associated with a specific lead.

**Consumed By**: `hooks/use-lead-notes.ts`

**Path Parameters**:
\`\`\`typescript
{
  id: string; // Lead ID
}
\`\`\`

**Response Payload**:
\`\`\`typescript
Array<{
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userFullName: string;
}>
\`\`\`

### Create Lead Note

**Route**: `POST /api/leads/[id]/notes`

**Purpose**: Adds a new note to a lead.

**Consumed By**: `hooks/use-lead-notes.ts`

**Path Parameters**:
\`\`\`typescript
{
  id: string; // Lead ID
}
\`\`\`

**Request Payload**:
\`\`\`typescript
{
  content: string;
}
\`\`\`

**Response Payload**:
\`\`\`typescript
{
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userFullName: string;
}
\`\`\`

### Update Lead Note

**Route**: `PUT /api/leads/[id]/notes/[noteId]`

**Purpose**: Updates an existing note for a lead.

**Consumed By**: `hooks/use-lead-notes.ts`

**Path Parameters**:
\`\`\`typescript
{
  id: string; // Lead ID
  noteId: string; // Note ID
}
\`\`\`

**Request Payload**:
\`\`\`typescript
{
  content: string;
}
\`\`\`

**Response Payload**:
\`\`\`typescript
{
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userFullName: string;
}
\`\`\`

### Delete Lead Note

**Route**: `DELETE /api/leads/[id]/notes/[noteId]`

**Purpose**: Deletes a note from a lead.

**Consumed By**: `hooks/use-lead-notes.ts`

**Path Parameters**:
\`\`\`typescript
{
  id: string; // Lead ID
  noteId: string; // Note ID
}
\`\`\`

**Response Payload**:
\`\`\`typescript
{
  success: boolean;
  message: string;
}
\`\`\`

## Appointments

### Get Appointments

**Route**: `GET /api/appointments`

**Purpose**: Retrieves a list of appointments, with optional filtering by date range or lead ID.

**Consumed By**: Not yet implemented

**Query Parameters**:
\`\`\`typescript
{
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  leadId?: string; // Filter by lead
}
\`\`\`

**Response Payload**:
\`\`\`typescript
Array<{
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  notes?: string;
  leadId: string;
  leadName: string;
}>
\`\`\`

### Get Appointment by ID

**Route**: `GET /api/appointments/[id]`

**Purpose**: Retrieves detailed information about a specific appointment.

**Consumed By**: Not yet implemented

**Path Parameters**:
\`\`\`typescript
{
  id: string; // Appointment ID
}
\`\`\`

**Response Payload**:
\`\`\`typescript
{
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  notes?: string;
  leadId: string;
  leadName: string;
  address: string;
}
\`\`\`

### Create Appointment

**Route**: `POST /api/appointments`

**Purpose**: Creates a new appointment.

**Consumed By**: Not yet implemented

**Request Payload**:
\`\`\`typescript
{
  title: string;
  date: string; // ISO date string
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  type: string;
  status: string;
  notes?: string;
  leadId: string;
}
\`\`\`

**Response Payload**:
\`\`\`typescript
{
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  notes?: string;
  leadId: string;
  createdAt: string;
  updatedAt: string;
}
\`\`\`

### Update Appointment

**Route**: `PUT /api/appointments/[id]`

**Purpose**: Updates an existing appointment.

**Consumed By**: Not yet implemented

**Path Parameters**:
\`\`\`typescript
{
  id: string; // Appointment ID
}
\`\`\`

**Request Payload**:
\`\`\`typescript
{
  title?: string;
  date?: string; // ISO date string
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  type?: string;
  status?: string;
  notes?: string;
}
\`\`\`

**Response Payload**:
\`\`\`typescript
{
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  notes?: string;
  leadId: string;
  createdAt: string;
  updatedAt: string;
}
\`\`\`

### Delete Appointment

**Route**: `DELETE /api/appointments/[id]`

**Purpose**: Deletes an appointment.

**Consumed By**: Not yet implemented

**Path Parameters**:
\`\`\`typescript
{
  id: string; // Appointment ID
}
\`\`\`

**Response Payload**:
\`\`\`typescript
{
  success: boolean;
  message: string;
}
\`\`\`

## Files

### Get Files

**Route**: `GET /api/files`

**Purpose**: Retrieves a list of files, with optional filtering by lead ID or category.

**Consumed By**: Not yet implemented

**Query Parameters**:
\`\`\`typescript
{
  leadId?: string; // Filter by lead
  category?: string; // Filter by category
}
\`\`\`

**Response Payload**:
\`\`\`typescript
Array<{
  id: string;
  name: string;
  url: string;
  type: string;
  category: string;
  size: number;
  leadId: string;
  uploadedAt: string;
}>
\`\`\`

### Upload File

**Route**: `POST /api/files`

**Purpose**: Uploads a new file and associates it with a lead.

**Consumed By**: Not yet implemented

**Request Payload**:
\`\`\`typescript
{
  file: File; // Multipart form data
  leadId: string;
  category: string;
}
\`\`\`

**Response Payload**:
\`\`\`typescript
{
  id: string;
  name: string;
  url: string;
  type: string;
  category: string;
  size: number;
  leadId: string;
  uploadedAt: string;
}
\`\`\`

### Delete File

**Route**: `DELETE /api/files/[id]`

**Purpose**: Deletes a file.

**Consumed By**: Not yet implemented

**Path Parameters**:
\`\`\`typescript
{
  id: string; // File ID
}
\`\`\`

**Response Payload**:
\`\`\`typescript
{
  success: boolean;
  message: string;
}
\`\`\`

## Property Details

### Get Property Details

**Route**: `GET /api/leads/[id]/property`

**Purpose**: Retrieves property details for a specific lead.

**Consumed By**: Not yet implemented

**Path Parameters**:
\`\`\`typescript
{
  id: string; // Lead ID
}
\`\`\`

**Response Payload**:
\`\`\`typescript
{
  id: string;
  roofType: string;
  squareFootage: number;
  roofAge: number;
  lastInspection?: string;
  createdAt: string;
  updatedAt: string;
}
\`\`\`

### Create/Update Property Details

**Route**: `PUT /api/leads/[id]/property`

**Purpose**: Creates or updates property details for a lead.

**Consumed By**: Not yet implemented

**Path Parameters**:
\`\`\`typescript
{
  id: string; // Lead ID
}
\`\`\`

**Request Payload**:
\`\`\`typescript
{
  roofType: string;
  squareFootage: number;
  roofAge: number;
  lastInspection?: string;
}
\`\`\`

**Response Payload**:
\`\`\`typescript
{
  id: string;
  roofType: string;
  squareFootage: number;
  roofAge: number;
  lastInspection?: string;
  createdAt: string;
  updatedAt: string;
}
\`\`\`

## Insurance

### Get Insurance Info

**Route**: `GET /api/leads/[id]/insurance`

**Purpose**: Retrieves insurance information for a specific lead.

**Consumed By**: Not yet implemented

**Path Parameters**:
\`\`\`typescript
{
  id: string; // Lead ID
}
\`\`\`

**Response Payload**:
\`\`\`typescript
{
  id: string;
  provider: string;
  policyNumber: string;
  coverageAmount: number;
  deductible: number;
  adjusterName?: string;
  adjusterPhone?: string;
  adjusterEmail?: string;
  claimNumber?: string;
  claimStatus?: string;
  claimDate?: string;
  createdAt: string;
  updatedAt: string;
}
\`\`\`

### Create/Update Insurance Info

**Route**: `PUT /api/leads/[id]/insurance`

**Purpose**: Creates or updates insurance information for a lead.

**Consumed By**: Not yet implemented

**Path Parameters**:
\`\`\`typescript
{
  id: string; // Lead ID
}
\`\`\`

**Request Payload**:
\`\`\`typescript
{
  provider: string;
  policyNumber: string;
  coverageAmount: number;
  deductible: number;
  adjusterName?: string;
  adjusterPhone?: string;
  adjusterEmail?: string;
  claimNumber?: string;
  claimStatus?: string;
  claimDate?: string;
}
\`\`\`

**Response Payload**:
\`\`\`typescript
{
  id: string;
  provider: string;
  policyNumber: string;
  coverageAmount: number;
  deductible: number;
  adjusterName?: string;
  adjusterPhone?: string;
  adjusterEmail?: string;
  claimNumber?: string;
  claimStatus?: string;
  claimDate?: string;
  createdAt: string;
  updatedAt: string;
}
\`\`\`

## Authentication

### Login

**Route**: `POST /api/auth/login`

**Purpose**: Authenticates a user and creates a session.

**Consumed By**: Not yet implemented

**Request Payload**:
\`\`\`typescript
{
  email: string;
  password: string;
}
\`\`\`

**Response Payload**:
\`\`\`typescript
{
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
  message: string;
}
\`\`\`

### Register

**Route**: `POST /api/auth/register`

**Purpose**: Creates a new user account.

**Consumed By**: Not yet implemented

**Request Payload**:
\`\`\`typescript
{
  fullName: string;
  email: string;
  password: string;
}
\`\`\`

**Response Payload**:
\`\`\`typescript
{
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
  message: string;
}
\`\`\`

### Logout

**Route**: `POST /api/auth/logout`

**Purpose**: Ends the user's session.

**Consumed By**: Not yet implemented

**Response Payload**:
\`\`\`typescript
{
  success: boolean;
  message: string;
}
\`\`\`

### Get Current User

**Route**: `GET /api/auth/me`

**Purpose**: Retrieves information about the currently authenticated user.

**Consumed By**: Not yet implemented

**Response Payload**:
\`\`\`typescript
{
  id: string;
  fullName: string;
  email: string;
  role: string;
}
\`\`\`

## Vision Markers

### Get All Vision Markers

**Route**: `GET /api/vision-markers`
**Purpose**: Retrieves all vision markers.

**Response:**
\`\`\`json
{
  "markers": [
    {
      "id": "marker-id",
      "lat": 35.123456,
      "lng": -80.987654,
      "address": "123 Main St, Charlotte, NC",
      "notes": "Customer interested in roof inspection",
      "status": "New",
      "contact_info": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "555-123-4567"
      },
      "follow_up": {
        "date": "2023-05-15",
        "time": "10:00 AM",
        "notes": "Call before visit"
      },
      "sales_person_id": "salesperson@example.com",
      "user_id": "94978ff6-f996-4371-bc31-82fa4993e2e4",
      "visits": [
        {
          "id": "visit-id",
          "date": "2023-05-10T14:30:00Z",
          "salesPersonId": "salesperson@example.com",
          "salesPersonName": "Sales Person",
          "salesPersonEmail": "salesperson@example.com",
          "status": "Inspected",
          "notes": "Roof has hail damage",
          "followUpDate": "2023-05-15T10:00:00Z"
        }
      ],
      "timestamp": "2023-05-10T14:30:00Z",
      "created_at": "2023-05-10T14:30:00Z",
      "updated_at": "2023-05-10T14:30:00Z"
    }
  ]
}
\`\`\`

### Create Vision Marker

**Route**: `POST /api/vision-markers`
**Purpose**: Creates a new vision marker.

**Request Body:**
\`\`\`json
{
  "lat": 35.123456,
  "lng": -80.987654,
  "address": "123 Main St, Charlotte, NC",
  "notes": "Customer interested in roof inspection",
  "status": "New",
  "contactInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "555-123-4567"
  },
  "followUpDate": "2023-05-15",
  "followUpTime": "10:00 AM",
  "followUpNotes": "Call before visit",
  "salesPersonId": "salesperson@example.com"
}
\`\`\`

**Response:**
\`\`\`json
{
  "id": "marker-id",
  "success": true,
  "marker": {
    "id": "marker-id",
    "lat": 35.123456,
    "lng": -80.987654,
    "address": "123 Main St, Charlotte, NC",
    "status": "New",
    "sales_person_id": "salesperson@example.com",
    "user_id": "94978ff6-f996-4371-bc31-82fa4993e2e4"
  }
}
\`\`\`

### Get Vision Marker by ID

**Route**: `GET /api/vision-markers/:id`
**Purpose**: Retrieves a specific vision marker by ID.

**Response:**
\`\`\`json
{
  "id": "marker-id",
  "lat": 35.123456,
  "lng": -80.987654,
  "address": "123 Main St, Charlotte, NC",
  "notes": "Customer interested in roof inspection",
  "status": "New",
  "contact_info": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "555-123-4567"
  },
  "follow_up": {
    "date": "2023-05-15",
    "time": "10:00 AM",
    "notes": "Call before visit"
  },
  "sales_person_id": "salesperson@example.com",
  "user_id": "94978ff6-f996-4371-bc31-82fa4993e2e4",
  "visits": [
    {
      "id": "visit-id",
      "date": "2023-05-10T14:30:00Z",
      "salesPersonId": "salesperson@example.com",
      "salesPersonName": "Sales Person",
      "salesPersonEmail": "salesperson@example.com",
      "status": "Inspected",
      "notes": "Roof has hail damage",
      "followUpDate": "2023-05-15T10:00:00Z"
    }
  ],
  "timestamp": "2023-05-10T14:30:00Z",
  "created_at": "2023-05-10T14:30:00Z",
  "updated_at": "2023-05-10T14:30:00Z"
}
\`\`\`

### Update Vision Marker

**Route**: `PUT /api/vision-markers/:id`
**Purpose**: Updates a specific vision marker.

**Request Body:**
\`\`\`json
{
  "lat": 35.123456,
  "lng": -80.987654,
  "address": "123 Main St, Charlotte, NC",
  "notes": "Updated notes",
  "status": "Inspected",
  "contactInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "555-123-4567"
  },
  "followUpDate": "2023-05-20",
  "followUpTime": "2:00 PM",
  "followUpNotes": "Updated follow-up notes",
  "salesPersonId": "salesperson@example.com"
}
\`\`\`

**Response:**
\`\`\`json
{
  "id": "marker-id",
  "lat": 35.123456,
  "lng": -80.987654,
  "address": "123 Main St, Charlotte, NC",
  "notes": "Updated notes",
  "status": "Inspected",
  "contact_info": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "555-123-4567"
  },
  "follow_up": {
    "date": "2023-05-20",
    "time": "2:00 PM",
    "notes": "Updated follow-up notes"
  },
  "sales_person_id": "salesperson@example.com",
  "user_id": "94978ff6-f996-4371-bc31-82fa4993e2e4",
  "visits": [
    {
      "id": "visit-id-2",
      "date": "2023-05-15T14:30:00Z",
      "salesPersonId": "salesperson@example.com",
      "salesPersonName": "Sales Person",
      "salesPersonEmail": "salesperson@example.com",
      "status": "Inspected",
      "notes": "Updated notes",
      "followUpDate": "2023-05-20T14:00:00Z"
    },
    {
      "id": "visit-id-1",
      "date": "2023-05-10T14:30:00Z",
      "salesPersonId": "salesperson@example.com",
      "salesPersonName": "Sales Person",
      "salesPersonEmail": "salesperson@example.com",
      "status": "New",
      "notes": "Roof has hail damage",
      "followUpDate": "2023-05-15T10:00:00Z"
    }
  ],
  "timestamp": "2023-05-10T14:30:00Z",
  "created_at": "2023-05-10T14:30:00Z",
  "updated_at": "2023-05-15T14:30:00Z"
}
\`\`\`

### Delete Vision Marker

**Route**: `DELETE /api/vision-markers/:id`
**Purpose**: Deletes a specific vision marker.

**Response:**
\`\`\`json
{
  "success": true,
  "id": "marker-id"
}
\`\`\`

## Utility Functions

### lib/db-markers.ts

This utility file provides functions for interacting with vision markers in the database:

- `getMarkers()`: Retrieves all vision markers
- `getMarkerById(id)`: Retrieves a specific marker by ID
- `getMarkersByAddress(address)`: Searches for markers by address
- `createMarker(markerData)`: Creates a new marker
- `updateMarker(id, markerData)`: Updates an existing marker
- `deleteMarker(id)`: Deletes a marker

These functions handle both the legacy `sales_person_id` field (string) and the new `user_id` field (UUID) that properly references the `users` table.
