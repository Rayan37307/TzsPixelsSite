import React, { useState } from 'react';
import {
  Search,
  Send,
  Bot,
  User,
  MoreHorizontal,
  Paperclip,
  Smile,
  Zap,
  Sparkles,
  ShieldCheck,
  Package,
  TrendingUp,
} from 'lucide-react';
import { Card, Button, Badge } from '../components/ui/Base';
import { cn } from '../utils/cn';

const conversations = [
  { id: 1, name: 'Sarah Johnson', lastMsg: 'How do I return my order?', time: '2m', active: true, online: true },
  { id: 2, name: 'Michael Chen', lastMsg: 'Is shipping available to Japan?', time: '15m', active: false, online: true },
  { id: 3, name: 'Emma Wilson', lastMsg: 'My package hasn\'t arrived yet.', time: '1h', active: false, online: false },
  { id: 4, name: 'James Miller', lastMsg: 'Can I change my address?', time: '3h', active: false, online: true },
];

const mockMessages = [
  { id: 1, sender: 'user', text: 'Hi, I ordered #1245 yesterday but I need to change the delivery address.', time: '10:30 AM' },
  { id: 2, sender: 'ai', text: 'Hello Sarah! I can help you with that. I see your order #1245 is currently "Pending". To change your address, please provide the new details below.', time: '10:31 AM' },
  { id: 3, sender: 'user', text: 'Great! The new address is 123 Maple St, Springfield.', time: '10:32 AM' },
  { id: 4, sender: 'ai', text: 'Updating your order now... Done! I\'ve updated the shipping address for order #1245. You\'ll receive a confirmation email shortly.', time: '10:32 AM' },
];

