# Google Chat Setup Guide for Existing Leads

## Quick Setup

### **Step 1: Get Google Access Token**

You need to get a Google access token to run the migration script. Here's how:

1. **Open your browser** and go to your CRM
2. **Open Developer Tools** (F12)
3. **Go to Application/Storage tab**
4. **Look for your session** and find the `accessToken` value
5. **Copy the access token**

### **Step 2: Set Environment Variable**

Add the access token to your `.env.local` file:

```env
GOOGLE_ACCESS_TOKEN=your_access_token_here
```

### **Step 3: Run the Migration Script**

```bash
npm run create-chat-spaces
```

## What the Script Does

### **✅ For Each Existing Lead:**
1. **Creates a Google Chat space** with lead details
2. **Adds all admin users** to the chat
3. **Adds the lead creator** (if found)
4. **Adds the assigned user** (if different from creator)
5. **Sends a welcome message** with lead information
6. **Updates the lead** with the chat space ID

### **📊 Features:**
- **Batch processing** to avoid API limits
- **Error handling** for failed requests
- **Progress tracking** with detailed logs
- **Summary report** at the end
- **Rate limiting** to respect Google API limits

## Expected Output

```
🚀 Starting Google Chat space creation for existing leads...
📋 Fetching admin users...
✅ Found 7 admin users
📋 Fetching leads without chat spaces...
✅ Found 150 leads without chat spaces

📦 Processing batch 1/50 (3 leads)

🔄 Creating chat space for lead: John Smith (abc123)
   👤 Creator: Kyle Gifford (kyle@example.com)
   👤 Assigned: Matthew Praedel (matthew@example.com)
   ✅ Chat space created: spaces/abc123def456

📦 Processing batch 2/50 (3 leads)
...

📊 Summary:
✅ Successfully created: 145 chat spaces
❌ Failed: 5 leads
📈 Total processed: 150 leads

🎉 Successfully created chat spaces for existing leads!
💡 You can now use the chat widget in lead detail pages.
```

## Troubleshooting

### **"Missing Google access token"**
- Make sure you've added `GOOGLE_ACCESS_TOKEN` to your `.env.local`
- Get a fresh token from your browser session

### **"Failed to create chat space"**
- Check if your Google account has Chat API access
- Verify the access token is valid and not expired
- Check Google API quotas and limits

### **"No admin users found"**
- Make sure you have users with ADMIN role in your database
- Check the user roles in your admin panel

### **"Rate limiting errors"**
- The script includes delays between requests
- If you get rate limit errors, wait a few minutes and try again
- You can modify the delays in the script if needed

## After Running the Script

### **✅ What You'll Have:**
- **Google Chat spaces** for all existing leads
- **Team members added** to each chat
- **Welcome messages** with lead details
- **Chat widgets** working in lead pages

### **🎯 Next Steps:**
1. **Test the chat widget** in a lead detail page
2. **Send test messages** to verify functionality
3. **Check Google Chat** for the new spaces
4. **Verify team members** are in the chats

## Manual Verification

### **Check in Google Chat:**
1. Go to [chat.google.com](https://chat.google.com)
2. Look for spaces named "Lead: [Name] - [ID]"
3. Verify team members are added
4. Check welcome messages

### **Check in CRM:**
1. Go to any lead detail page
2. Look for the "Team Chat" widget
3. Try sending a test message
4. Click "Open Chat" to go to Google Chat

## Support

If you encounter issues:

1. **Check the error logs** in the script output
2. **Verify your Google API setup** and permissions
3. **Ensure your access token** is valid and not expired
4. **Contact support** if problems persist

---

**Note**: This script only creates chat spaces for leads that don't already have them. If a lead already has a `googleChatSpaceId`, it will be skipped. 