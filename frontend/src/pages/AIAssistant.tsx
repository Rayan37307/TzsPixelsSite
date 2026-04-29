import React, { useState } from 'react';
import { 
  Search, 
  Send, 
  Bot, 
  User, 
  MoreHorizontal, 
  Paperclip, 
  Smile,
  Circle,
  Database,
  ExternalLink
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
    <div className="h-[calc(100vh-160px)] flex gap-6 animate-in fade-in duration-500">
      {/* Sidebar: Conversations */}
      <Card className="w-80 flex flex-col p-0 overflow-hidden border-white/5">
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Assistant</h2>
            <Badge variant="primary">AI Mode</Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search chats..." 
              className="w-full bg-background border border-white/10 rounded-lg py-2 pl-10 pr-4 text-xs focus:outline-none transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((chat) => (
            <div 
              key={chat.id} 
              className={cn(
                "p-4 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/[0.02]",
                chat.active && "bg-white/[0.05]"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white">
                      {chat.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    {chat.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#141414]" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-white">{chat.name}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{chat.time}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{chat.lastMsg}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Main: Chat Window */}
      <Card className="flex-1 flex flex-col p-0 overflow-hidden border-white/5">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Sarah Johnson</h3>
              <div className="flex items-center gap-1.5">
                <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" />
                <span className="text-[10px] text-muted-foreground">Order #1245 • Active 2m ago</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <Database className="w-3.5 h-3.5" /> Knowledge Base
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-transparent to-white/[0.01]">
          {mockMessages.map((msg) => (
            <div key={msg.id} className={cn(
              "flex gap-4 max-w-[80%]",
              msg.sender === 'user' ? "ml-auto flex-row-reverse" : ""
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                msg.sender === 'user' ? "bg-white/10" : "bg-primary/20"
              )}>
                {msg.sender === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-primary" />}
              </div>
              <div className="space-y-1">
                <div className={cn(
                  "p-4 rounded-2xl text-sm leading-relaxed",
                  msg.sender === 'user' 
                    ? "bg-secondary text-white rounded-tr-none" 
                    : "bg-white/[0.05] border border-white/5 text-white rounded-tl-none"
                )}>
                  {msg.text}
                </div>
                <p className={cn("text-[10px] text-muted-foreground", msg.sender === 'user' ? "text-right" : "")}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer: Input */}
        <div className="p-4 border-t border-white/5">
          <div className="relative flex items-center gap-2">
            <div className="flex-1 relative">
               <input 
                type="text" 
                placeholder="Type your message..." 
                className="w-full bg-background border border-white/10 rounded-xl py-3 pl-4 pr-24 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <Smile className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <Paperclip className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button className="h-[46px] w-[46px] rounded-xl p-0 shrink-0">
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            AI Assistant is currently in <span className="text-primary font-bold">Auto-pilot</span> mode. Switch to human to take over.
          </p>
        </div>
      </Card>

      {/* Info Panel: Context */}
      <div className="w-80 space-y-6 hidden xl:block">
        <Card>
          <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
            Customer Context
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground cursor-pointer" />
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-lg">🛍️</div>
               <div>
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                  <p className="text-sm font-bold text-white">$2,458.00</p>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-lg">📦</div>
               <div>
                  <p className="text-xs text-muted-foreground">Last Order</p>
                  <p className="text-sm font-bold text-white">#1245 (Pending)</p>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-lg">⚠️</div>
               <div>
                  <p className="text-xs text-muted-foreground">Risk Score</p>
                  <p className="text-sm font-bold text-emerald-400">Low (12/100)</p>
               </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-bold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-2">
            <Button variant="outline" className="justify-start text-xs h-9">Refund Order</Button>
            <Button variant="outline" className="justify-start text-xs h-9">Resend Tracking</Button>
            <Button variant="outline" className="justify-start text-xs h-9">Apply Discount</Button>
            <Button variant="danger" className="justify-start text-xs h-9 bg-red-500/5 hover:bg-red-500/10">Block User</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
