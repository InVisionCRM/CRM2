import { WebClient } from '@slack/web-api'

export interface SlackChannel {
  id: string
  name: string
}

export interface SlackMessage {
  text?: string
  blocks?: any[]
}

export interface CreateChannelOptions {
  name: string
  isPrivate?: boolean
  members?: string[] // User IDs to invite
}

export class SlackService {
  private client: WebClient

  constructor(botToken?: string) {
    const token = botToken || process.env.SLACK_BOT_TOKEN
    if (!token) {
      throw new Error('Slack bot token is required')
    }
    this.client = new WebClient(token)
  }

  /**
   * Create a new Slack channel
   */
  async createChannel(options: CreateChannelOptions): Promise<{ success: boolean; channelId?: string; channelName?: string; error?: string }> {
    try {
      console.log('🔍 [SLACK CLIENT] createChannel called with:', options)

      // Slack channel names must be lowercase, no spaces, and use hyphens
      const sanitizedName = options.name
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '-')
        .replace(/--+/g, '-') // Replace multiple hyphens with single
        .substring(0, 80) // Slack channel name limit

      console.log('🔍 [SLACK CLIENT] Sanitized channel name:', sanitizedName)

      console.log('🔍 [SLACK CLIENT] Calling Slack API conversations.create...')
      const result = await this.client.conversations.create({
        name: sanitizedName,
        is_private: options.isPrivate || false
      })

      console.log('🔍 [SLACK CLIENT] Slack API response:', result)

      if (!result.ok || !result.channel) {
        return {
          success: false,
          error: 'Failed to create channel'
        }
      }

      const channelId = result.channel.id!
      const channelName = result.channel.name!

      // Invite members if specified
      if (options.members && options.members.length > 0) {
        await this.inviteUsersToChannel(channelId, options.members)
      }

      return {
        success: true,
        channelId,
        channelName
      }
    } catch (error: any) {
      console.error('❌ [SLACK CLIENT] Error creating Slack channel:', error)
      console.error('❌ [SLACK CLIENT] Error message:', error.message)
      console.error('❌ [SLACK CLIENT] Error code:', error.code)
      if (error.data) {
        console.error('❌ [SLACK CLIENT] Error data:', JSON.stringify(error.data, null, 2))
      }
      return {
        success: false,
        error: error.message || 'Failed to create channel'
      }
    }
  }

  /**
   * Invite users to a channel
   */
  async inviteUsersToChannel(channelId: string, userIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      // Slack API allows inviting multiple users at once
      await this.client.conversations.invite({
        channel: channelId,
        users: userIds.join(',')
      })

      return { success: true }
    } catch (error: any) {
      console.error('Error inviting users to Slack channel:', error)
      return {
        success: false,
        error: error.message || 'Failed to invite users'
      }
    }
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      const result = await this.client.users.lookupByEmail({
        email
      })

      if (!result.ok || !result.user) {
        return {
          success: false,
          error: 'User not found'
        }
      }

      return {
        success: true,
        userId: result.user.id
      }
    } catch (error: any) {
      console.error('Error finding Slack user by email:', error)
      return {
        success: false,
        error: error.message || 'Failed to find user'
      }
    }
  }

  /**
   * Send a message to a channel
   */
  async sendMessage(channelId: string, message: SlackMessage): Promise<{ success: boolean; error?: string; timestamp?: string }> {
    try {
      const result = await this.client.chat.postMessage({
        channel: channelId,
        text: message.text || '',
        blocks: message.blocks,
        unfurl_links: true,  // Enable link unfurling for Google Drive links
        unfurl_media: true   // Enable media unfurling
      })

      return {
        success: true,
        timestamp: result.ts  // Return message timestamp for pinning
      }
    } catch (error: any) {
      console.error('Error sending message to Slack channel:', error)
      return {
        success: false,
        error: error.message || 'Failed to send message'
      }
    }
  }

  /**
   * Get channel information
   */
  async getChannel(channelId: string): Promise<{ success: boolean; channel?: any; error?: string }> {
    try {
      const result = await this.client.conversations.info({
        channel: channelId
      })

      if (!result.ok || !result.channel) {
        return {
          success: false,
          error: 'Channel not found'
        }
      }

      return {
        success: true,
        channel: result.channel
      }
    } catch (error: any) {
      console.error('Error getting Slack channel:', error)
      return {
        success: false,
        error: error.message || 'Failed to get channel'
      }
    }
  }

  /**
   * Archive a Slack channel
   */
  async archiveChannel(channelId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.client.conversations.archive({
        channel: channelId
      })

      return { success: true }
    } catch (error: any) {
      console.error('Error archiving Slack channel:', error)
      return {
        success: false,
        error: error.message || 'Failed to archive channel'
      }
    }
  }

  /**
   * Upload a file to a channel
   */
  async uploadFile(channelId: string, file: Buffer, filename: string, title?: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.client.files.uploadV2({
        channel_id: channelId,
        file,
        filename,
        title: title || filename
      })

      return { success: true }
    } catch (error: any) {
      console.error('Error uploading file to Slack:', error)
      return {
        success: false,
        error: error.message || 'Failed to upload file'
      }
    }
  }

  /**
   * Set channel topic
   */
  async setChannelTopic(channelId: string, topic: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.client.conversations.setTopic({
        channel: channelId,
        topic
      })

      return { success: true }
    } catch (error: any) {
      console.error('Error setting Slack channel topic:', error)
      return {
        success: false,
        error: error.message || 'Failed to set channel topic'
      }
    }
  }

  /**
   * Rename a Slack channel
   */
  async renameChannel(channelId: string, newName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.client.conversations.rename({
        channel: channelId,
        name: newName
      })

      if (!result.ok) {
        return {
          success: false,
          error: 'Failed to rename channel'
        }
      }

      return { success: true }
    } catch (error: any) {
      console.error('Error renaming Slack channel:', error)
      return {
        success: false,
        error: error.message || 'Failed to rename channel'
      }
    }
  }

  /**
   * Pin a message to a channel
   */
  async pinMessage(channelId: string, messageTimestamp: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.client.pins.add({
        channel: channelId,
        timestamp: messageTimestamp
      })

      if (!result.ok) {
        return {
          success: false,
          error: 'Failed to pin message'
        }
      }

      return { success: true }
    } catch (error: any) {
      console.error('Error pinning message to Slack channel:', error)
      return {
        success: false,
        error: error.message || 'Failed to pin message'
      }
    }
  }
}
