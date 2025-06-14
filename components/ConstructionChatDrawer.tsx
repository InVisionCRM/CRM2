"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, Send, Bot, User, MessageSquare, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ConstructionChatDrawerProps {
  children: React.ReactNode
}

export function ConstructionChatDrawer({ children }: ConstructionChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your construction AI assistant specializing in roofing, siding, and contracting in Southeast Michigan. How can I help you today?',
      timestamp: new Date().toISOString()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Prepare conversation history (last 10 messages for context)
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const response = await fetch('/api/ai/construction-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: Date.now().toString() + '_assistant',
        role: 'assistant',
        content: data.message,
        timestamp: data.timestamp || new Date().toISOString()
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Chat error:', error)
      
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        role: 'assistant',
        content: error instanceof Error 
          ? `I'm sorry, I encountered an error: ${error.message}. Please try again.`
          : 'I\'m sorry, something went wrong. Please try again.',
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, errorMessage])
      
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[400px] md:w-[500px] p-0 bg-black/95 backdrop-blur-xl border-white/20 text-white flex flex-col"
      >
        <SheetHeader className="px-6 py-4 border-b border-white/20 bg-black/50">
          <SheetTitle className="flex items-center gap-2 text-white">
            <div className="p-2 rounded-lg bg-[#59ff00]/20">
              <Wrench className="h-5 w-5 text-[#59ff00]" />
            </div>
            Construction AI Assistant
          </SheetTitle>
        </SheetHeader>

        {/* Chat Messages */}
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea ref={scrollAreaRef} className="flex-1 px-6 py-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 max-w-full",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8 bg-[#59ff00]/20 border border-[#59ff00]/30">
                      <AvatarFallback className="bg-transparent">
                        <Bot className="h-4 w-4 text-[#59ff00]" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={cn(
                      "rounded-lg px-4 py-2 max-w-[85%] sm:max-w-[80%]",
                      message.role === 'user'
                        ? 'bg-[#59ff00] text-black'
                        : 'bg-white/10 text-white border border-white/20'
                    )}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    <div className={cn(
                      "text-xs mt-1 opacity-70",
                      message.role === 'user' ? 'text-black/70' : 'text-white/70'
                    )}>
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8 bg-white/10 border border-white/20">
                      <AvatarFallback className="bg-transparent">
                        <User className="h-4 w-4 text-white" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-8 w-8 bg-[#59ff00]/20 border border-[#59ff00]/30">
                    <AvatarFallback className="bg-transparent">
                      <Bot className="h-4 w-4 text-[#59ff00]" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white/10 border border-white/20 rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#59ff00]" />
                      <span className="text-sm text-white/70">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="px-6 py-4 border-t border-white/20 bg-black/50">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about roofing, siding, codes, estimates..."
                disabled={isLoading}
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#59ff00] focus:ring-[#59ff00]/20"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="icon"
                className="bg-[#59ff00] hover:bg-[#59ff00]/90 text-black shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-white/50 mt-2">
              Specialized in Southeast Michigan construction practices
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 