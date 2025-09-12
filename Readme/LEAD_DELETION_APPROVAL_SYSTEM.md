# Lead Deletion Approval System

## Overview

The Lead Deletion Approval System adds an extra layer of security and oversight to lead deletions. Instead of immediately deleting leads, users now create deletion requests that must be approved by administrators before the lead is actually deleted.

## How It Works

### For Regular Users

1. **Request Deletion**: When a user tries to delete a lead, they now see a dialog asking for a reason
2. **Submit Request**: The system creates a deletion request instead of immediately deleting the lead
3. **Wait for Approval**: The lead remains active until an admin approves the deletion
4. **Notification**: Users receive feedback that their request was submitted successfully

### For Administrators

1. **Review Requests**: Admins can view all pending deletion requests at `/admin/deletion-requests`
2. **Approve/Reject**: Admins can approve or reject each request with comments
3. **Automatic Deletion**: When approved, the lead is automatically deleted and all admins are notified
4. **Audit Trail**: All actions are logged with timestamps and user information

## Features

### 🔒 **Security & Oversight**
- All deletions require admin approval
- Complete audit trail of who requested, approved, or rejected deletions
- Reason tracking for all deletion requests
- Prevention of accidental deletions

### 📧 **Notification System**
- All admins receive email notifications when leads are approved for deletion
- Detailed information about the deleted lead and who approved it
- Comprehensive audit trail in email notifications

### 🎯 **User Experience**
- Intuitive dialog for requesting deletions
- Clear feedback on request status
- Admin-only access to approval interface
- Responsive design for all devices

### 📊 **Admin Dashboard**
- Real-time view of all pending deletion requests
- Quick approve/reject actions
- Detailed lead information for each request
- Request history and audit trail

## Database Schema

### DeletionRequest Table

```sql
model DeletionRequest {
  id                String    @id @default(uuid()) @db.Uuid
  leadId            String
  leadName          String
  leadEmail         String
  leadAddress       String
  leadStatus        String
  requestedById     String    @db.Uuid
  requestedByName   String
  requestedByEmail  String
  reason            String?
  status            String    @default("pending") // pending, approved, rejected
  createdAt         DateTime  @default(now()) @db.Timestamptz(6)
  approvedById      String?   @db.Uuid
  approvedByName    String?
  approvedByEmail   String?
  approvedAt        DateTime? @db.Timestamptz(6)
  rejectionReason   String?
  requestedBy       User      @relation("DeletionRequestedBy", fields: [requestedById], references: [id])
  approvedBy        User?     @relation("DeletionApprovedBy", fields: [approvedById], references: [id])

  @@index([leadId])
  @@index([status])
  @@index([requestedById])
  @@index([approvedById])
  @@index([createdAt])
}
```

## API Endpoints

### Create Deletion Request
```
POST /api/deletion-requests
Body: { leadId: string, reason?: string }
```

### Get Pending Requests (Admin Only)
```
GET /api/deletion-requests
```

### Approve Deletion Request (Admin Only)
```
POST /api/deletion-requests/[id]/approve
```

### Reject Deletion Request (Admin Only)
```
POST /api/deletion-requests/[id]/reject
Body: { rejectionReason: string }
```

## UI Components

### DeleteLeadDialog
- Modal dialog for requesting lead deletion
- Reason input field (required)
- Clear instructions and warnings
- Success/error feedback

### DeletionRequestsPanel
- Admin interface for managing deletion requests
- List of all pending requests
- Approve/reject buttons with confirmation
- Detailed lead information display

## Workflow

### 1. User Requests Deletion
```
User clicks "Delete Lead" → DeleteLeadDialog opens → User enters reason → Request submitted
```

### 2. Admin Reviews Request
```
Admin visits /admin/deletion-requests → Views pending requests → Reviews lead details → Approves or rejects
```

### 3. Lead Deletion (if approved)
```
Admin approves → Lead is deleted → All admins notified via email → Request marked as approved
```

