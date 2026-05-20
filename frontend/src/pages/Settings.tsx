import React, { useState, useEffect } from 'react';
import { settingsApi } from '../services/api';
import { 
  Zap, 
  RefreshCw,
  Cpu,
  Key,
  ShieldCheck
} from 'lucide-react';
import { Card, Badge } from '../components/ui/Base';
import { cn } from '../utils/cn';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsApi.get();
        setSettings(data);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleUpdate = async (key: string, value: any) => {
    setSaving(key);
    try {
      await settingsApi.update(key, value);
      setSettings((prev: any) => ({
        ...prev,
        [key]: value
      }));
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center animate-pulse">
           <Zap className="w-10 h-10 text-primary animate-bounce" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
      {/* Header - Centered & Premium */}
      <div className="text-center py-10">
        <Badge variant="primary" className="mb-6 h-8 px-6 rounded-full border-primary/20 bg-primary/5 text-primary text-[10px] tracking-[0.3em] font-black uppercase">Environment Hub</Badge>
        <h1 className="text-7xl font-black text-primary tracking-tighter italic leading-none mb-4">Control <span className="text-primary not-italic">Center</span></h1>
        <p className="text-muted-foreground font-black uppercase text-[11px] tracking-[0.5em] opacity-40">Secure API Credentials & Neural Parameters</p>
      </div>

      {/* Intelligence Portal - AI Settings */}
      <Card className="bg-[#0d0d0d] border-white/[0.05] rounded-[2.5rem] p-12 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.07] transition-all duration-700">
           <Cpu className="w-64 h-64 text-primary" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-5 mb-12">
             <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-2xl shadow-primary/10">
                <Cpu className="w-8 h-8 text-primary" />
             </div>
             <div>
                <h3 className="text-3xl font-black text-white italic tracking-tight uppercase">Neural Portal</h3>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">AI Engine & Logic Keys</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Active Model Architecture</label>
                <div className="relative group/select">
                  <select 
                    value={settings.neural_config?.model || 'GPT-4-Turbo'}
                    onChange={(e) => handleUpdate('neural_config', { ...settings.neural_config, model: e.target.value })}
                    className="w-full h-16 bg-white/[0.02] border border-white/10 rounded-2xl px-8 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all appearance-none cursor-pointer hover:bg-white/[0.04]"
                  >
                    <option value="GPT-4-Turbo">GPT-4-Turbo (Intelligence)</option>
                    <option value="Gemini-1.5-Pro">Gemini 1.5 Pro (Accuracy)</option>
                    <option value="Claude-3-Opus">Claude 3 Opus (Reasoning)</option>
                  </select>
                  <RefreshCw className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none group-hover/select:rotate-180 transition-transform duration-500" />
                </div>
              </div>

              <div className="p-8 bg-primary/5 border border-primary/10 rounded-[2rem] flex items-center gap-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                   <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] leading-relaxed opacity-80">
                  Neural engine integrity is verified for high-concurrency analysis.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Gemini API Key</label>
                <div className="relative group/input">
                  <input 
                    type="password" 
                    placeholder="Enter Key..."
                    value={settings.neural_config?.geminiKey || ''}
                    onChange={(e) => setSettings({ ...settings, neural_config: { ...settings.neural_config, geminiKey: e.target.value } })}
                    onBlur={() => handleUpdate('neural_config', settings.neural_config)}
                    className="w-full h-16 bg-white/[0.02] border border-white/10 rounded-2xl px-8 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all hover:bg-white/[0.04]"
                  />
                  <Key className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 group-hover/input:text-primary transition-colors" />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">ChatGPT API Key</label>
                <div className="relative group/input">
                  <input 
                    type="password" 
                    placeholder="Enter Key..."
                    value={settings.neural_config?.chatgptKey || ''}
                    onChange={(e) => setSettings({ ...settings, neural_config: { ...settings.neural_config, chatgptKey: e.target.value } })}
                    onBlur={() => handleUpdate('neural_config', settings.neural_config)}
                    className="w-full h-16 bg-white/[0.02] border border-white/10 rounded-2xl px-8 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all hover:bg-white/[0.04]"
                  />
                  <Key className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 group-hover/input:text-primary transition-colors" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Save Status Notification */}
      {saving && (
        <div className="fixed bottom-10 right-10 bg-primary text-black font-black text-[10px] uppercase tracking-widest px-8 py-4 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 flex items-center gap-4 z-[100] border border-white/20">
           <RefreshCw className="w-4 h-4 animate-spin" /> Committing {saving.replace('_', ' ')} Logic...
        </div>
      )}
    </div>
  );
};
