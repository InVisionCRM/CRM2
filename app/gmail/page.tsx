"use client"

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, Search, Users, Paperclip } from "lucide-react";
import { Lead } from "@prisma/client";

interface GmailMessageMeta {
  id: string;
  threadId: string;
  snippet: string;
  payloadHeaders?: Record<string, string>;
  internalDate?: string;
  labelIds?: string[];
}

export default function GmailPage() {
  const PAGE_SIZE = 20;

  const [messages, setMessages] = useState<GmailMessageMeta[]>([]);
  const [activeCategory, setActiveCategory] = useState<'primary' | 'promotions' | 'social'>('primary');
  const [nextToken, setNextToken] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadMessages = async (reset = false) => {
    setIsLoading(true);
    const params = new URLSearchParams({ maxResults: String(PAGE_SIZE) });
    if (!reset && nextToken) params.set('pageToken', nextToken);
    const res = await fetch(`/api/gmail/messages?${params.toString()}`);
    const json = await res.json();
    if (json.success) {
      setMessages(prev => (reset ? json.messages : [...prev, ...json.messages]));
      setNextToken(json.nextPageToken);
    }
    setIsLoading(false);
  };

  // initial load
  useEffect(() => {
    loadMessages(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = () => loadMessages(true);

  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSelectMessage = async (msgId: string) => {
    const res = await fetch(`/api/gmail/messages/${msgId}`);
    const json = await res.json();
    if (json.success) {
      setSelectedMessage(json);
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    const res = await fetch("/api/gmail/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: composeTo, subject: composeSubject, text: composeBody, cc: composeCc }),
    });
    setIsSending(false);
    if (res.ok) {
      setIsComposeOpen(false);
      setComposeBody("");
      refresh();
    }
  };

  // Filter messages based on active category
  const filteredMessages = messages.filter((msg) => {
    const labels = msg.labelIds || [];
    switch (activeCategory) {
      case 'promotions':
        return labels.includes('CATEGORY_PROMOTIONS');
      case 'social':
        return labels.includes('CATEGORY_SOCIAL');
      case 'primary':
      default:
        return !labels.includes('CATEGORY_PROMOTIONS') && !labels.includes('CATEGORY_SOCIAL');
    }
  });

  // Lead picker state
  const [isLeadPickerOpen, setIsLeadPickerOpen] = useState(false);
  const [leadQuery, setLeadQuery] = useState('');
  const [leadResults, setLeadResults] = useState<Lead[]>([]);

  const { data: session } = useSession();

  const searchLeads = async (term: string) => {
    const res = await fetch(`/api/leads/search?query=${encodeURIComponent(term)}`);
    const json = await res.json();
    if (Array.isArray(json)) {
      setLeadResults(json);
    }
  };

  useEffect(() => {
    if (isLeadPickerOpen) {
      searchLeads(leadQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadQuery, isLeadPickerOpen]);

  const [attachments, setAttachments] = useState<File[]>([]);

  const handleFileAttach = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    setAttachments((prev) => [...prev, ...arr]);
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Org picker states
  interface OrgUser { id: string; name: string | null; email: string }
  const [isOrgPickerOpen, setIsOrgPickerOpen] = useState(false)
  const [orgQuery, setOrgQuery] = useState('')
  const [orgResults, setOrgResults] = useState<OrgUser[]>([])

  const searchOrgUsers = async (term: string) => {
    const res = await fetch(`/api/org-users/search?query=${encodeURIComponent(term)}`)
    const json = await res.json()
    if (Array.isArray(json)) setOrgResults(json)
  }

  useEffect(() => {
    if (isOrgPickerOpen) {
      searchOrgUsers(orgQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgQuery, isOrgPickerOpen])

  // Lead/User Picker dialog modifications
  const [activeTab, setActiveTab] = useState<'Leads' | 'Users'>('Leads');
  const [userResults, setUserResults] = useState<OrgUser[]>([]);

  const searchUsers = async (term: string) => {
    const res = await fetch(`/api/org-users/search?query=${encodeURIComponent(term)}`);
    const json = await res.json();
    if (Array.isArray(json)) {
      setUserResults(json);
    }
  };

  useEffect(() => {
    if (isLeadPickerOpen) {
      searchUsers(orgQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgQuery, isLeadPickerOpen]);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto bg-black/90 rounded-lg overflow-x-hidden">
      {/* Search input placeholder */}
      <div className="flex mb-4 gap-2 max-w-md">
        <Input placeholder="Search emails" disabled />
        <Button variant="outline" size="icon" disabled>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b mb-2 text-sm font-medium">
        {['primary', 'promotions', 'social'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat as any)}
            className={`flex-1 pb-2 text-center capitalize transition-colors ${
              activeCategory === cat ? 'border-b-2 border-blue-500 text-blue-500 dark:border-blue-400 dark:text-blue-400' : 'text-muted-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      {messages.length === 0 && <p className="text-muted-foreground">No messages found.</p>}

      <div className="grid gap-2">
        {filteredMessages.map((msg) => (
          <Card
            key={msg.id}
            className="cursor-pointer hover:bg-gray-800/60 dark:hover:bg-gray-700/50 transition-colors"
            onClick={() => handleSelectMessage(msg.id)}
          >
            <CardHeader className="flex-row items-center gap-3 p-3">
              {/* Avatar */}
              <div className="h-9 w-9 flex items-center justify-center rounded-full bg-blue-600 text-white flex-shrink-0 uppercase text-sm font-semibold">
                {(() => {
                  const from = msg.payloadHeaders?.From || '';
                  const match = from.match(/^(.*?)(<|$)/);
                  const name = match ? match[1].trim() : from;
                  return name ? name.charAt(0) : '?';
                })()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-semibold truncate">
                    {msg.payloadHeaders?.From?.replace(/<.*>/, '').trim() || 'Unknown Sender'}
                  </CardTitle>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {(() => {
                      if (!msg.internalDate) return ''
                      const dateObj = new Date(Number(msg.internalDate))
                      const now = new Date()
                      const diffMs = now.getTime() - dateObj.getTime()
                      const diffHours = diffMs / (1000 * 60 * 60)
                      if (diffHours < 24) {
                        // show time e.g. 1:01 AM
                        return dateObj.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
                      }
                      // older – show Jun 12
                      return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    })()}
                  </span>
                </div>
                <div className="text-sm font-medium break-words sm:truncate">
                  {msg.payloadHeaders?.Subject || '(No Subject)'}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-2 sm:line-clamp-1">
                  {msg.snippet}
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {nextToken && (
        <div className="flex justify-center mt-4">
          <Button onClick={() => loadMessages()} disabled={isLoading} variant="outline">
            {isLoading ? 'Loading…' : 'Load More'}
          </Button>
        </div>
      )}

      {/* Floating Compose */}
      <Button
        onClick={() => setIsComposeOpen(true)}
        className="fixed bottom-40 right-6 md:bottom-20 md:right-8 shadow-3xl shadow-blue-800/50 border-4 border-white/40 dark:border-white/30 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3 flex items-center gap-2"
      >
        <Send className="h-4 w-4" /> Compose
      </Button>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.message?.payload?.headers?.find((h: any) => h.name === "Subject")?.value}</DialogTitle>
            <DialogDescription>
              From: {selectedMessage?.message?.payload?.headers?.find((h: any) => h.name === "From")?.value}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto prose prose-invert">
            {/* Display plain text body */}
            <pre className="whitespace-pre-wrap break-words">
              {(() => {
                const parts = selectedMessage?.message?.payload?.parts || [];
                for (const part of parts) {
                  if (part.mimeType === "text/plain" && part.body?.data) {
                    return atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
                  }
                }
                return "(No plain text body)";
              })()}
            </pre>

            {selectedMessage?.parsed && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Parsed Contact Info</h3>
                <ul className="list-disc list-inside text-sm">
                  <li>Emails: {selectedMessage.parsed.emails.join(", ") || "-"}</li>
                  <li>Phones: {selectedMessage.parsed.phoneNumbers.join(", ") || "-"}</li>
                  <li>Addresses: {selectedMessage.parsed.addresses.join(" | ") || "-"}</li>
                </ul>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Compose Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-lg h-[70vh] overflow-y-auto [&>button.absolute]:hidden">
          <div className="flex items-center justify-end pb-2">
            <div className="flex items-center gap-2">
              <button title="Attach files" aria-label="Attach files" onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-white/10 rounded">
                <Paperclip className="h-4 w-4" />
              </button>
              <button title="Send" aria-label="Send" onClick={handleSend} disabled={isSending || !composeTo} className="p-2 hover:bg-white/10 rounded disabled:opacity-50">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="To"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={() => setIsLeadPickerOpen(true)} size="icon">
                  <Users className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Cc"
                  value={composeCc}
                  onChange={(e) => setComposeCc(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={() => setIsOrgPickerOpen(true)}>
                  <Users className="h-4 w-4" />
                </Button>
              </div>
              <Input
                placeholder="Subject"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
              />
              {session?.user?.email && (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="font-medium">From</span> {session.user.email}
                </div>
              )}
              <Textarea
                placeholder="Body"
                rows={16}
                className="min-h-[400px]"
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
              />
            </div>
          </div>
          <input type="file" multiple hidden ref={fileInputRef} onChange={(e) => handleFileAttach(e.target.files)} />
          {attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-lime-400">
              {attachments.map((f, i) => (
                <span key={i}>{f.name}</span>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lead/User Picker Dialog */}
      <Dialog open={isLeadPickerOpen} onOpenChange={setIsLeadPickerOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Select Recipient</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {/* Tabs */}
            <div className="flex border-b border-white/20 mb-2 text-sm">
              {['Leads', 'Users'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as 'Leads' | 'Users')}
                  className={`flex-1 py-2 capitalize ${activeTab===tab ? 'border-b-2 border-lime-400 text-lime-400' : 'text-muted-foreground'}`}
                >{tab}</button>
              ))}
            </div>

            <Input
              placeholder={`Search ${activeTab.toLowerCase()}...`}
              value={leadQuery}
              onChange={(e) => setLeadQuery(e.target.value)}
            />

            <div className="max-h-60 overflow-y-auto divide-y divide-white/10 rounded-md border border-white/20 bg-black/70 backdrop-blur">
              {activeTab==='Leads' ? (
                leadResults.length ? leadResults.map((lead)=> (
                  <button key={lead.id} onClick={() => { if(lead.email){setComposeTo(lead.email);} setIsLeadPickerOpen(false) }} className="w-full text-left px-3 py-2 hover:bg-lime-600/20 hover:text-lime-300 transition-colors text-white">
                    <div className="font-medium">{lead.firstName} {lead.lastName}</div>
                    <div className="text-xs text-muted-foreground">{lead.email}</div>
                  </button>
                )) : <p className="p-3 text-sm text-lime-400">No leads found.</p>
              ) : (
                userResults.length ? userResults.map(u=> (
                  <button key={u.id} onClick={() => { setComposeTo(u.email); setIsLeadPickerOpen(false) }} className="w-full text-left px-3 py-2 hover:bg-lime-600/20 hover:text-lime-300 transition-colors text-white">
                    <div className="font-medium">{u.name || u.email}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </button>
                )) : <p className="p-3 text-sm text-lime-400">No users found.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Org Picker Dialog */}
      <Dialog open={isOrgPickerOpen} onOpenChange={setIsOrgPickerOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Select Org Recipient</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input
              placeholder="Search org users..."
              value={orgQuery}
              onChange={(e) => setOrgQuery(e.target.value)}
            />
            <div className="max-h-60 overflow-y-auto divide-y divide-white/10 rounded-md border border-white/20 bg-black/70 backdrop-blur">
              {orgResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setComposeCc((prev) => prev ? prev + ', ' + user.email : user.email)
                    setIsOrgPickerOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-lime-600/20 hover:text-lime-300 transition-colors text-white"
                >
                  <div className="font-medium">{user.name || user.email}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </button>
              ))}
              {orgResults.length === 0 && (
                <p className="p-3 text-sm text-lime-400">No users found.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 