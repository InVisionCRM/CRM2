# Lead Deletion Notifications

## Overview

This feature automatically sends email notifications to all admin users when a lead is deleted from the CRM system. This provides oversight and accountability for lead deletions.

## How It Works

### 1. Notification Trigger
- Notifications are triggered whenever a lead is successfully deleted
- Works with both the API route (`DELETE /api/leads/[id]`) and server actions (`deleteLeadAction`)
- Only sends notifications if the deletion was successful and the user has a valid Gmail access token

### 2. Admin User Detection
- Automatically fetches all users with `ADMIN` role from the database
- Sends notifications to all admin users regardless of who performed the deletion
- If no admin users exist, the notification is skipped (logged but doesn't fail)

### 3. Email Content
The notification email includes:
- **Lead Details**: Name, email, address, status, creation date
- **Deletion Details**: Who deleted it, when it was deleted
- **System Information**: Lead ID and user ID for tracking
- **Action Required**: Reminder for admins to review the deletion

### 4. Error Handling
- Notification failures don't prevent the lead deletion
- All errors are logged but don't break the deletion process
- Gmail service errors are handled gracefully

## Implementation Details

### Files Modified

1. **`lib/services/admin-notifications.ts`** (New)
   - `getAdminUsers()`: Fetches all admin users
   - `sendLeadDeletionNotification()`: Sends notifications to all admins
   - `createLeadDeletionEmailBody()`: Generates email content

2. **`lib/db/leads.ts`**
   - Modified `deleteLead()` to return deleted lead data for notifications
   - Enhanced to include lead details needed for notification

3. **`app/actions/lead-actions.ts`**
   - Updated `deleteLeadAction()` to send notifications after successful deletion

4. **`app/api/leads/[id]/route.ts`**
   - Updated `DELETE` endpoint to send notifications after successful deletion

### Email Template

The notification email follows this format:

```
Subject: 🚨 Lead Deletion Alert: [Lead Name]

Hi Admin,

A lead has been deleted from the CRM system.

**Lead Details:**
- Name: [Lead Name]
- Email: [Lead Email]
- Address: [Lead Address]
- Status: [Lead Status]
- Created: [Creation Date]

**Deletion Details:**
- Deleted by: [User Name] ([User Email])
- Deletion time: [Current Time]

**Action Required:**
Please review this deletion to ensure it was appropriate. If this was an error, you may need to restore the lead from backups or contact the user who performed the deletion.

**System Information:**
- Lead ID: [Lead ID]
- Deleted by User ID: [User ID]

This is an automated notification from the CRM system.

Best regards,
CRM Notification System
```

## Configuration

### Required Environment Variables
- `NEXTAUTH_URL`: Base URL for the application
- Gmail OAuth credentials (already configured for existing email features)

### Database Requirements
- Users table must have a `role` field with `ADMIN` values
- All admin users must have valid email addresses

## Testing

### Manual Testing
1. Create a test lead
2. Delete the lead as a non-admin user
3. Check admin email inboxes for notification
4. Verify email content is correct

### Admin User Setup
To test notifications, ensure you have at least one user with `ADMIN` role:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

## Security Considerations

1. **Authorization**: Only authorized users can delete leads (existing logic)
2. **Notification Privacy**: Only admin users receive notifications
3. **Error Handling**: Notification failures don't expose sensitive information
4. **Logging**: All notification attempts are logged for debugging

## Troubleshooting

### Common Issues

1. **No notifications received**
   - Check if admin users exist in database
   - Verify Gmail access token is valid
   - Check server logs for notification errors

2. **Gmail API errors**
   - Ensure Gmail OAuth is properly configured
   - Check access token expiration
   - Verify Gmail API quotas

3. **Missing lead data in notification**
   - Check if lead was properly fetched before deletion
   - Verify database schema matches expected fields

### Debug Logs

The system logs the following events:
- `📧 Lead deletion notification sent to [email]`
- `❌ Failed to send notification to [email]: [error]`
- `✅ Lead deletion notifications sent to [count] admin(s)`
- `No admin users found to notify`

## Future Enhancements

1. **Notification Preferences**: Allow admins to opt-out of notifications
2. **Deletion Reasons**: Add optional reason field for deletions
3. **Notification History**: Store notification records in database
4. **Webhook Support**: Send notifications to external systems
5. **SMS Notifications**: Add SMS notifications for critical deletions 