import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../components/ui/Base';
import { messengerApi } from '../services/api';
import { MessageCircle, Clock, ChevronRight, User, Bot } from 'lucide-react';

interface Message {
  role?: 'user' | 'assistant' | 'system';
  content?: string;
  type?: 'human' | 'ai';
  data?: {
    content?: string;
    timestamp?: string;
  };
  timestamp?: string;
}

interface Conversation {
  _id: string;
  chatId: string;
  sessionId: string;
  threadId?: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export const MessengerConversations: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const data = await messengerApi.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
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

  const getPreview = (messages: Message[]) => {
    if (!messages || !messages.length) return 'No messages';
    const lastMsg = messages[messages.length - 1];
    const content = lastMsg?.content || lastMsg?.data?.content;
    if (!content) return 'No messages';
    const contentStr = String(content);
    return contentStr.slice(0, 60) + (contentStr.length > 60 ? '...' : '');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Messenger Conversations</h1>
          <p className="text-muted-foreground mt-1">View all n8n chatbot conversations.</p>
        </div>
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
                key={conv.chatId}
                onClick={() => setSelectedConversation(conv)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedConversation?.chatId === conv.chatId
                    ? 'bg-primary/10 border-primary'
                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{conv.chatId}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(conv.updatedAt)}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-1">{getPreview(conv.messages)}</p>
              </div>
            ))
          )}
        </div>

        {/* Conversation Detail */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <Card className="h-[600px] flex flex-col">
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-white">Chat: {selectedConversation.chatId}</h2>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedConversation.createdAt)} - {formatDate(selectedConversation.updatedAt)}
                    </p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConversation.messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      (msg.role === 'user' || msg.type === 'human') ? 'bg-blue-500/20' : 'bg-primary/20'
                    }`}>
                      {(msg.role === 'user' || msg.type === 'human') ? (
                        <User className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Bot className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div className={`max-w-[70%] rounded-2xl p-3 ${
                      (msg.role === 'user' || msg.type === 'human')
                        ? 'bg-blue-500/10 text-white'
                        : 'bg-white/10 text-white'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content || msg.data?.content}</p>
                      {msg.timestamp && (
                        <p className="text-xs text-muted-foreground mt-2">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {formatDate(msg.timestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
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