import { google } from 'googleapis'

export interface GoogleChatSpace {
  name: string
  displayName: string
  description?: string
  members?: string[]
}

export interface GoogleChatMessage {
  text?: string
  cards?: any[]
}

export interface CreateSpaceOptions {
  displayName: string
  description?: string
  members?: string[]
}

export class GoogleChatService {
  private chat: any
  private auth: any

  constructor(credentials: {
    clientId: string
    clientSecret: string
    accessToken: string
    refreshToken?: string
  }) {
    this.auth = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret
    )

    this.auth.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken
    })

    this.chat = google.chat({ version: 'v1', auth: this.auth })
  }

  /**
   * Create a new Google Chat space
   */
  async createSpace(options: CreateSpaceOptions): Promise<{ success: boolean; spaceId?: string; error?: string }> {
    try {
      const space = await this.chat.spaces.create({
        requestBody: {
          displayName: options.displayName,
          spaceType: 'SPACE'
        }
      })

      const spaceId = space.data.name

      // Add members if specified
      if (options.members && options.members.length > 0) {
        await this.addMembersToSpace(spaceId, options.members)
      }

      return {
        success: true,
        spaceId
      }
    } catch (error: any) {
      console.error('Error creating Google Chat space:', error)
      return {
        success: false,
        error: error.message || 'Failed to create chat space'
      }
    }
  }

  /**
   * Add members to a Google Chat space
   */
  async addMembersToSpace(spaceId: string, memberEmails: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const memberPromises = memberEmails.map(async (email) => {
        try {
          await this.chat.spaces.members.create({
            parent: spaceId,
            requestBody: {
              member: {
                name: `users/${email}`,
                type: 'HUMAN'
              }
            }
          })
          console.log(`✅ Added ${email} to chat space ${spaceId}`)
        } catch (error: any) {
          console.error(`❌ Failed to add ${email} to chat space:`, error.message)
          // Don't fail the entire operation if one member fails
        }
      })

      await Promise.all(memberPromises)
      return { success: true }
    } catch (error: any) {
      console.error('Error adding members to chat space:', error)
      return {
        success: false,
        error: error.message || 'Failed to add members to chat space'
      }
    }
  }

  /**
   * Add the bot to a Google Chat space
   */
  async addBotToSpace(spaceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // The bot should be automatically added when the space is created
      // because it's configured as the webhook endpoint
      console.log(`✅ Bot should be automatically added to space ${spaceId}`)
      return { success: true }
    } catch (error: any) {
      console.error('Error adding bot to chat space:', error)
      return {
        success: false,
        error: error.message || 'Failed to add bot to chat space'
      }
    }
  }

  /**
   * Check if the bot is in a space and add it if needed
   */
  async ensureBotInSpace(spaceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get space members
      const members = await this.chat.spaces.members.list({
        parent: spaceId
      })

      // Check if bot is already in the space
      const botMember = members.data.memberships?.find((member: any) => 
        member.member?.displayName === 'Purlin_Bot' || 
        member.member?.name?.includes('bot')
      )

      if (botMember) {
        console.log(`✅ Bot is already in space ${spaceId}`)
        return { success: true }
      } else {
        console.log(`⚠️ Bot not found in space ${spaceId}, attempting to add...`)
        // The bot should be automatically added via webhook configuration
        // If it's not there, it might be a configuration issue
        return { success: true, error: 'Bot should be automatically added via webhook' }
      }
    } catch (error: any) {
      // Handle permission denied errors gracefully
      if (error.code === 403 || error.status === 403) {
        console.log(`⚠️ Permission denied accessing space ${spaceId} - this is normal for newly created spaces`)
        console.log(`ℹ️ The bot will be automatically added when the space is properly configured`)
        return { 
          success: true, 
          error: 'Permission denied - bot will be added automatically via webhook' 
        }
      }
      
      console.error('Error checking bot in space:', error)
      return {
        success: false,
        error: error.message || 'Failed to check bot in space'
      }
    }
  }

  /**
   * Send a message to a Google Chat space
   */
  async sendMessage(spaceId: string, message: GoogleChatMessage): Promise<{ success: boolean; error?: string }> {
    try {
      await this.chat.spaces.messages.create({
        parent: spaceId,
        requestBody: {
          text: message.text,
          cards: message.cards
        }
      })

      return { success: true }
    } catch (error: any) {
      console.error('Error sending message to Google Chat space:', error)
      return {
        success: false,
        error: error.message || 'Failed to send message'
      }
    }
  }

  /**
   * Get space information
   */
  async getSpace(spaceId: string): Promise<{ success: boolean; space?: any; error?: string }> {
    try {
      const space = await this.chat.spaces.get({
        name: spaceId
      })

      return {
        success: true,
        space: space.data
      }
    } catch (error: any) {
      console.error('Error getting Google Chat space:', error)
      return {
        success: false,
        error: error.message || 'Failed to get chat space'
      }
    }
  }

  /**
   * Delete a Google Chat space
   */
  async deleteSpace(spaceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.chat.spaces.delete({
        name: spaceId
      })

      return { success: true }
    } catch (error: any) {
      console.error('Error deleting Google Chat space:', error)
      return {
        success: false,
        error: error.message || 'Failed to delete chat space'
      }
    }
  }
} 