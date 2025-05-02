import type { Message } from "@/types/message"

export const mockMessages: Message[] = [
  {
    id: "1",
    content:
      "Team, I've scheduled a site visit for 123 Main Street tomorrow at 10am. Please make sure all equipment is ready.",
    authorId: "user1",
    authorName: "John Contractor",
    authorAvatar: "/placeholder.svg?height=40&width=40",
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    isRead: false,
  },
  {
    id: "2",
    content: "The materials for the Thompson project have been delivered. Invoice has been paid in full.",
    authorId: "user2",
    authorName: "Sarah Manager",
    authorAvatar: "/placeholder.svg?height=40&width=40",
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    isRead: true,
  },
  {
    id: "3",
    content: "Weather alert: Heavy rain expected tomorrow. Might affect the Lincoln Road project.",
    authorId: "user3",
    authorName: "Mike Coordinator",
    authorAvatar: "/placeholder.svg?height=40&width=40",
    createdAt: new Date(Date.now() - 172800000), // 2 days ago
    isRead: true,
  },
  {
    id: "4",
    content: "Client requested a change in shingle color for 456 Oak Avenue. Updated details in the job notes.",
    authorId: "user4",
    authorName: "Lisa Sales",
    authorAvatar: "/placeholder.svg?height=40&width=40",
    createdAt: new Date(Date.now() - 259200000), // 3 days ago
    isRead: false,
  },
  {
    id: "5",
    content: "Reminder: Safety meeting this Friday at 8am. Attendance is mandatory for all field staff.",
    authorId: "user1",
    authorName: "John Contractor",
    authorAvatar: "/placeholder.svg?height=40&width=40",
    createdAt: new Date(Date.now() - 345600000), // 4 days ago
    isRead: true,
  },
]
