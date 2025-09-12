# DocuSeal Contract Auto-Save Setup

This system automatically saves signed contracts from DocuSeal directly to your Google Shared Drive with lead-specific file names.

## Features

✅ **Automatic webhook processing** - DocuSeal calls our webhook when contracts are signed  
✅ **Lead matching** - Matches submissions to leads by email address  
✅ **Shared Drive integration** - Saves contracts directly to your shared drive  
✅ **Database tracking** - Creates contract records in the database  
✅ **Manual trigger** - "Save to Lead" button for existing completed contracts  
✅ **Smart file naming** - Includes lead name and ID in filename for easy identification

## Setup Requirements

### 1. Environment Variables

Make sure these are set in your `.env.local`:

```env
# DocuSeal Configuration
DOCUSEAL_URL=http://your-docuseal-instance:3000
DOCUSEAL_API_KEY=your_docuseal_api_key

# Google Service Account (for Drive access)
GOOGLE_SA_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google Shared Drive
SHARED_DRIVE_ID=your_shared_drive_id
```

### 2. DocuSeal Webhook Configuration

1. Go to your DocuSeal instance admin panel
2. Navigate to Webhooks settings
3. Add a new webhook:
   - **URL**: `https://your-domain.com/api/webhooks/docuseal`
   - **Events**: Select `submission.completed`
   - **Method**: POST

### 3. Google Shared Drive Setup

1. **Create or identify your Shared Drive** in Google Drive
2. **Copy the drive ID** from the URL and set it as `SHARED_DRIVE_ID`
3. **Add your service account** to the shared drive with Editor permissions

## How It Works

### Automatic Process (Webhook)

1. **Contract Signed**: User signs contract in DocuSeal
2. **Webhook Triggered**: DocuSeal calls `/api/webhooks/docuseal`
3. **Lead Matching**: System finds lead by submitter email
4. **Document Download**: Downloads signed contract from DocuSeal
5. **Upload to Shared Drive**: Saves contract with lead-specific filename
6. **Database Record**: Creates contract record in database

### Manual Process (UI Button)

1. **Navigate to Submissions**: Go to `/submissions` page
2. **Find Completed Contract**: Look for submissions with "Completed" status
3. **Click "Save to Lead"**: Button appears next to "View Contract"
4. **Automatic Processing**: Same process as webhook, but manually triggered

## File Structure

### API Endpoints
- `/api/webhooks/docuseal` - Webhook handler for DocuSeal events
- `/api/docuseal/auto-save-contracts` - Manual trigger for auto-saving contracts

### File Naming Convention
```
Signed Contract - [Lead Name] (ID [Lead ID]) - [Template Name] - [Completion Date].pdf
```

Example: `Signed Contract - John Doe (ID abc123) - General Agreement - 1/15/2025.pdf`

### Database Schema
Contracts are saved with:
- `leadId` - Associated lead ID
- `contractType` - Set to 'docuseal_signed' 
- `signatures` - Contains DocuSeal submission ID
- `dates` - Completion timestamp
- `names` - Submitter names and template name
- `contactInfo` - Submitter email addresses
- `pdfUrl` - Google Drive link to the contract

## Testing

### Test the Manual Trigger

1. Go to the submissions page
2. Find a completed submission
3. Click "Save to Lead"
4. Check the console logs for processing details
5. Verify the contract appears in the lead's files

### Test the Webhook

1. Complete a contract signing in DocuSeal
2. Check server logs for webhook processing
3. Verify the contract was automatically saved to the lead

## Troubleshooting

### Common Issues

**No lead found for email**
- Ensure the lead's email matches exactly with the DocuSeal submitter email
- Check for case sensitivity issues

**Google Drive folder creation fails**
- Verify service account has proper permissions
- Check that `SHARED_DRIVE_ID` is correct
- Ensure shared drive is shared with service account

**Contract download fails**
- Verify DocuSeal API credentials
- Check that the submission has a downloadable document
- Ensure DocuSeal instance is accessible from your server

**Webhook not triggering**
- Verify webhook URL is publicly accessible
- Check DocuSeal webhook configuration
- Look for webhook delivery failures in DocuSeal logs

### Debug Logs

The system provides detailed console logging:
- `🔵` - Process start
- `📋` - Submission processing  
- `✅` - Success operations
- `📁` - Shared drive operations
- `📄` - Document operations
- `⬇️` - Downloads
- `⬆️` - Uploads
- `⚠️` - Warnings
- `💥` - Errors

## Security Notes

- Webhook endpoint validates DocuSeal payloads
- Service account has minimal required permissions
- Contracts are saved to shared drive with controlled access
- All operations are logged for audit purposes

## Future Enhancements

- Email notifications when contracts are auto-saved
- Batch processing for multiple completed contracts
- Integration with lead status updates
- Automatic lead progression workflows
- Folder organization within shared drive 