import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../components/ui/Base';
import { botApi } from '../services/api';
import { Bot, Plus, Code, Trash2, Edit2, CheckCircle2, Sparkles, Wand2, X } from 'lucide-react';
import { cn } from '../utils/cn';

export const BotManagement: React.FC = () => {
  const [bots, setBots] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBot, setEditingBot] = useState<any>(null);
  const [embedCode, setEmbedCode] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    system_instruction: '',
    primary_color: '#10b981',
    welcome_message: 'Hello! How can I help you today?'
  });

  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    try {
      const data = await botApi.getAllBots();
      setBots(data);
    } catch (err) {
      console.error('Failed to fetch bots:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBot) {
        await botApi.updateBot(editingBot.id, formData);
      } else {
        await botApi.createBot(formData);
      }
      setShowModal(false);
      setEditingBot(null);
      setFormData({ name: '', system_instruction: '', primary_color: '#10b981', welcome_message: 'Hello! How can I help you today?' });
      fetchBots();
    } catch (err) {
      console.error('Failed to save bot:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this bot?')) {
      try {
        await botApi.deleteBot(id);
        fetchBots();
      } catch (err) {
        console.error('Failed to delete bot:', err);
      }
    }
  };

  const showEmbedCode = (bot: any) => {
    const code = `<script src="http://localhost:5000/widget.js" data-bot-id="${bot.id}"></script>`;
    setEmbedCode(code);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight">AI Bot <span className="text-primary italic">Studio</span></h1>
          <p className="text-muted-foreground mt-2 font-medium tracking-wide uppercase text-[10px] tracking-[0.2em]">Neural Network Configuration Hub</p>
        </div>
        <Button onClick={() => { setEditingBot(null); setFormData({ name: '', system_instruction: '', primary_color: '#10b981', welcome_message: 'Hello! How can I help you today?' }); setShowModal(true); }} variant="premium" className="h-14 px-8 rounded-2xl gap-3 font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/20">
          <Plus className="w-5 h-5" /> New Model
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {bots.length === 0 ? (
          <Card className="col-span-full py-24 flex flex-col items-center justify-center bg-white/[0.01] border-dashed border-white/10 rounded-[3rem]">
            <div className="w-20 h-20 rounded-[2rem] bg-white/[0.03] border border-white/10 flex items-center justify-center mb-6">
               <Bot className="w-10 h-10 text-muted-foreground opacity-20" />
            </div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">No Neural Entities Found</p>
            <Button variant="link" onClick={() => setShowModal(true)} className="mt-4 text-primary font-black uppercase tracking-widest text-[10px]">Initialize First Model</Button>
          </Card>
        ) : (
          bots.map((bot) => (
            <Card key={bot.id} className="relative group p-0 overflow-hidden bg-[#0d0d0d] border-white/[0.05] rounded-[2.5rem] transition-all duration-500 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl transition-transform duration-500 group-hover:scale-110" style={{ backgroundColor: bot.primary_color }}>
                      <Bot className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white italic tracking-tight">{bot.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Core Status: Online</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                    <button onClick={() => { setEditingBot(bot); setFormData(bot); setShowModal(true); }} className="p-3 bg-white/[0.03] hover:bg-white/10 rounded-xl text-muted-foreground hover:text-white transition-colors border border-white/5">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(bot.id)} className="p-3 bg-red-500/5 hover:bg-red-500/10 rounded-xl text-muted-foreground hover:text-red-400 transition-colors border border-red-500/10">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="px-4 py-3 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-50">Instruction Logic</p>
                    <p className="text-sm font-medium text-white/70 line-clamp-2 leading-relaxed italic">
                      "{bot.system_instruction || 'No system instructions set.'}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="flex -space-x-2">
                       {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-white/5 border-2 border-[#0d0d0d] flex items-center justify-center"><Sparkles className="w-3 h-3 text-primary/50" /></div>)}
                    </div>
                    <Button variant="secondary" size="sm" className="h-10 px-6 rounded-xl gap-2 font-black text-[10px] uppercase tracking-widest border-white/5 hover:bg-primary/10 hover:text-primary transition-all" onClick={() => showEmbedCode(bot)}>
                      <Code className="w-4 h-4" /> Deployment Code
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <Card className="w-full max-w-2xl bg-[#0d0d0d] border-white/[0.05] rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-transparent" />
            
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Wand2 className="w-6 h-6 text-primary" />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-white italic tracking-tight">{editingBot ? 'Augment Model' : 'Initialize Entity'}</h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Configuring Neural Pathways</p>
                 </div>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                 <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Model Designation</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full h-14 bg-white/[0.02] border border-white/5 rounded-[1.25rem] px-6 text-white font-black italic outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/10"
                    placeholder="e.g. CORE-ALPHA"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Visual Identity</label>
                  <div className="flex gap-4">
                    <input 
                      type="color" 
                      value={formData.primary_color}
                      onChange={e => setFormData({...formData, primary_color: e.target.value})}
                      className="w-14 h-14 bg-white/[0.02] border border-white/5 rounded-[1.25rem] p-2 cursor-pointer transition-transform hover:scale-105"
                    />
                    <div className="flex-1 flex items-center px-6 bg-white/[0.02] border border-white/5 rounded-[1.25rem] text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                       HEX: {formData.primary_color}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Neural Directives (Gemini Core)</label>
                <textarea 
                  rows={4}
                  required
                  value={formData.system_instruction}
                  onChange={e => setFormData({...formData, system_instruction: e.target.value})}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-[1.5rem] p-6 text-white font-medium outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm leading-relaxed resize-none placeholder:text-white/10"
                  placeholder="Define the behavioral parameters for this entity..."
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Primary Transmission (Welcome Message)</label>
                <input 
                  type="text" 
                  value={formData.welcome_message}
                  onChange={e => setFormData({...formData, welcome_message: e.target.value})}
                  className="w-full h-14 bg-white/[0.02] border border-white/5 rounded-[1.25rem] px-6 text-white font-medium outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm placeholder:text-white/10"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <Button type="button" variant="secondary" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] border-white/5" onClick={() => setShowModal(false)}>Abort Process</Button>
                <Button type="submit" variant="premium" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20">Finalize Sequence</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Embed Code Modal */}
      {embedCode && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-6 animate-in zoom-in-95 duration-300">
          <Card className="w-full max-w-2xl bg-[#0d0d0d] border-white/[0.05] rounded-[3rem] p-12 shadow-2xl relative">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <Code className="w-6 h-6 text-emerald-500" />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-white italic tracking-tight">Deploy Model</h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Cross-Platform Integration Script</p>
                 </div>
              </div>
              <button onClick={() => setEmbedCode(null)} className="w-10 h-10 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                 <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <p className="text-sm font-medium text-white/60 mb-6 leading-relaxed">
              Inject this neural bridge into the <code className="text-primary font-black">&lt;head&gt;</code> or <code className="text-primary font-black">&lt;body&gt;</code> of any client-side environment to activate the entity.
            </p>

            <div className="bg-black/60 border border-white/[0.05] p-8 rounded-[2rem] relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                 <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-emerald-500/30 text-emerald-500">Live Vector</Badge>
              </div>
              <code className="text-emerald-400 text-xs break-all font-mono leading-relaxed block pr-10">{embedCode}</code>
              <Button size="sm" variant="premium" className="mt-8 w-full h-12 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/10" onClick={() => { navigator.clipboard.writeText(embedCode); alert('Sequence Copied!'); }}>
                Copy Deployment String
              </Button>
            </div>

            <div className="mt-10 p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-5">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                 <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest leading-loose">
                Remote synchronization enabled. Any pathway modifications will propagate instantly across all active vectors.
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
