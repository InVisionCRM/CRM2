export interface Message {
  id: string
  content: string
  authorId: string
  authorName: string
  authorAvatar?: string
  createdAt: Date
  isRead: boolean
  attachments?: {
    name: string
    url: string
    type: string
  }[]
}

export interface MessageContextType {
  isOpen: boolean
  toggleMessagePanel: () => void
  closeMessagePanel: () => void
  unreadCount: number
  messages: Message[]
  sendMessage: (content: string) => void
  markAsRead: (id: string) => void
}
