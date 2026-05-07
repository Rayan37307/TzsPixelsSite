import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Badge, Input } from '../components/ui/Base';
import { messagingApi } from '../services/api';
import { MessageCircle, Clock, ChevronRight, User, Bot, Send, Phone, MapPin, RefreshCw, Hand, ArrowLeft } from 'lucide-react';

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
      return { icon: <FacebookIcon className="w-5 h-5" />, color: 'text-blue-500', bg: 'bg-blue-500/20' };
    case 'instagram':
      return { icon: <InstagramIcon className="w-5 h-5" />, color: 'text-pink-500', bg: 'bg-pink-500/20' };
    case 'whatsapp':
      return { icon: <WhatsAppIcon className="w-5 h-5" />, color: 'text-green-500', bg: 'bg-green-500/20' };
    case 'messenger':
      return { icon: <MessengerIcon className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-400/20' };
    default:
      return { icon: <MessageCircle className="w-5 h-5" />, color: 'text-gray-400', bg: 'bg-gray-500/20' };
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Unified Inbox</h1>
          <p className="text-muted-foreground mt-1">All messaging platforms in one place.</p>
        </div>
        <Button variant="outline" onClick={() => fetchConversations()} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-1 space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No conversations yet.</div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedConversation?.id === conv.id
                    ? 'bg-primary/10 border-primary'
                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getPlatformColor(conv.platform)}`}>
                      {getPlatformIcon(conv.platform)}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{conv.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(conv.updated_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {conv.ai_mode ? (
                      <Badge variant="primary" className="text-xs">AI</Badge>
                    ) : (
                      <Badge variant="warning" className="text-xs">Human</Badge>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                  {conv.last_message || 'No messages'}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Conversation Detail */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <Card className="h-[600px] flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getPlatformColor(selectedConversation.platform)}`}>
                      {getPlatformIcon(selectedConversation.platform)}
                    </div>
                    <div>
                      <h2 className="font-bold text-white">{selectedConversation.customer_name}</h2>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {selectedConversation.customer_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {selectedConversation.customer_phone}
                          </span>
                        )}
                        <span>ID: {selectedConversation.platform_user_id}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedConversation.ai_mode ? (
                      <Button size="sm" variant="outline" onClick={handleTakeOver} className="gap-1">
                        <Hand className="w-4 h-4" />
                        Take Over
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={handleReturnToAI} className="gap-1">
                        <Bot className="w-4 h-4" />
                        Return to AI
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConversation.messages?.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No messages yet
                  </div>
                )}
                {selectedConversation.messages?.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className={`flex gap-3 ${msg.sender === 'customer' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.sender === 'customer' ? 'bg-blue-500/20' : 
                      msg.sender === 'admin' ? 'bg-green-500/20' : 'bg-primary/20'
                    }`}>
                      {msg.sender === 'customer' ? (
                        <User className="w-4 h-4 text-blue-400" />
                      ) : msg.sender === 'admin' ? (
                        <Bot className="w-4 h-4 text-green-400" />
                      ) : (
                        <Bot className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div className={`max-w-[70%] rounded-2xl p-3 ${
                      msg.sender === 'customer'
                        ? 'bg-blue-500/10 text-white'
                        : msg.sender === 'admin'
                        ? 'bg-green-500/10 text-white'
                        : 'bg-white/10 text-white'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={sending}
                  />
                  <Button onClick={handleSendMessage} disabled={sending || !messageInput.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};