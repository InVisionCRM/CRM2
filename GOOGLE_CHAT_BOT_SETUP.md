# Google Chat Bot Setup Guide

## 🎯 **Ensuring Purlin_Bot is Added to All Chat Spaces**

### **How Bot Addition Works:**

1. **Automatic Addition**: When a chat space is created, the bot is automatically added because it's configured as the webhook endpoint
2. **Manual Addition**: If the bot isn't automatically added, it can be manually added to spaces

### **Current Implementation:**

The bot should be automatically added to all new chat spaces because:

✅ **Webhook Configuration**: The bot is configured as the webhook endpoint for the Google Chat app
✅ **Space Creation**: When spaces are created, the bot is automatically included
✅ **Member Management**: The bot can respond to commands and messages

### **Verification Steps:**

1. **Create a new chat space** for a lead
2. **Check the space members** - Purlin_Bot should be listed
3. **Try a command** like `/help` - the bot should respond
4. **If bot is missing**, manually add it to the space

### **Manual Bot Addition (if needed):**

If the bot isn't automatically added, you can:

1. **Go to the chat space**
2. **Click the space name** at the top
3. **Click "Add people & bots"**
4. **Search for "Purlin_Bot"**
5. **Add the bot to the space**

### **Troubleshooting:**

**Issue: Bot not responding**
- Check if the bot is added to the space
- Verify the Apps Script is deployed and working
- Check the webhook URL is correct

**Issue: Bot not automatically added**
- Verify the Google Chat app configuration
- Check that the webhook URL points to your Apps Script
- Ensure the bot has proper permissions

### **Code Implementation:**

The current code includes:
- ✅ Automatic bot addition via webhook configuration
- ✅ Bot verification after space creation
- ✅ Error handling for bot addition failures

**The bot should be automatically added to all new chat spaces! 🚀** 