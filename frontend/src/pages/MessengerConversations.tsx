import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Badge, Input } from '../components/ui/Base';
import { messagingApi } from '../services/api';
import { MessageCircle, Clock, User, Bot, Send, RefreshCw, Hand, ArrowLeft, Search } from 'lucide-react';
import { cn } from '../utils/cn';

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const MessengerIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C5.373 2 0 6.116 0 11.377c0 2.85 1.19 5.423 3.108 7.384l-.536 2.364 2.712-1.417c.925.309 1.91.473 2.916.473 6.627 0 12-4.116 12-9.377S18.627 2 12 2zm-1.412 5.382l-2.353 2.353a.618.618 0 01-.247.1l.353 2.117 2.247-1.178a.618.618 0 01.247-.1l1.941 1.559-1.941-2.353-1.647-.498z"/>
  </svg>
);

const getPlatformConfig = (platform: string): { icon: React.ReactNode; color: string; bg: string } => {
  const p = platform?.toLowerCase() || 'facebook';
  switch (p) {
    case 'facebook':
      return { icon: <FacebookIcon className="w-5 h-5" />, color: 'text-blue-500', bg: 'bg-blue-500/10' };
    case 'instagram':
      return { icon: <InstagramIcon className="w-5 h-5" />, color: 'text-pink-500', bg: 'bg-pink-500/10' };
    case 'whatsapp':
      return { icon: <WhatsAppIcon className="w-5 h-5" />, color: 'text-green-500', bg: 'bg-green-500/10' };
    case 'messenger':
      return { icon: <MessengerIcon className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-400/10' };
    default:
      return { icon: <MessageCircle className="w-5 h-5" />, color: 'text-gray-400', bg: 'bg-white/5' };
  }
};

interface Message {
  id: string;
  sender: 'customer' | 'ai' | 'admin';
  sender_id?: string;
  sender_name?: string;
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  platform_user_id: string;
  platform: string;
  customer_name: string;
  customer_phone?: string;
  profile_pic?: string;
  status: string;
  ai_mode: boolean;
  assigned_to?: string;
  last_message?: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export const MessengerConversations: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchConversations();
    startPolling();
    return () => stopPolling();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchConversationDetails(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  const startPolling = () => {
    pollIntervalRef.current = setInterval(() => {
      fetchConversations(false);
      if (selectedConversation) {
        fetchConversationDetails(selectedConversation.id);
      }
    }, 5000);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
  };

  const fetchConversations = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await messagingApi.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchConversationDetails = async (id: string) => {
    try {
      const data = await messagingApi.getConversation(id);
      setSelectedConversation(data);
    } catch (err) {
      console.error('Failed to fetch conversation:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchConversations();
      return;
    }
    try {
      const results = await messagingApi.searchConversations(searchQuery);
      setConversations(results);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleTakeOver = async () => {
    if (!selectedConversation) return;
    try {
      await messagingApi.takeOver(selectedConversation.id);
      setSelectedConversation({ ...selectedConversation, ai_mode: false });
      fetchConversations(false);
    } catch (err) {
      console.error('Takeover failed:', err);
    }
  };

  const handleReturnToAI = async () => {
    if (!selectedConversation) return;
    try {
      await messagingApi.returnToAI(selectedConversation.id);
      setSelectedConversation({ ...selectedConversation, ai_mode: true });
      fetchConversations(false);
    } catch (err) {
      console.error('Return to AI failed:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !messageInput.trim()) return;
    setSending(true);
    try {
      await messagingApi.sendMessage(selectedConversation.id, messageInput);
      setMessageInput('');
      fetchConversationDetails(selectedConversation.id);
    } catch (err) {
      console.error('Send failed:', err);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getPlatformIcon = (platform: string) => getPlatformConfig(platform).icon;
  const getPlatformColor = (platform: string) => getPlatformConfig(platform).bg + ' ' + getPlatformConfig(platform).color;

  return (
    <div className="pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Unified inbox</h1>
          <p className="font-mono text-sm text-muted-foreground mt-1">Multi-channel communication hub</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button variant="secondary" size="icon" onClick={() => fetchConversations()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations list */}
        <div className="lg:col-span-1 space-y-4">
          <p className="font-mono text-xs text-muted-foreground px-1 mb-2">Active channels</p>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-border border-t-[var(--color-accent)] animate-spin" />
              <p className="font-mono text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : conversations.length === 0 ? (
            <Card className="py-12 text-center border-2 border-dashed border-border">
               <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
               <p className="font-mono text-sm text-muted-foreground">No conversations</p>
            </Card>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={cn(
                  "p-5 rounded-xl border-2 transition-colors duration-150 cursor-pointer relative",
                  selectedConversation?.id === conv.id
                    ? 'bg-[var(--color-paper-3)] border-[var(--color-accent)]/30'
                    : 'bg-card border-border hover:border-[var(--color-border-hover)]'
                )}
              >
                {selectedConversation?.id === conv.id && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--color-accent)]" />}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", getPlatformColor(conv.platform))}>
                      {getPlatformIcon(conv.platform)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{conv.customer_name}</p>
                      <p className="font-mono text-xs text-muted-foreground mt-0.5">{formatDate(conv.updated_at)}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "w-2 h-2 rounded-sm",
                    conv.ai_mode ? "bg-[var(--color-accent)]" : "bg-[var(--color-warning)]"
                  )} />
                </div>
                <p className="font-mono text-xs text-muted-foreground truncate">
                  {conv.last_message || 'No messages'}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Conversation detail */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <Card className="h-[700px] flex flex-col p-0 overflow-hidden relative">
              {/* Header */}
              <div className="p-6 border-b border-border bg-[var(--color-paper-2)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", getPlatformColor(selectedConversation.platform))}>
                      {getPlatformIcon(selectedConversation.platform)}
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-foreground tracking-tight">{selectedConversation.customer_name}</h2>
                      <div className="flex items-center gap-3 mt-0.5">
                        <Badge variant={selectedConversation.ai_mode ? 'primary' : 'warning'}>
                           {selectedConversation.ai_mode ? 'AI active' : 'Human operator'}
                        </Badge>
                        <span className="font-mono text-xs text-muted-foreground">ID: {selectedConversation.platform_user_id}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setSelectedConversation(null)} className="gap-2">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                    {selectedConversation.ai_mode ? (
                      <Button variant="primary" size="sm" onClick={handleTakeOver} className="gap-2">
                        <Hand className="w-4 h-4" /> Take over
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={handleReturnToAI} className="gap-2 border-[var(--color-accent)] text-[var(--color-accent)]">
                        <Bot className="w-4 h-4" /> Return to AI
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {selectedConversation.messages?.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-20">
                    <MessageCircle className="w-12 h-12 mb-3" />
                    <p className="font-mono text-xs">No messages yet</p>
                  </div>
                )}
                {selectedConversation.messages?.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className={cn(
                      "flex gap-4",
                      msg.sender === 'customer' ? 'flex-row-reverse' : ''
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border-2",
                      msg.sender === 'customer' ? 'border-blue-500/30 bg-blue-500/10 text-blue-400' :
                      msg.sender === 'admin' ? 'border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                    )}>
                      {msg.sender === 'customer' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={cn("max-w-[75%] space-y-1")}>
                      <div className={cn(
                        "rounded-lg px-5 py-3 border-2 text-sm leading-relaxed",
                        msg.sender === 'customer'
                          ? 'bg-blue-500/5 text-foreground border-blue-500/10'
                          : msg.sender === 'admin'
                          ? 'bg-[var(--color-success)]/5 text-foreground border-[var(--color-success)]/10'
                          : 'bg-[var(--color-accent)]/5 text-foreground border-[var(--color-accent)]/10'
                      )}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <p className={cn(
                        "font-mono text-xs text-muted-foreground flex items-center gap-1",
                        msg.sender === 'customer' ? 'justify-end' : ''
                      )}>
                        <Clock className="w-2.5 h-2.5" />
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-6 border-t border-border bg-[var(--color-paper-2)]">
                <div className="flex gap-3 items-end">
                  <textarea
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                       if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                       }
                    }}
                    className="flex-1 bg-card border-2 border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-[var(--color-accent)] transition-all h-12 resize-none"
                    disabled={sending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={sending || !messageInput.trim()}
                    variant="primary"
                    className="w-12 h-12 p-0 shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-[700px] flex items-center justify-center border-2 border-dashed border-border">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-xl bg-[var(--color-paper-3)] border-2 border-border flex items-center justify-center mx-auto">
                   <MessageCircle className="w-8 h-8 text-muted-foreground opacity-30" />
                </div>
                <div>
                   <p className="font-black text-base text-foreground tracking-tight">No conversation selected</p>
                   <p className="font-mono text-sm text-muted-foreground mt-1">Select a channel to start</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
