import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../components/ui/Base';
import { botApi } from '../services/api';
import { Bot, Plus, Code, Trash2, Edit2, CheckCircle2 } from 'lucide-react';

export const BotManagement: React.FC = () => {
  const [bots, setBots] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBot, setEditingBot] = useState<any>(null);
  const [embedCode, setEmbedCode] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    system_instruction: '',
    primary_color: '#7c3aed',
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
      setFormData({ name: '', system_instruction: '', primary_color: '#7c3aed', welcome_message: 'Hello! How can I help you today?' });
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AI Bot Studio</h1>
          <p className="text-muted-foreground mt-1">Create and manage your AI assistants for any website.</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Bot
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bots.map((bot) => (
          <Card key={bot.id} className="relative group">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setEditingBot(bot); setFormData(bot); setShowModal(true); }} className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(bot.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: bot.primary_color }}>
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white">{bot.name}</h3>
                  <Badge variant="success" className="text-[10px]">Active</Badge>
                </div>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                {bot.system_instruction || 'No system instructions set.'}
              </p>

              <div className="pt-4 border-t border-white/5 flex gap-3">
                <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => showEmbedCode(bot)}>
                  <Code className="w-4 h-4" /> Embed Code
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <Card className="w-full max-w-lg">
            <h2 className="text-xl font-bold text-white mb-6">{editingBot ? 'Edit Bot' : 'Create New Bot'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Bot Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. Customer Support"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">System Instruction (Gemini Personality)</label>
                <textarea 
                  rows={4}
                  required
                  value={formData.system_instruction}
                  onChange={e => setFormData({...formData, system_instruction: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:ring-1 focus:ring-primary text-sm"
                  placeholder="Tell the bot how to behave, e.g. 'You are a helpful assistant for a shoe store...'"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Theme Color</label>
                  <input 
                    type="color" 
                    value={formData.primary_color}
                    onChange={e => setFormData({...formData, primary_color: e.target.value})}
                    className="w-full h-10 bg-white/5 border border-white/10 rounded-xl p-1 cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Welcome Message</label>
                  <input 
                    type="text" 
                    value={formData.welcome_message}
                    onChange={e => setFormData({...formData, welcome_message: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:ring-1 focus:ring-primary text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" className="flex-1">Save Bot</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Embed Code Modal */}
      {embedCode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <Card className="w-full max-w-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Embed Your Bot</h2>
              <button onClick={() => setEmbedCode(null)}><Plus className="w-6 h-6 text-muted-foreground rotate-45" /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Copy and paste this code into the <code className="text-primary">&lt;head&gt;</code> or <code className="text-primary">&lt;body&gt;</code> of any website to add your AI assistant.</p>
            <div className="bg-black/40 border border-white/10 p-4 rounded-xl relative">
              <code className="text-emerald-400 text-xs break-all">{embedCode}</code>
              <Button size="sm" className="absolute top-2 right-2 h-7 px-2" onClick={() => { navigator.clipboard.writeText(embedCode); alert('Copied!'); }}>Copy</Button>
            </div>
            <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <p className="text-xs text-white/70">Your bot will automatically update its behavior when you change the settings here.</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