export const AIAssistant: React.FC = () => {
  const [message, setMessage] = useState('');

  return (
    <div className="h-[calc(100vh-160px)] flex gap-6">
      {/* Conversation list */}
      <Card className="w-72 flex flex-col p-0 overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
               <h2 className="text-lg font-black text-foreground tracking-tight">Channels</h2>
               <p className="font-mono text-xs text-muted-foreground mt-0.5">Active conversations</p>
            </div>
            <Zap className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-card border-2 border-border rounded-lg py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-[var(--color-accent)] transition-all placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((chat) => (
            <div
              key={chat.id}
              className={cn(
                "p-5 border-b border-border cursor-pointer transition-colors relative group",
                chat.active ? "bg-[var(--color-paper-3)]" : "hover:bg-[var(--color-paper-3)]"
              )}
            >
              {chat.active && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--color-accent)]" />}
              <div className="flex items-center gap-3 mb-1.5">
                <div className="relative">
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center font-mono text-xs font-bold text-foreground",
                    chat.active ? "bg-[var(--color-accent)]/10 border-2 border-[var(--color-accent)]/30" : "bg-[var(--color-paper-3)] border-2 border-border"
                  )}>
                    {chat.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  {chat.online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[var(--color-success)] rounded-sm border-2 border-card" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-sm text-foreground">{chat.name}</span>
                  <div className="font-mono text-xs text-muted-foreground">{chat.time} ago</div>
                </div>
              </div>
              <p className="font-mono text-xs text-muted-foreground truncate ml-12">
                {chat.lastMsg}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Chat window */}
      <Card className="flex-1 flex flex-col p-0 overflow-hidden relative">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-[var(--color-paper-2)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg border-2 border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 flex items-center justify-center">
              <Bot className="w-6 h-6 text-[var(--color-accent)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                 <h3 className="text-lg font-black text-foreground tracking-tight">Sarah Johnson</h3>
                 <Badge variant="primary" className="border-2">AI active</Badge>
              </div>
              <div className="flex items-center gap-2 mt-0.5 font-mono text-xs text-muted-foreground">
                ID: #X-1245
                <span className="w-1 h-1 rounded-full bg-border" />
                Auto-pilot
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" className="gap-2">
              <Sparkles className="w-4 h-4" /> Knowledge
            </Button>
            <Button variant="secondary" size="icon">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {mockMessages.map((msg) => (
            <div key={msg.id} className={cn(
              "flex gap-4 max-w-[75%]",
              msg.sender === 'user' ? "ml-auto flex-row-reverse" : ""
            )}>
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border-2",
                msg.sender === 'user' ? "border-border bg-[var(--color-paper-3)]" : "border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10"
              )}>
                {msg.sender === 'user' ? <User className="w-4 h-4 text-muted-foreground" /> : <Bot className="w-4 h-4 text-[var(--color-accent)]" />}
              </div>
              <div className={cn("space-y-1", msg.sender === 'user' ? "text-right" : "")}>
                <div className={cn(
                  "rounded-lg px-5 py-3 text-sm leading-relaxed border-2",
                  msg.sender === 'user'
                    ? "bg-[var(--color-paper-3)] border-border text-foreground"
                    : "bg-[var(--color-accent)]/5 border-[var(--color-accent)]/20 text-foreground"
                )}>
                  {msg.text}
                </div>
                <p className="font-mono text-xs text-muted-foreground px-1">
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-6 border-t border-border">
          <div className="relative flex items-center gap-3">
            <div className="flex-1 relative">
               <input
                type="text"
                placeholder="Type a message..."
                className="w-full h-12 bg-card border-2 border-border rounded-lg pl-4 pr-24 text-sm text-foreground focus:outline-none focus:border-[var(--color-accent)] transition-all placeholder:text-muted-foreground"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-[var(--color-paper-3)] transition-colors">
                  <Smile className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-border mx-0.5" />
                <button className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-[var(--color-paper-3)] transition-colors">
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>
            </div>
            <Button variant="primary" className="w-12 h-12 p-0 shrink-0">
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
             <div className="w-1.5 h-1.5 rounded-sm bg-[var(--color-accent)]" />
             <p className="font-mono text-xs text-muted-foreground">AI auto-pilot · all systems active</p>
          </div>
        </div>
      </Card>

      {/* Info panel */}
      <div className="w-72 space-y-6 hidden xl:block">
        <Card className="p-6">
          <h3 className="font-mono text-xs text-muted-foreground mb-6 flex items-center justify-between">
            Customer info
            <span className="text-[var(--color-accent)] cursor-pointer hover:underline">View</span>
          </h3>
          <div className="space-y-5">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-lg bg-[var(--color-paper-3)] border-2 border-border flex items-center justify-center text-lg">💰</div>
               <div>
                  <p className="font-mono text-xs text-muted-foreground">Lifetime value</p>
                  <p className="font-bold text-lg text-foreground tracking-tight">$2,458</p>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-lg bg-[var(--color-paper-3)] border-2 border-border flex items-center justify-center text-lg">📦</div>
               <div>
                  <p className="font-mono text-xs text-muted-foreground">Active order</p>
                  <p className="font-bold text-base text-foreground tracking-tight">#1245 <span className="font-mono text-xs font-normal text-[var(--color-success)]">PENDING</span></p>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-lg bg-[var(--color-paper-3)] border-2 border-border flex items-center justify-center text-lg">⚡</div>
               <div>
                  <p className="font-mono text-xs text-muted-foreground">Risk</p>
                  <p className="font-bold text-base text-foreground tracking-tight">LOW <span className="font-mono text-xs font-normal text-muted-foreground">12%</span></p>
               </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-5">
             <ShieldCheck className="w-4 h-4 text-muted-foreground" />
             <h3 className="font-mono text-xs text-muted-foreground">Quick actions</h3>
          </div>
          <div className="space-y-2">
            <Button variant="secondary" size="md" className="w-full justify-between">
              Initiate refund <TrendingUp className="w-3 h-3" />
            </Button>
            <Button variant="secondary" size="md" className="w-full justify-between">
              Re-route package <Package className="w-3 h-3" />
            </Button>
            <Button variant="secondary" size="md" className="w-full justify-between">
              Apply loyalty <Sparkles className="w-3 h-3" />
            </Button>
            <Button variant="danger" size="md" className="w-full justify-between">
              Terminate <ShieldCheck className="w-3 h-3" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
