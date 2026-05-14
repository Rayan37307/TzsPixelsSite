import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Badge, Input } from '../components/ui/Base';
import { messagingApi } from '../services/api';
import { MessageCircle, Clock, ChevronRight, User, Bot, Send, Phone, RefreshCw, Hand, ArrowLeft, Search } from 'lucide-react';
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
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
        fetchConversationDetails(selectedConversation.id, false);
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

  const fetchConversationDetails = async (id: string, showLoading = true) => {
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
      fetchConversationDetails(selectedConversation.id, false);
    } catch (err) {
      console.error('Send failed:', err);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const getPlatformIcon = (platform: string) => {
    return getPlatformConfig(platform).icon;
  };

  const getPlatformColor = (platform: string) => {
    return getPlatformConfig(platform).bg + ' ' + getPlatformConfig(platform).color;
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Unified <span className="text-primary italic">Inbox</span></h1>
          <p className="text-muted-foreground mt-2 font-medium tracking-wide">Multi-channel communication node.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-12 h-12 bg-white/[0.02]"
            />
          </div>
          <Button variant="secondary" onClick={() => fetchConversations()} className="h-12 w-12 p-0 rounded-2xl border-white/[0.05]">
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Conversations List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="px-2 mb-4">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Active Channels</h3>
          </div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 rounded-full border-t-2 border-primary animate-spin" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Syncing Hub...</p>
            </div>
          ) : conversations.length === 0 ? (
            <Card className="py-12 text-center bg-white/[0.01] border-dashed border-white/10 rounded-[2.5rem]">
               <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">No active transmissions</p>
            </Card>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={cn(
                  "p-6 rounded-[2rem] border transition-all duration-300 group cursor-pointer relative overflow-hidden",
                  selectedConversation?.id === conv.id
                    ? 'bg-[#1a1a1a] border-primary/30 shadow-2xl shadow-primary/5'
                    : 'bg-[#0d0d0d] border-white/[0.05] hover:border-white/20 hover:bg-white/[0.02]'
                )}
              >
                {selectedConversation?.id === conv.id && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-transform group-hover:scale-110", getPlatformColor(conv.platform))}>
                      {getPlatformIcon(conv.platform)}
                    </div>
                    <div>
                      <p className="font-black text-white text-base tracking-tight italic">{conv.customer_name}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{formatDate(conv.updated_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {conv.ai_mode ? (
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                    )}
                  </div>
                </div>
                <p className={cn(
                  "text-sm font-medium line-clamp-1 transition-colors",
                  selectedConversation?.id === conv.id ? "text-white" : "text-muted-foreground group-hover:text-white/80"
                )}>
                  {conv.last_message || 'No messages received'}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Conversation Detail */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <Card className="h-[750px] flex flex-col bg-[#0d0d0d] border-white/[0.05] rounded-[3rem] overflow-hidden shadow-2xl relative">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-transparent opacity-50" />
              
              {/* Header */}
              <div className="p-8 border-b border-white/[0.03] bg-black/[0.1]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className={cn("w-14 h-14 rounded-[1.5rem] flex items-center justify-center shadow-xl", getPlatformColor(selectedConversation.platform))}>
                      {getPlatformIcon(selectedConversation.platform)}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white italic tracking-tight">{selectedConversation.customer_name}</h2>
                      <div className="flex items-center gap-4 mt-1">
                        <Badge variant={selectedConversation.ai_mode ? 'primary' : 'warning'} className="px-2 py-0.5 rounded-md">
                           {selectedConversation.ai_mode ? 'Neural Core Active' : 'Human Operator'}
                        </Badge>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">ID: {selectedConversation.platform_user_id}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="secondary" className="h-11 px-6 rounded-xl border-white/5 font-black text-[10px] uppercase tracking-widest" onClick={() => setSelectedConversation(null)}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Close Hub
                    </Button>
                    {selectedConversation.ai_mode ? (
                      <Button variant="premium" className="h-11 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest" onClick={handleTakeOver}>
                        <Hand className="w-4 h-4 mr-2" />
                        Take Over
                      </Button>
                    ) : (
                      <Button variant="outline" className="h-11 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/5" onClick={handleReturnToAI}>
                        <Bot className="w-4 h-4 mr-2" />
                        Return to AI
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-10 space-y-8 scroll-smooth">
                {selectedConversation.messages?.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-20">
                    <MessageCircle className="w-16 h-16 mb-4" />
                    <p className="font-black uppercase tracking-widest text-xs">Awaiting data stream</p>
                  </div>
                )}
                {selectedConversation.messages?.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className={cn(
                      "flex gap-5 group animate-in fade-in slide-in-from-bottom-2 duration-500",
                      msg.sender === 'customer' ? 'flex-row-reverse' : ''
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110",
                      msg.sender === 'customer' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                      msg.sender === 'admin' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-primary/10 text-primary border border-primary/20'
                    )}>
                      {msg.sender === 'customer' ? (
                        <User className="w-5 h-5" />
                      ) : (
                        <Bot className="w-5 h-5" />
                      )}
                    </div>
                    <div className={cn(
                      "max-w-[75%] space-y-2",
                      msg.sender === 'customer' ? 'items-end' : 'items-start'
                    )}>
                      <div className={cn(
                        "rounded-[1.75rem] px-6 py-4 shadow-2xl relative",
                        msg.sender === 'customer'
                          ? 'bg-blue-500/5 text-white border border-blue-500/10'
                          : msg.sender === 'admin'
                          ? 'bg-emerald-500/5 text-white border border-emerald-500/10'
                          : 'bg-primary/5 text-white border border-primary/10'
                      )}>
                        <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <p className={cn(
                        "text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50 flex items-center gap-1.5 px-2",
                        msg.sender === 'customer' ? 'flex-row-reverse' : ''
                      )}>
                        <Clock className="w-2.5 h-2.5" />
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-8 border-t border-white/[0.03] bg-black/[0.1]">
                <div className="flex gap-4 p-2 bg-white/[0.02] border border-white/[0.05] rounded-[2rem] focus-within:border-primary/50 transition-all shadow-inner">
                  <textarea
                    placeholder="Type a secure message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                       if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                       }
                    }}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-white font-medium py-3 px-6 h-12 resize-none"
                    disabled={sending}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={sending || !messageInput.trim()}
                    variant="premium"
                    className="h-12 w-12 p-0 rounded-2xl shadow-lg"
                  >
                    <Send className="w-5 h-5 rotate-45 -translate-y-0.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-[750px] flex items-center justify-center bg-[#0d0d0d] border-white/[0.05] border-dashed rounded-[3rem]">
              <div className="text-center space-y-6">
                <div className="w-24 h-24 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mx-auto shadow-2xl group hover:border-primary/30 transition-all duration-500">
                   <MessageCircle className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors opacity-30 group-hover:opacity-100" />
                </div>
                <div>
                   <p className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Stream Standby</p>
                   <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest mt-2">Select a vector to begin communication</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
