# Updated Google Apps Script for CRM Chat Bot

## 🎯 **Complete Apps Script Code:**

Replace your current Apps Script code with this:

```javascript
// Main function that handles all interactions
function doPost(e) {
  try {
    // Check if e and e.postData exist
    if (!e || !e.postData) {
      console.log('No postData received, returning default response');
      return ContentService.createTextOutput(JSON.stringify({
        text: "Hello! I'm your CRM Chat Bot. I'm ready to help with lead management."
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

function handleCommand(command, spaceId, userEmail) {
  try {
    // Call your CRM API
    const response = UrlFetchApp.fetch('https://your-domain.com/api/chat/commands', {
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

function handleDefault(data) {
  return ContentService.createTextOutput(JSON.stringify({
    text: "Event received: " + (data.type || 'unknown')
  })).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput("CRM Chat Bot is running");
}
```

## 🚀 **Available Commands:**

### **Inside Lead Chat Spaces:**
- `/status` - Check current lead status
- `/files` - List current lead files
- `/photos` - View current lead photos
- `/contracts` - Check current lead contracts
- `/update [status]` - Update current lead status

### **From Anywhere:**
- `/status [lead_id]` - Check specific lead
- `/files [lead_id]` - List specific lead files
- `/photos [lead_id]` - View specific lead photos
- `/contracts [lead_id]` - Check specific lead contracts
- `/update [lead_id] [status]` - Update specific lead

### **Other:**
- `/help` - Show all available commands

## ⚙️ **Setup Instructions:**

1. **Replace your Apps Script code** with the code above
2. **Update the API URL** in `handleCommand()` function:
   - Replace `'https://your-domain.com/api/chat/commands'` with your actual domain
3. **Save and deploy** the Apps Script
4. **Test the commands** in Google Chat

## 🎯 **How It Works:**

1. **User types command** in Google Chat
2. **Apps Script receives** the message
3. **Calls your CRM API** with the command
4. **CRM processes** the command and returns data
5. **Apps Script sends** the response back to chat

**The bot now automatically detects which lead you're talking about when you're inside a lead's chat space! 🚀** 