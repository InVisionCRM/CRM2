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
    refreshToken?: string
    accessToken?: string
  }) {
    this.auth = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret
    )

    if (credentials.accessToken) {
      this.auth.setCredentials({
        access_token: credentials.accessToken,
        refresh_token: credentials.refreshToken
      })
    }

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
          description: options.description,
          spaceType: 'ROOM'
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
        }
      })

      await Promise.all(memberPromises)
      return { success: true }
    } catch (error: any) {
      console.error('Error adding members to Google Chat space:', error)
      return {
        success: false,
        error: error.message || 'Failed to add members to chat space'
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