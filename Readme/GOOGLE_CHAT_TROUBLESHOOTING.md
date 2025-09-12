# Google Chat Bot Troubleshooting Guide

## 🚨 **"Purlin_Bot not responding" - Quick Fix**

### **Step 1: Check Apps Script Deployment**

1. **Go to your Apps Script project**
2. **Click "Deploy" → "New deployment"**
3. **Choose "Web app"**
4. **Set these settings:**
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
5. **Click "Deploy"**
6. **Copy the new web app URL**

### **Step 2: Update Google Chat App Configuration**

1. **Go to Google Cloud Console**
2. **Navigate to "APIs & Services" → "Google Chat API"**
3. **Click on your "Purlin_Bot" app**
4. **Update the webhook URL:**
   - **Replace the old URL** with your new Apps Script web app URL
   - **Make sure it ends with `/exec`**
5. **Save the changes**

### **Step 3: Test the Apps Script**

Add this simple test code to your Apps Script:

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

### **Step 4: Check Apps Script Logs**

1. **In your Apps Script project**
2. **Click "Executions" in the left sidebar**
3. **Look for any error messages**
4. **Check the "View logs" for each execution**

### **Step 5: Verify Google Chat App Settings**

Make sure your Google Chat app has:

✅ **Connection settings:**
- HTTP endpoint URL: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`

✅ **Triggers:**
- **App command:** `doPost`
- **Added to space:** `doPost`
- **Message:** `doPost`
- **Removed from space:** `doPost`

### **Step 6: Test Commands**

Once fixed, try these commands in Google Chat:

```
/help
/status
```

## 🔍 **Common Issues & Solutions:**

### **Issue 1: "Script not found"**
- **Solution:** Make sure you're using the correct Script ID in the webhook URL

### **Issue 2: "Access denied"**
- **Solution:** Set deployment to "Anyone" (not just "Me")

### **Issue 3: "Function not found"**
- **Solution:** Make sure your Apps Script has a `doPost` function

### **Issue 4: "Timeout"**
- **Solution:** Apps Script has a 6-second timeout. Keep responses quick.

## 🎯 **Quick Test:**

1. **Copy the simple test code above**
2. **Replace your current Apps Script code**
3. **Deploy as a new web app**
4. **Update your Google Chat app webhook URL**
5. **Test in Google Chat**

**If the simple test works, then we know the connection is good and we can add the full CRM integration code back.**

## 📞 **Need Help?**

If you're still having issues:
1. **Check the Apps Script logs** for specific error messages
2. **Verify the webhook URL** is correct
3. **Make sure the Google Chat API is enabled** in Google Cloud Console 