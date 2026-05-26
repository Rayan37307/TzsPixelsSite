import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../components/ui/Base';
import { botApi } from '../services/api';
import { Bot, Plus, Code, Trash2, Edit2, CheckCircle2, Sparkles, Wand2, X } from 'lucide-react';

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
    <div className="pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Bot studio</h1>
          <p className="font-mono text-sm text-muted-foreground mt-1">Configure and deploy AI bots</p>
        </div>
        <Button onClick={() => { setEditingBot(null); setFormData({ name: '', system_instruction: '', primary_color: '#10b981', welcome_message: 'Hello! How can I help you today?' }); setShowModal(true); }} variant="primary" size="md" className="gap-2">
          <Plus className="w-5 h-5" /> New bot
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bots.length === 0 ? (
          <Card className="col-span-full py-24 flex flex-col items-center justify-center border-2 border-dashed border-border">
            <div className="w-16 h-16 rounded-xl bg-[var(--color-paper-3)] border-2 border-border flex items-center justify-center mb-4">
               <Bot className="w-8 h-8 text-muted-foreground opacity-30" />
            </div>
            <p className="font-mono text-sm text-muted-foreground">No bots configured</p>
            <Button variant="link" onClick={() => setShowModal(true)} className="mt-3 font-mono text-xs">
              Create your first bot
            </Button>
          </Card>
        ) : (
          bots.map((bot) => (
            <Card key={bot.id} className="relative group p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: bot.primary_color }}>
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground tracking-tight">{bot.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-sm bg-[var(--color-success)]" />
                      <span className="font-mono text-xs text-muted-foreground">Online</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingBot(bot); setFormData(bot); setShowModal(true); }} className="w-8 h-8 rounded-lg border-2 border-border flex items-center justify-center hover:bg-[var(--color-paper-3)] transition-colors">
                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(bot.id)} className="w-8 h-8 rounded-lg border-2 border-[var(--color-danger-dim)] flex items-center justify-center hover:bg-[var(--color-danger)]/10 transition-colors">
                    <Trash2 className="w-4 h-4 text-[var(--color-danger)]" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-[var(--color-paper-3)] border-2 border-border rounded-lg">
                  <p className="font-mono text-xs text-muted-foreground mb-1">Instructions</p>
                  <p className="font-mono text-sm text-foreground line-clamp-2 leading-relaxed">
                    "{bot.system_instruction || 'No instructions set.'}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="secondary" size="sm" className="gap-2" onClick={() => showEmbedCode(bot)}>
                    <Code className="w-4 h-4" /> Embed code
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-paper/80 z-[100] flex items-center justify-center p-6">
          <Card className="w-full max-w-2xl p-10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-lg border-2 border-[var(--color-accent)]/30 flex items-center justify-center">
                    <Wand2 className="w-5 h-5 text-[var(--color-accent)]" />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-foreground tracking-tight">{editingBot ? 'Edit bot' : 'New bot'}</h2>
                    <p className="font-mono text-sm text-muted-foreground mt-0.5">Configure AI parameters</p>
                 </div>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-lg border-2 border-border flex items-center justify-center hover:bg-[var(--color-paper-3)] transition-colors">
                 <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-mono text-xs text-muted-foreground">Bot name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full h-12 bg-card border-2 border-border rounded-lg px-4 text-sm text-foreground outline-none focus:border-[var(--color-accent)] transition-all"
                    placeholder="e.g. Support Bot"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-xs text-muted-foreground">Color</label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={formData.primary_color}
                      onChange={e => setFormData({...formData, primary_color: e.target.value})}
                      className="w-12 h-12 bg-card border-2 border-border rounded-lg p-1 cursor-pointer"
                    />
                    <div className="flex-1 flex items-center px-4 bg-card border-2 border-border rounded-lg font-mono text-xs text-muted-foreground">
                       HEX: {formData.primary_color}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-mono text-xs text-muted-foreground">System instructions</label>
                <textarea
                  rows={4}
                  required
                  value={formData.system_instruction}
                  onChange={e => setFormData({...formData, system_instruction: e.target.value})}
                  className="w-full bg-card border-2 border-border rounded-lg p-4 text-sm text-foreground outline-none focus:border-[var(--color-accent)] transition-all resize-none"
                  placeholder="Define the bot's behavior..."
                />
              </div>

              <div className="space-y-2">
                <label className="font-mono text-xs text-muted-foreground">Welcome message</label>
                <input
                  type="text"
                  value={formData.welcome_message}
                  onChange={e => setFormData({...formData, welcome_message: e.target.value})}
                  className="w-full h-12 bg-card border-2 border-border rounded-lg px-4 text-sm text-foreground outline-none focus:border-[var(--color-accent)] transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" className="flex-1">{editingBot ? 'Save changes' : 'Create bot'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Embed code modal */}
      {embedCode && (
        <div className="fixed inset-0 bg-paper/90 z-[100] flex items-center justify-center p-6">
          <Card className="w-full max-w-2xl p-10 relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-lg border-2 border-[var(--color-success)]/30 bg-[var(--color-success)]/10 flex items-center justify-center">
                    <Code className="w-5 h-5 text-[var(--color-success)]" />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-foreground tracking-tight">Deploy bot</h2>
                    <p className="font-mono text-sm text-muted-foreground mt-0.5">Embed this script on your site</p>
                 </div>
              </div>
              <button onClick={() => setEmbedCode(null)} className="w-10 h-10 rounded-lg border-2 border-border flex items-center justify-center hover:bg-[var(--color-paper-3)] transition-colors">
                 <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <p className="font-mono text-sm text-muted-foreground mb-6 leading-relaxed">
              Add this script to the <code className="text-foreground font-bold">&lt;head&gt;</code> or <code className="text-foreground font-bold">&lt;body&gt;</code> of your site.
            </p>

            <div className="bg-black/40 border-2 border-border rounded-lg p-6 relative group overflow-hidden">
              <Badge variant="success" className="absolute top-4 right-4">Active</Badge>
              <code className="font-mono text-xs text-[var(--color-success)] break-all leading-relaxed block pr-16">{embedCode}</code>
              <Button size="sm" variant="primary" className="mt-6 w-full" onClick={() => { navigator.clipboard.writeText(embedCode); alert('Copied!'); }}>
                Copy to clipboard
              </Button>
            </div>

            <div className="mt-6 p-5 border-2 border-[var(--color-success)]/20 rounded-lg flex items-center gap-4">
              <CheckCircle2 className="w-5 h-5 text-[var(--color-success)] shrink-0" />
              <p className="font-mono text-xs text-muted-foreground">
                Changes propagate instantly across all deployments.
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