### 4. Request Rejection (if rejected)
```
Admin rejects with reason → Request marked as rejected → Lead remains active → User can request again
```

## Configuration

### Environment Variables
No additional environment variables required. Uses existing Gmail API configuration for notifications.

### Permissions
- **Regular Users**: Can create deletion requests
- **Admin Users**: Can approve/reject deletion requests and view the admin interface

## Testing

### Test Deletion Request Creation
1. Navigate to any lead detail page
2. Click "Delete Lead"
3. Enter a reason for deletion
4. Submit the request
5. Verify the lead is still active

### Test Admin Approval
1. Log in as an admin user
2. Navigate to `/admin/deletion-requests`
3. View pending requests
4. Approve or reject a request
5. Verify the lead is deleted (if approved) or remains active (if rejected)

### Test Email Notifications
1. Approve a deletion request as admin
2. Check that all admin users receive email notifications
3. Verify email contains correct lead and approval information

## Security Considerations

### Access Control
- Only authenticated users can create deletion requests
- Only admin users can approve/reject requests
- All actions are logged with user information

### Data Protection
- Lead data is preserved until approved for deletion
- Complete audit trail maintained
- Rejection reasons are stored for transparency

### Error Handling
- Failed notifications don't prevent lead deletion
- Invalid requests are rejected with clear error messages
- Database transactions ensure data consistency

## Benefits

### For Organizations
- **Prevents Accidental Deletions**: All deletions require approval
- **Audit Trail**: Complete history of who requested and approved deletions
- **Compliance**: Maintains records for regulatory requirements
- **Oversight**: Administrators have full control over lead deletions

### For Users
- **Safety Net**: Prevents accidental data loss
- **Transparency**: Clear feedback on request status
- **Flexibility**: Can provide detailed reasons for deletion requests

### For Administrators
- **Control**: Full oversight of all deletion activities
- **Visibility**: Real-time view of pending requests
- **Efficiency**: Quick approve/reject actions with detailed information

## Future Enhancements

### Potential Improvements
1. **Bulk Operations**: Approve/reject multiple requests at once
2. **Auto-Approval Rules**: Automatic approval for certain conditions
3. **Escalation**: Automatic escalation for high-value leads
4. **Integration**: Connect with external approval workflows
5. **Analytics**: Deletion request statistics and trends

### Advanced Features
1. **Time-based Expiration**: Auto-reject requests after a certain time
2. **Priority Levels**: Different approval workflows for different lead types
3. **Conditional Approvals**: Require multiple admin approvals for certain leads
4. **Notification Preferences**: Customizable notification settings per admin

## Troubleshooting

### Common Issues

#### "No admin users found to notify"
- **Cause**: No users with ADMIN role in database
- **Solution**: Ensure at least one user has ADMIN role

#### "Failed to create deletion request"
- **Cause**: Database connection or permission issues
- **Solution**: Check database connectivity and user permissions

#### "Deletion request not found"
- **Cause**: Request was already processed or doesn't exist
- **Solution**: Refresh the admin interface and check request status

#### "Unauthorized to approve deletions"
- **Cause**: User doesn't have ADMIN role
- **Solution**: Ensure user has proper admin permissions

### Debug Steps
1. Check user roles in database
2. Verify API endpoint accessibility
3. Review server logs for error details
4. Test with different user accounts
5. Verify database schema is up to date

## Migration Notes

### From Direct Deletion to Approval System
- Existing deletion functionality has been replaced
- All deletion attempts now create requests instead
- No data migration required
- Backward compatibility maintained for API responses

### Database Changes
- New `DeletionRequest` table added
- User model updated with new relations
- Indexes added for performance
- No breaking changes to existing tables

## Support

For technical support or questions about the Lead Deletion Approval System:

1. Check this documentation first
2. Review server logs for error details
3. Test with different user roles
4. Verify database schema and permissions
5. Contact system administrator if issues persist

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Compatibility**: Next.js 14+, Prisma 6+, PostgreSQL 