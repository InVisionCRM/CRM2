# Lead Deletion Feature

## Overview

This feature allows users to delete leads with proper authorization controls. Admins can delete any lead, while regular users can only delete leads assigned to them.

## Authorization Rules

### Admin Users
- **Can delete**: Any lead in the system
- **Role**: `ADMIN`

### Regular Users
- **Can delete**: Only leads assigned to them (`assignedToId` matches their user ID)
- **Role**: `USER` or `MANAGER`

## Implementation Details

### Backend Changes

#### 1. Database Layer (`lib/db/leads.ts`)
- Updated `deleteLead` function to include authorization logic
- Added user role and ownership checks
- Returns structured response with success/error information

```typescript
export async function deleteLead(id: string, userId: string): Promise<{ success: boolean; error?: string }>
```

#### 2. Server Actions (`app/actions/lead-actions.ts`)
- Updated `deleteLeadAction` to include session validation
- Added proper error handling and user authentication

#### 3. API Route (`app/api/leads/[id]/route.ts`)
- Implemented DELETE endpoint with authorization
- Returns appropriate HTTP status codes:
  - `401` - Unauthorized (not logged in)
  - `403` - Forbidden (not authorized to delete this lead)
  - `404` - Lead not found
  - `500` - Internal server error

### Frontend Changes

#### 1. Lead Actions Component (`components/leads/lead-actions.tsx`)
- Added authorization check with `canDeleteLead()` function
- Delete button only shows for authorized users
- Uses session data to determine user role and ownership

#### 2. Lead Detail Header (`components/leads/lead-detail-header.tsx`)
- Added delete option to dropdown menu
- Includes confirmation dialog
- Only shows for authorized users

## Usage

### For Admins
1. Navigate to any lead detail page
2. Click the "More" dropdown menu (three dots)
3. Select "Delete Lead"
4. Confirm deletion in the dialog

### For Regular Users
1. Navigate to a lead assigned to you
2. Click the "More" dropdown menu (three dots)
3. Select "Delete Lead" (only visible for your leads)
4. Confirm deletion in the dialog

## Error Handling

The system provides clear error messages for different scenarios:

- **"Unauthorized"** - User is not logged in
- **"Unauthorized to delete this lead"** - User doesn't have permission
- **"Lead not found"** - Lead doesn't exist
- **"User not found"** - User session is invalid

## Security Considerations

1. **Server-side validation**: All authorization checks happen on the server
2. **Session validation**: Users must be authenticated
3. **Role-based access**: Different permissions for different user roles
4. **Ownership validation**: Users can only delete their assigned leads
5. **Cascade deletion**: Related activities and files are also deleted

## Database Impact

When a lead is deleted, the following related data is also removed:
- All activities associated with the lead
- All files associated with the lead
- The lead record itself

This ensures data consistency and prevents orphaned records.

## Testing

To test the feature:

1. **Admin testing**: Log in as an admin and try to delete any lead
2. **User testing**: Log in as a regular user and try to delete:
   - A lead assigned to you (should work)
   - A lead assigned to someone else (should fail)
3. **Unauthorized testing**: Try to delete without being logged in (should fail) 