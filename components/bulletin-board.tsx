"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { Send, AtSign, Users, Loader2, MessageSquare, X, User, Link, Heart, Reply, MoreHorizontal } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface BulletinMessage {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
  leadId?: string
  leadName?: string
  reactions?: { [userId: string]: string }
  replies?: Reply[]
  readBy?: string[] // Array of user IDs who have read this message
  category?: 'general' | 'production' | 'purlin'
}

interface Reply {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
}

interface User {
  id: string
  name: string | null
  email: string
}

interface Lead {
  id: string
  firstName?: string
  lastName?: string
  email?: string
}

interface BulletinBoardProps {
  isOpen: boolean
  onClose: () => void
}

const STORAGE_KEY = 'bulletin-board-messages'

const MESSAGE_CATEGORIES = [
  { value: 'general', label: 'General', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
  { value: 'production', label: 'Production', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'purlin', label: 'Purlin Issues/Requests', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
] as const

export function BulletinBoard({ isOpen, onClose }: BulletinBoardProps) {
  const [messages, setMessages] = useState<BulletinMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isLoadingLeads, setIsLoadingLeads] = useState(false)
  const [showMentionDropdown, setShowMentionDropdown] = useState(false)
  const [mentionQuery, setMentionQuery] = useState("")
  const [cursorPosition, setCursorPosition] = useState(0)
  const [mentionType, setMentionType] = useState<'users' | 'leads'>('users')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'production' | 'purlin'>('general')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()
  const { data: session } = useSession()

  // Fetch users for @mentions
  useEffect(() => {
    async function fetchUsers() {
      setIsLoadingUsers(true)
      try {
        const response = await fetch('/api/users/search?query=');
        if (response.ok) {
          const userData = await response.json();
          setUsers(userData);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoadingUsers(false)
      }
    }
    fetchUsers();
  }, []);

  // Load messages from localStorage
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        const messages = stored ? JSON.parse(stored) : []
        setMessages(messages)
        
        // Mark messages as read when bulletin board opens
        if (session?.user?.id) {
          const updatedMessages = messages.map((message: BulletinMessage) => {
            const readBy = message.readBy || [];
            if (!readBy.includes(session.user.id!)) {
              return { ...message, readBy: [...readBy, session.user.id!] };
            }
            return message;
          });
          
          if (JSON.stringify(messages) !== JSON.stringify(updatedMessages)) {
            setMessages(updatedMessages);
            saveMessages(updatedMessages);
            
            // Dispatch custom event to notify sidebar of read status change
            window.dispatchEvent(new CustomEvent('bulletin-board-updated'));
          }
        }
      } catch (error) {
        console.error("Error loading messages:", error)
        setMessages([])
      } finally {
        setIsLoading(false)
      }
    }
  }, [isOpen, session?.user?.id])

  // Search leads when needed
  const searchLeads = async (query: string) => {
    setIsLoadingLeads(true)
    try {
      console.log('Searching leads with query:', query)
      const response = await fetch(`/api/leads/search?query=${encodeURIComponent(query)}`)
      console.log('Search response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Search results:', data)
        setLeads(data.slice(0, 5))
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Search failed:', errorData)
      }
    } catch (error) {
      console.error("Error searching leads:", error)
    } finally {
      setIsLoadingLeads(false)
    }
  }

  // Handle @mention input detection
  const handleTextareaChange = (value: string) => {
    setNewMessage(value);
    
    if (!textareaRef.current) return;
    
    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    
    // Check for @mention patterns
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z\s]*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1].trim();
      setShowMentionDropdown(true);
      setMentionQuery(query);
      setCursorPosition(cursorPos);
      
      // Search both users and leads in real-time
      if (query.length > 0) {
        searchLeads(query);
      }
    } else {
      setShowMentionDropdown(false);
      setMentionQuery("");
    }
  };

  // Insert mention into textarea
  const insertMention = (item: User | Lead, type: 'users' | 'leads') => {
    if (!textareaRef.current) return;
    
    const beforeCursor = newMessage.substring(0, cursorPosition);
    const afterCursor = newMessage.substring(cursorPosition);
    
    let replacement = '';
    if (type === 'users') {
      const user = item as User;
      replacement = `@${user.name || user.email}`;
    } else {
      const lead = item as Lead;
      const leadName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.email || 'Unknown Lead';
      replacement = `@${leadName}`;
    }
    
    const beforeAt = beforeCursor.replace(/@[a-zA-Z\s]*$/, '');
    const newValue = `${beforeAt}${replacement} ${afterCursor}`;
    const newCursorPos = beforeAt.length + replacement.length + 1;
    
    setNewMessage(newValue);
    setShowMentionDropdown(false);
    setMentionQuery("");
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Filter users based on mention query
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Filter leads based on mention query
  const filteredLeads = leads.filter(lead => 
    `${lead.firstName || ''} ${lead.lastName || ''}`.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    lead.email?.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Save messages to localStorage
  const saveMessages = (newMessages: BulletinMessage[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages))
    } catch (error) {
      console.error("Error saving messages:", error)
    }
  }

  // Handle reaction toggle
  const toggleReaction = (messageId: string) => {
    if (!session?.user?.id) return;

    setMessages(prev => {
      const updatedMessages = prev.map(message => {
        if (message.id === messageId) {
          const reactions = message.reactions || {};
          const hasReacted = reactions[session.user.id!];
          
          if (hasReacted) {
            // Remove reaction
            const { [session.user.id!]: removed, ...rest } = reactions;
            return { ...message, reactions: rest };
          } else {
            // Add reaction
            return { 
              ...message, 
              reactions: { ...reactions, [session.user.id!]: '❤️' }
            };
          }
        }
        return message;
      });
      
      // Save to localStorage
      saveMessages(updatedMessages);
      return updatedMessages;
    });
  };

  // Submit reply
  const submitReply = async (messageId: string) => {
    if (!replyContent.trim() || !session?.user) return;

    setIsSubmittingReply(true);
    try {
      const newReply: Reply = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        content: replyContent.trim(),
        createdAt: new Date().toISOString(),
        user: {
          id: session.user.id || 'unknown',
          name: session.user.name,
          email: session.user.email || 'unknown@example.com'
        }
      };

      setMessages(prev => {
        const updatedMessages = prev.map(message => {
          if (message.id === messageId) {
            const replies = message.replies || [];
            return { ...message, replies: [newReply, ...replies] };
          }
          return message;
        });
        
        // Save to localStorage
        saveMessages(updatedMessages);
        return updatedMessages;
      });

      setReplyContent("");
      setReplyingTo(null);
      
      toast({
        title: "Reply Posted",
        description: "Your reply has been added.",
      });
    } catch (error) {
      toast({
        title: "Error Posting Reply",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Submit new message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message before submitting.",
        variant: "destructive"
      })
      return
    }

    if (!session?.user) {
      toast({
        title: "Not signed in",
        description: "Please sign in to post messages.",
        variant: "destructive"
      })
      return
    }
    
    setIsSubmitting(true)
    try {
      // Find lead mentions in the message and extract lead info
      let leadId = undefined;
      let leadName = undefined;
      
      // Check if any of the leads in our current list are mentioned
      for (const lead of leads) {
        const leadFullName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
        const leadDisplayName = leadFullName || lead.email || 'Unknown Lead';
        
        if (newMessage.includes(`@${leadDisplayName}`)) {
          leadId = lead.id;
          leadName = leadDisplayName;
          console.log('Found lead mention:', { leadId, leadName, leadDisplayName });
          break;
        }
      }

      const newMessageData: BulletinMessage = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        content: newMessage.trim(),
        createdAt: new Date().toISOString(),
        user: {
          id: session.user.id || 'unknown',
          name: session.user.name,
          email: session.user.email || 'unknown@example.com'
        },
        ...(leadId && leadName && {
          leadId,
          leadName
        }),
        reactions: {},
        replies: [],
        readBy: [], // Mark as unread for the current user
        category: activeTab
      }

      console.log('Message data:', newMessageData);

      const updatedMessages = [newMessageData, ...messages]
      setMessages(updatedMessages)
      saveMessages(updatedMessages)
      setNewMessage("")
      setShowMentionDropdown(false)
      setMentionQuery("")
      // Keep the current tab active after posting
      
      // Dispatch custom event to notify sidebar of new message
      window.dispatchEvent(new CustomEvent('bulletin-board-updated'));
      
      toast({
        title: "Message Posted",
        description: "Your message has been posted to the bulletin board.",
      })
    } catch (error) {
      toast({
        title: "Error Posting Message",
        description: "Failed to post message. Please try again.",
        variant: "destructive",
      })
      console.error("Error posting message:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render message content with @mention highlighting and lead links
  const renderMessageContent = (content: string, leadId?: string, leadName?: string) => {
    let processedContent = content
    
    // Use a more precise regex that only captures the mention name (stops at word boundaries)
    const mentionRegex = /@([a-zA-Z]+(?:\s+[a-zA-Z]+)*)(?=\s|$)/g
    const parts = processedContent.split(mentionRegex)
    
    return parts.map((part, index) => {
      if (index % 2 === 1) { // This is a mention
        // Check if this mention matches a lead by comparing with the stored lead name
        const isLeadMention = leadId && leadName && part.trim() === leadName.trim();
        
        console.log('Mention check:', {
          part: part.trim(),
          leadName: leadName?.trim(),
          leadId,
          isLeadMention
        });
        
        if (isLeadMention) {
          return (
            <a
              key={index}
              href={`/leads/${leadId}`}
              className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1 rounded hover:bg-green-200 dark:hover:bg-green-800/30 underline cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/leads/${leadId}`;
              }}
            >
              @{part}
            </a>
          )
        } else {
          return (
            <span key={index} className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1 rounded">
              @{part}
            </span>
          )
        }
      }
      return part
    })
  }

  // Filter messages based on active tab
  const filteredMessages = messages.filter(message => {
    return message.category === activeTab;
  });

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full max-w-[400px] sm:max-w-[540px] md:max-w-[600px] lg:max-w-[700px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MessageSquare className="h-5 w-5" />
            Bulletin Board
            <Badge variant="secondary" className="ml-auto text-xs">
              {messages.length} messages
            </Badge>
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          {/* Add New Message */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <AtSign className="h-4 w-4 text-muted-foreground" />
                Post a Message
                <span className="hidden sm:inline text-xs font-normal text-muted-foreground">
                  Use @ to mention team members or search leads
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <form onSubmit={handleSubmit} className="space-y-3">
                
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Share something with the team... Use @ to mention or search"
                    value={newMessage}
                    onChange={(e) => handleTextareaChange(e.target.value)}
                    className="min-h-[80px] sm:min-h-[100px] resize-none pr-12 text-sm"
                    disabled={isSubmitting}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape' && showMentionDropdown) {
                        setShowMentionDropdown(false);
                        setMentionQuery("");
                      }
                    }}
                  />
                  
                  {/* @Mention Dropdown */}
                  {showMentionDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {/* Team Members Section */}
                      {filteredUsers.length > 0 && (
                        <>
                          <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                            Team Members
                          </div>
                          {filteredUsers.slice(0, 3).map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => insertMention(user, 'users')}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <AtSign className="h-4 w-4 text-muted-foreground" />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium truncate">{user.name || user.email}</div>
                                {user.name && (
                                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                                )}
                              </div>
                            </button>
                          ))}
                        </>
                      )}
                      
                      {/* Leads Section */}
                      <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                        Leads
                      </div>
                      {isLoadingLeads ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Searching leads...
                        </div>
                      ) : filteredLeads.length > 0 ? (
                        filteredLeads.slice(0, 5).map((lead) => (
                          <button
                            key={lead.id}
                            type="button"
                            onClick={() => insertMention(lead, 'leads')}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Link className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">
                                {`${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unnamed Lead'}
                              </div>
                              {lead.email && (
                                <div className="text-xs text-muted-foreground truncate">{lead.email}</div>
                              )}
                            </div>
                          </button>
                        ))
                      ) : mentionQuery.length > 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No leads found
                        </div>
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          Type to search leads...
                        </div>
                      )}
                    </div>
                  )}
                  
                  <Button
                    type="submit"
                    size="sm"
                    className="absolute bottom-2 right-2 h-8 w-8 p-0"
                    disabled={!newMessage.trim() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Category Tabs */}
          <Tabs value={activeTab} onValueChange={(value: 'general' | 'production' | 'purlin') => setActiveTab(value)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="production">Production</TabsTrigger>
              <TabsTrigger value="purlin">Purlin</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Messages List */}
          <div className="space-y-3 sm:space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No messages in {activeTab}</p>
                <p className="text-sm">Be the first to post something!</p>
              </div>
            ) : (
              filteredMessages.map((message) => (
                <Card key={message.id} className={`border-l-4 shadow-sm ${
                  message.readBy?.includes(session?.user?.id || '') 
                    ? 'border-l-blue-500' 
                    : 'border-l-lime-500'
                }`}>
                  <CardContent className="pt-3 sm:pt-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">
                            {message.user.name || message.user.email}
                          </span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </span>
                          {message.category && (
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${MESSAGE_CATEGORIES.find(c => c.value === message.category)?.color}`}
                            >
                              {MESSAGE_CATEGORIES.find(c => c.value === message.category)?.label}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {renderMessageContent(message.content, message.leadId, message.leadName)}
                        </div>
                        
                        {/* Message Actions */}
                        <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t">
                          {/* Reactions */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleReaction(message.id)}
                            className={`h-7 sm:h-8 px-2 gap-1 ${
                              message.reactions?.[session?.user?.id || ''] ? 'text-red-500' : 'text-muted-foreground'
                            }`}
                          >
                            <Heart className={`h-3 w-3 sm:h-4 sm:w-4 ${message.reactions?.[session?.user?.id || ''] ? 'fill-current' : ''}`} />
                            {Object.keys(message.reactions || {}).length > 0 && (
                              <span className="text-xs">{Object.keys(message.reactions || {}).length}</span>
                            )}
                          </Button>
                          
                          {/* Reply Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReplyingTo(replyingTo === message.id ? null : message.id)}
                            className="h-7 sm:h-8 px-2 gap-1 text-muted-foreground"
                          >
                            <Reply className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="text-xs hidden sm:inline">Reply</span>
                          </Button>
                          
                          {/* More Actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                                <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(message.content)}>
                                Copy message
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        {/* Reply Input */}
                        {replyingTo === message.id && (
                          <div className="mt-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                            <div className="flex-1 min-w-0">
                              <Textarea
                                ref={replyTextareaRef}
                                placeholder="Write a reply..."
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                className="min-h-[50px] sm:min-h-[60px] resize-none text-sm"
                                disabled={isSubmittingReply}
                              />
                              <div className="flex items-center gap-2 mt-2">
                                <Button
                                  size="sm"
                                  onClick={() => submitReply(message.id)}
                                  disabled={!replyContent.trim() || isSubmittingReply}
                                  className="h-7 px-2 text-xs"
                                >
                                  {isSubmittingReply ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Send className="h-3 w-3" />
                                  )}
                                  Reply
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyContent("");
                                  }}
                                  className="h-7 px-2 text-xs"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Replies */}
                        {message.replies && message.replies.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.replies.map((reply) => (
                              <div key={reply.id} className="pl-3 sm:pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-xs truncate">
                                      {reply.user.name || reply.user.email}
                                    </span>
                                    <span className="text-xs text-muted-foreground flex-shrink-0">
                                      {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                    </span>
                                  </div>
                                  <div className="text-sm text-muted-foreground break-words">
                                    {reply.content}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}