# Google Chat Permissions Fix

## 🚨 **Error: "Permission denied to perform the requested action"**

### **What This Error Means:**
The bot doesn't have permission to access the chat space. This is common for newly created spaces.

### **✅ Quick Fixes:**

#### **1. Check Google Chat API Scopes**
Make sure your OAuth scopes include:
```
https://www.googleapis.com/auth/chat.spaces
https://www.googleapis.com/auth/chat.messages
https://www.googleapis.com/auth/chat.messages.create
https://www.googleapis.com/auth/chat.memberships
https://www.googleapis.com/auth/chat.memberships.readonly
```

#### **2. Verify Google Chat App Configuration**
- ✅ **Google Chat API is enabled** in Google Cloud Console
- ✅ **Bot is properly configured** with correct Apps Script URL
- ✅ **Triggers are set** to `doPost` for all events

#### **3. Check Bot Permissions**
- ✅ **Bot has "Add to spaces" permission**
- ✅ **Bot can read/write messages**
- ✅ **Bot can access space members**

### **🔧 Manual Steps:**

#### **Step 1: Re-authenticate**
1. **Go to your CRM**
2. **Sign out and sign back in**
3. **This will refresh your OAuth tokens**

#### **Step 2: Check Google Cloud Console**
1. **Go to Google Cloud Console**
2. **Navigate to "APIs & Services" → "OAuth consent screen"**
3. **Make sure Google Chat API scopes are listed**

#### **Step 3: Test Bot Permissions**
1. **Create a new chat space**
2. **Manually add Purlin_Bot to the space**
3. **Try a command like `/help`**
4. **If it works, the bot has proper permissions**

### **🎯 Expected Behavior:**

**Normal for New Spaces:**
- ⚠️ **Permission denied** when checking bot in newly created space
- ✅ **Bot will be added automatically** via webhook
- ✅ **Commands will work** once bot is in the space

**If Commands Don't Work:**
- ❌ **Check Apps Script deployment**
- ❌ **Verify webhook URL is correct**
- ❌ **Ensure bot is added to the space**

### **📞 Still Having Issues?**

1. **Check the Apps Script logs** for errors
2. **Verify the bot is actually in the space**
3. **Test with a simple command** like `/help`
4. **Re-deploy your Apps Script** if needed

**The permission error is normal for new spaces - the bot will work once properly added! 🚀** 