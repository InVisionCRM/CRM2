# Google Chat Bot Addition Guide

## 🤖 **Adding Purlin_Bot to Existing Chat Spaces**

If commands aren't working in your lead chat spaces, you need to manually add the bot:

### **Step 1: Open the Chat Space**
1. Go to Google Chat
2. Open the lead's chat space (e.g., "Lead: John Doe - Claim#ABC123 - ID")

### **Step 2: Add the Bot**
1. **Click the space name** at the top of the chat
2. **Click "Apps"** in the left sidebar
3. **Search for "Purlin_Bot"**
4. **Click "Add"** next to Purlin_Bot

### **Step 3: Test Commands**
Once added, try these commands:
- `/help` - Show available commands
- `/status` - Check lead status
- `/files` - List lead files
- `/photos` - View lead photos
- `/contracts` - Check contracts
- `/update [status]` - Update lead status

### **For New Spaces**
New spaces created via the CRM should automatically have the bot added.

### **Troubleshooting**
If the bot doesn't appear in the Apps list:
1. Check that the Google Chat app is properly configured in Google Cloud Console
2. Verify the webhook URL is correct
3. Ensure the app is published to your domain

## 📋 **Command Reference**

**Inside Lead Chat Space:**
- `/status` - Check current lead status
- `/files` - List current lead files  
- `/photos` - View current lead photos
- `/contracts` - Check current lead contracts
- `/update [status]` - Update current lead status
- `/help` - Show all commands

**From Anywhere:**
- `/status [lead_id]` - Check specific lead
- `/files [lead_id]` - List specific lead files
- `/photos [lead_id]` - View specific lead photos
- `/contracts [lead_id]` - Check specific lead contracts
- `/update [lead_id] [status]` - Update specific lead 