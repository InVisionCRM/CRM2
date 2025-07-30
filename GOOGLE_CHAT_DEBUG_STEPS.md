# Google Chat Commands Debug Guide

## 🚨 **Commands Not Working - Step-by-Step Debug**

### **Step 1: Test Apps Script Directly**

1. **Go to your Apps Script project**
2. **Add this simple test code:**

```javascript
function doPost(e) {
  try {
    console.log('Received request:', e.postData.contents);
    
    return ContentService.createTextOutput(JSON.stringify({
      text: "Hello! I'm Purlin_Bot and I'm working! 🎉"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('Error:', error);
    return ContentService.createTextOutput(JSON.stringify({
      text: "Sorry, I encountered an error. Please check the logs."
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Purlin_Bot is running!");
}
```

3. **Save and deploy** as a new web app
4. **Update your Google Chat app** with the new webhook URL
5. **Test in Google Chat** - type anything, should get "Hello! I'm Purlin_Bot..."

### **Step 2: Check Apps Script Logs**

1. **In your Apps Script project**
2. **Click "Executions" in the left sidebar**
3. **Look for recent executions**
4. **Click "View logs"** for each execution
5. **Check for error messages**

### **Step 3: Verify Google Chat App Configuration**

1. **Go to Google Cloud Console**
2. **Navigate to "APIs & Services" → "Google Chat API"**
3. **Click on your "Purlin_Bot" app**
4. **Check these settings:**

✅ **Connection settings:**
- Apps Script selected
- Correct Apps Script URL entered

✅ **Triggers:**
- App command: `doPost`
- Added to space: `doPost`
- Message: `doPost`
- Removed from space: `doPost`

### **Step 4: Test CRM API Endpoints**

Go to: `https://crm.purlin.pro/test-chat-integration`

Run the tests to see if your CRM APIs are working.

### **Step 5: Check Bot Permissions**

1. **Go to your Google Chat space**
2. **Click the space name** at the top
3. **Click "Add people & bots"**
4. **Search for "Purlin_Bot"**
5. **Make sure the bot is added to the space**

### **Step 6: Test Simple Commands**

Try these commands in Google Chat:
```
/help
/status
```

### **Step 7: Check Webhook URL**

1. **Copy your Apps Script web app URL**
2. **Test it in browser** - should show "Purlin_Bot is running!"
3. **Make sure it ends with `/exec`**

### **Step 8: Common Issues & Fixes**

#### **Issue: "Bot not responding"**
- **Fix:** Check Apps Script logs for errors
- **Fix:** Verify webhook URL is correct
- **Fix:** Make sure bot is added to space

#### **Issue: "Permission denied"**
- **Fix:** Re-authenticate in CRM (sign out/in)
- **Fix:** Check Google Chat API is enabled
- **Fix:** Verify OAuth scopes include chat permissions

#### **Issue: "Commands not recognized"**
- **Fix:** Use the simple test code above first
- **Fix:** Check Apps Script deployment settings
- **Fix:** Verify triggers are set to `doPost`

### **Step 9: Advanced Debugging**

If still not working:

1. **Check browser console** for errors
2. **Check Apps Script logs** for detailed errors
3. **Test webhook URL** with a tool like Postman
4. **Verify Google Chat API** is enabled in Google Cloud Console

### **Step 10: Reset and Retry**

1. **Delete your current Google Chat app**
2. **Create a new Google Chat app**
3. **Use the simple test code**
4. **Test with basic functionality first**
5. **Then add the full CRM integration**

**Start with Step 1 - the simple test code will tell us if the basic connection works! 🚀** 