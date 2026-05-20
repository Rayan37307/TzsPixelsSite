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
  ExternalLink,
  Zap,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Package
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
    <div className="h-[calc(100vh-160px)] flex gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Sidebar: Conversations */}
      <Card className="w-80 flex flex-col p-0 overflow-hidden bg-[#0d0d0d] border-white/[0.05] rounded-[2.5rem]">
        <div className="p-8 border-b border-white/[0.03]">
          <div className="flex items-center justify-between mb-8">
            <div>
               <h2 className="text-xl font-black text-white italic tracking-tight">Channels</h2>
               <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Active Vectors</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
               <Zap className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="SEARCH NEURAL BUS..." 
              className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-white/10"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.map((chat) => (
            <div 
              key={chat.id} 
              className={cn(
                "p-6 border-b border-white/[0.02] cursor-pointer transition-all duration-300 relative group",
                chat.active ? "bg-primary/[0.03]" : "hover:bg-white/[0.01]"
              )}
            >
              {chat.active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black text-white transition-transform group-hover:scale-110",
                      chat.active ? "bg-primary/20 shadow-xl shadow-primary/20" : "bg-white/[0.03] border border-white/5"
                    )}>
                      {chat.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    {chat.online && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0d0d0d] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-black text-white tracking-tight italic">{chat.name}</span>
                    <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60 mt-0.5">{chat.time} offset</div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] font-medium text-white/40 truncate leading-relaxed group-hover:text-white/60 transition-colors">
                {chat.lastMsg}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Main: Chat Window */}
      <Card className="flex-1 flex flex-col p-0 overflow-hidden bg-[#0d0d0d] border-white/[0.05] rounded-[2.5rem] relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-transparent to-transparent" />
        
        {/* Header */}
        <div className="p-8 border-b border-white/[0.03] flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-2xl">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <div className="absolute -top-1 -right-1">
                 <Badge variant="primary" className="h-5 text-[8px] px-2 rounded-md font-black uppercase tracking-widest shadow-lg">AUTO-PILOT</Badge>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                 <h3 className="text-xl font-black text-white italic tracking-tight">Sarah Johnson</h3>
                 <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-emerald-500/20 text-emerald-500">Live Connection</Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">VECTOR ID: #X-1245</span>
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Active Neural Bridge</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="secondary" className="h-12 px-6 rounded-xl gap-3 font-black text-[10px] uppercase tracking-widest border-white/5">
              <Database className="w-4 h-4" /> Logic Base
            </Button>
            <Button variant="secondary" size="icon" className="h-12 w-12 rounded-xl border-white/5">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-gradient-to-b from-transparent via-transparent to-primary/[0.01] custom-scrollbar">
          {mockMessages.map((msg) => (
            <div key={msg.id} className={cn(
              "flex gap-6 max-w-[75%]",
              msg.sender === 'user' ? "ml-auto flex-row-reverse" : ""
            )}>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xl",
                msg.sender === 'user' ? "bg-white/[0.03] border border-white/5" : "bg-primary/20 border border-primary/30"
              )}>
                {msg.sender === 'user' ? <User className="w-5 h-5 text-white/50" /> : <Bot className="w-5 h-5 text-primary" />}
              </div>
              <div className={cn("space-y-3", msg.sender === 'user' ? "text-right" : "")}>
                <div className={cn(
                  "p-6 rounded-[2rem] text-sm font-medium leading-relaxed shadow-2xl",
                  msg.sender === 'user' 
                    ? "bg-[#141414] border border-white/[0.05] text-white/90 rounded-tr-none" 
                    : "bg-primary/[0.05] border border-primary/10 text-white rounded-tl-none"
                )}>
                  {msg.text}
                </div>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40 px-2">
                  TRANSMITTED @ {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer: Input */}
        <div className="p-8 bg-white/[0.01] border-t border-white/[0.03]">
          <div className="relative flex items-center gap-4">
            <div className="flex-1 relative group">
               <input 
                type="text" 
                placeholder="INPUT NEURAL COMMAND..." 
                className="w-full h-16 bg-white/[0.02] border border-white/5 rounded-[1.5rem] pl-8 pr-32 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-white/10"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl">
                  <Smile className="w-5 h-5" />
                </Button>
                <div className="w-[1px] h-6 bg-white/5 mx-1" />
                <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl">
                  <Paperclip className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <Button variant="premium" className="h-16 w-16 rounded-[1.25rem] p-0 shrink-0 shadow-2xl shadow-primary/20">
              <Send className="w-6 h-6" />
            </Button>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
             <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">
               System in <span className="text-primary">Autonomous State</span> • Logic Synchronization Active
             </p>
          </div>
        </div>
      </Card>

      {/* Info Panel: Context */}
      <div className="w-80 space-y-8 hidden xl:block animate-in fade-in slide-in-from-right-4 duration-1000 delay-300">
        <Card className="bg-[#0d0d0d] border-white/[0.05] rounded-[2.5rem] p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Sparkles className="w-24 h-24 text-primary" />
          </div>
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-8 flex items-center justify-between">
            Entity Telemetry
            <ExternalLink className="w-4 h-4 text-primary cursor-pointer hover:scale-110 transition-transform" />
          </h3>
          <div className="space-y-8">
            <div className="flex items-center gap-5 group">
               <div className="w-12 h-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-xl transition-transform group-hover:scale-110 shadow-2xl">💰</div>
               <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Life-Cycle Value</p>
                  <p className="text-lg font-black text-white italic tracking-tight">$2,458.00</p>
               </div>
            </div>
            <div className="flex items-center gap-5 group">
               <div className="w-12 h-12 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-xl transition-transform group-hover:scale-110 shadow-2xl">📦</div>
               <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Active Payload</p>
                  <p className="text-lg font-black text-white italic tracking-tight">#1245 <span className="text-[10px] text-emerald-500 not-italic">PENDING</span></p>
               </div>
            </div>
            <div className="flex items-center gap-5 group">
               <div className="w-12 h-12 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-center text-xl transition-transform group-hover:scale-110 shadow-2xl">⚡</div>
               <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Anomaly Risk</p>
                  <p className="text-lg font-black text-emerald-400 italic tracking-tight">LOW <span className="text-[10px] text-muted-foreground not-italic opacity-40">12%</span></p>
               </div>
            </div>
          </div>
        </Card>

        <Card className="bg-[#0d0d0d] border-white/[0.05] rounded-[2.5rem] p-8">
          <div className="flex items-center gap-3 mb-8">
             <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-muted-foreground" />
             </div>
             <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Directives</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Button variant="secondary" className="justify-between text-[10px] font-black uppercase tracking-widest h-12 px-5 rounded-xl border-white/5 hover:bg-primary/10 hover:text-primary transition-all">
              Initialize Refund <TrendingUp className="w-3 h-3 opacity-20" />
            </Button>
            <Button variant="secondary" className="justify-between text-[10px] font-black uppercase tracking-widest h-12 px-5 rounded-xl border-white/5 hover:bg-primary/10 hover:text-primary transition-all">
              Re-route Package <Package className="w-3 h-3 opacity-20" />
            </Button>
            <Button variant="secondary" className="justify-between text-[10px] font-black uppercase tracking-widest h-12 px-5 rounded-xl border-white/5 hover:bg-primary/10 hover:text-primary transition-all">
              Apply Loyalty <Sparkles className="w-3 h-3 opacity-20" />
            </Button>
            <Button variant="secondary" className="justify-between text-[10px] font-black uppercase tracking-widest h-12 px-5 rounded-xl bg-red-500/5 border-red-500/10 text-red-400 hover:bg-red-500/10 transition-all">
              TERMINATE ACCESS <ShieldCheck className="w-3 h-3 opacity-20" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
