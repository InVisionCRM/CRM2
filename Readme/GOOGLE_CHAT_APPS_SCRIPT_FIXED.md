# Fixed Google Apps Script for CRM Chat Bot

## 🚨 **FIXED: "Cannot read properties of undefined (reading 'postData')"**

### **Complete Fixed Apps Script Code:**

Replace your current Apps Script code with this **FIXED** version:

```javascript
// Main function that handles all interactions
function doPost(e) {
  try {
    // Check if e and e.postData exist
    if (!e || !e.postData) {
      console.log('No postData received, returning default response');
      return ContentService.createTextOutput(JSON.stringify({
        text: "Hello! I'm Purlin_Bot and I'm working! 🎉"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = JSON.parse(e.postData.contents);
    console.log('Received data:', data);
    
    // Handle different event types
    const eventType = data.type;
    
    switch(eventType) {
      case 'MESSAGE':
        return handleMessage(data);
      case 'ADDED_TO_SPACE':
        return handleAddedToSpace(data);
      case 'REMOVED_FROM_SPACE':
        return handleRemovedFromSpace(data);
      case 'CARD_CLICKED':
        return handleCardClicked(data);
      default:
        return handleDefault(data);
    }
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService.createTextOutput(JSON.stringify({
      text: "Sorry, I encountered an error. Please try again."
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleMessage(data) {
  const text = data.message?.text || '';
  const spaceId = data.space?.name || '';
  const userEmail = data.user?.email || '';
  
  // Check if it's a command (starts with /)
  if (text.startsWith('/')) {
    return handleCommand(text, spaceId, userEmail);
  }
  
  // Check if message contains file attachments
  if (data.message?.attachment) {
    return handleFileUpload(data, spaceId, userEmail);
  }
  
  // Handle regular messages
  if (text.toLowerCase().includes('help')) {
    return ContentService.createTextOutput(JSON.stringify({
      text: "I'm your CRM Chat Bot! Type /help to see all available commands."
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (text.toLowerCase().includes('hello') || text.toLowerCase().includes('hi')) {
    return ContentService.createTextOutput(JSON.stringify({
      text: "Hello! I'm your CRM assistant. Type /help to see what I can do."
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    text: "Hello! I'm your CRM assistant. Type /help to see available commands."
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleFileUpload(data, spaceId, userEmail) {
  try {
    const attachment = data.message.attachment;
    const fileName = attachment.name || 'Unknown file';
    const fileUrl = attachment.driveDataRef?.driveDataId || attachment.sourceUrl || '';
    const fileType = getFileType(fileName);
    
    // Call your CRM API to sync the file
    const response = UrlFetchApp.fetch('https://crm.purlin.pro/api/chat/file-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        spaceId: spaceId,
        fileName: fileName,
        fileUrl: fileUrl,
        fileType: fileType,
        uploadedBy: userEmail
      })
    });
    
    const result = JSON.parse(response.getContentText());
    
    if (result.success) {
      return ContentService.createTextOutput(JSON.stringify({
        text: `✅ File "${fileName}" uploaded and synced to CRM!`
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        text: `❌ Failed to sync file "${fileName}" to CRM. Please try again.`
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    console.error('Error handling file upload:', error);
    return ContentService.createTextOutput(JSON.stringify({
      text: "❌ Sorry, I couldn't process that file upload. Please try again."
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getFileType(fileName) {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  const fileTypes = {
    'pdf': 'document',
    'doc': 'document',
    'docx': 'document',
    'jpg': 'image',
    'jpeg': 'image',
    'png': 'image',
    'gif': 'image',
    'xls': 'spreadsheet',
    'xlsx': 'spreadsheet',
    'ppt': 'presentation',
    'pptx': 'presentation'
  };
  
  return fileTypes[extension] || 'other';
}

function handleCommand(command, spaceId, userEmail) {
  try {
  
    // Call your CRM API with the CORRECT domain
    const response = UrlFetchApp.fetch('https://crm.purlin.pro/api/chat/commands', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        command: command,
        spaceId: spaceId,
        userEmail: userEmail
      })
    });
    
    const result = JSON.parse(response.getContentText());
    
    return ContentService.createTextOutput(JSON.stringify({
      text: result.text || "Command processed successfully."
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('Error handling command:', error);
    return ContentService.createTextOutput(JSON.stringify({
      text: "❌ Sorry, I couldn't process that command. Please try again or type /help for available commands."
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleAddedToSpace(data) {
  return ContentService.createTextOutput(JSON.stringify({
    text: "Thanks for adding me to the space! I'm your CRM assistant. Type /help to see what I can do."
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleRemovedFromSpace(data) {
  return ContentService.createTextOutput(JSON.stringify({
    text: "Goodbye! I've been removed from the space."
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleCardClicked(data) {
  // Handle card interactions (future enhancement)
  return ContentService.createTextOutput(JSON.stringify({
    text: "Card interaction received."
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleDefault(data) {
  return ContentService.createTextOutput(JSON.stringify({
    text: "Event received: " + (data.type || 'unknown')
  })).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput("Purlin_Bot is running!");
}
```

## 🔧 **Key Fixes:**

1. **✅ Fixed postData error** - Added proper null checks
2. **✅ Better error handling** - Graceful fallbacks
3. **✅ Correct domain URLs** - Using `crm.purlin.pro`
4. **✅ Complete integration** - All commands and file uploads

## 🚀 **Setup Instructions:**

1. **Copy the code above** into your Google Apps Script
2. **Save and deploy** as a new web app
3. **Update your Google Chat app** with the new webhook URL
4. **Test the commands** in Google Chat

## 🎯 **Test Commands:**

```
/help - Show all commands
/status - Check current lead status
/files - List current lead files
/upload - Get upload instructions
```

**This should fix the postData error and get your commands working! 🚀** 