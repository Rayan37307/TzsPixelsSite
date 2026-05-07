import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Badge, Input } from '../components/ui/Base';
import { messagingApi } from '../services/api';
import { MessageCircle, Clock, ChevronRight, User, Bot, Send, Phone, MapPin, RefreshCw, Hand, ArrowLeft } from 'lucide-react';

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
    return <MessageCircle className="w-4 h-4" />;
  };

  const getPlatformColor = (platform: string) => {
    return 'bg-blue-500/20 text-blue-400';
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