import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../components/ui/Base';
import { ShieldCheck, Zap, Lock, Mail } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
      
      <div className="w-full max-w-lg space-y-10 relative z-10 animate-in fade-in zoom-in-95 duration-1000">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-[2rem] bg-[#0d0d0d] border border-white/10 mx-auto flex items-center justify-center mb-8 shadow-2xl relative group transition-transform hover:scale-110">
             <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="w-10 h-10 rounded-full border-4 border-primary relative z-10 flex items-center justify-center">
                <div className="w-4 h-4 bg-primary rounded-full animate-pulse" />
             </div>
          </div>
          <h1 className="text-5xl font-black text-white italic tracking-tighter">Access <span className="text-primary not-italic">Core</span></h1>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Neural Handshake Required</p>
        </div>

        <Card className="bg-[#0d0d0d] border-white/[0.05] rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-transparent to-transparent opacity-50" />
          
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2">
                <Mail className="w-3 h-3" /> Signal Address
              </label>
              <div className="relative group">
                 <input 
                  type="email" 
                  placeholder="identity@scalefy.ai" 
                  className="w-full h-14 bg-white/[0.02] border border-white/5 rounded-2xl px-6 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-white/10"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Lock className="w-3 h-3" /> Security Key
                </label>
                <a href="#" className="text-[9px] font-black text-primary uppercase tracking-widest hover:opacity-70 transition-opacity">Reset Vector</a>
              </div>
              <div className="relative group">
                <input 
                  type="password" 
                  placeholder="••••••••••••" 
                  className="w-full h-14 bg-white/[0.02] border border-white/5 rounded-2xl px-6 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-white/10"
                  required
                />
              </div>
            </div>

            <Button type="submit" variant="premium" className="w-full h-16 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 mt-4 group">
              Initialize Connection <Zap className="w-4 h-4 ml-2 group-hover:animate-bounce" />
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/[0.03] flex items-center justify-center gap-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
             <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> AES-256 Active
             </div>
             <div className="w-1 h-1 rounded-full bg-white/10" />
             <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-primary" /> Low Latency
             </div>
          </div>
        </Card>

        <p className="text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          New Entity? <a href="#" className="text-primary hover:underline transition-all">Request Authorization</a>
        </p>
      </div>
    </div>
  );
};
