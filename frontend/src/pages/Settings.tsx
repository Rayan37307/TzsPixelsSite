import React, { useState, useEffect } from 'react';
import { settingsApi } from '../services/api';
import { 
  Settings as SettingsIcon, 
  Zap, 
  ShieldCheck, 
  Monitor, 
  Globe, 
  Save, 
  RefreshCw,
  Cpu,
  Eye,
  Lock,
  Terminal
} from 'lucide-react';
import { Card, Badge, Button } from '../components/ui/Base';
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
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tight italic">Control <span className="text-primary not-italic">Center</span></h1>
          <p className="text-muted-foreground mt-2 font-black uppercase text-[10px] tracking-[0.3em]">System-Wide Parameters & Neural Tuning</p>
        </div>
        <Button variant="secondary" className="h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest border-white/5 gap-3">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Re-Sync Core
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* System Core Section */}
        <Card className="bg-[#0d0d0d] border-white/[0.05] rounded-[2.5rem] p-10 space-y-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5">
             <Globe className="w-32 h-32 text-primary" />
          </div>
          
          <div className="flex items-center gap-4 relative">
             <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Globe className="w-6 h-6 text-primary" />
             </div>
             <div>
                <h3 className="text-xl font-black text-white italic tracking-tight">System Core</h3>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Global Platform Identity</p>
             </div>
          </div>

          <div className="space-y-8 relative">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Platform Alias</label>
              <input 
                type="text" 
                value={settings.system_core.platformName}
                onChange={(e) => setSettings({ ...settings, system_core: { ...settings.system_core, platformName: e.target.value } })}
                onBlur={() => handleUpdate('system_core', settings.system_core)}
                className="w-full h-14 bg-white/[0.02] border border-white/5 rounded-2xl px-6 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Telemetry Endpoint</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={settings.system_core.webhookUrl}
                  onChange={(e) => setSettings({ ...settings, system_core: { ...settings.system_core, webhookUrl: e.target.value } })}
                  onBlur={() => handleUpdate('system_core', settings.system_core)}
                  className="w-full h-14 bg-white/[0.02] border border-white/5 rounded-2xl px-6 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-mono"
                />
                <Terminal className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10" />
              </div>
            </div>

            <div className="flex items-center justify-between p-6 bg-white/[0.01] border border-white/[0.03] rounded-2xl">
               <div className="flex items-center gap-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Core Synchronized</span>
               </div>
               <Badge variant="success" className="h-6">Active</Badge>
            </div>
          </div>
        </Card>

        {/* Neural Configuration Section */}
        <Card className="bg-[#0d0d0d] border-white/[0.05] rounded-[2.5rem] p-10 space-y-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5">
             <Cpu className="w-32 h-32 text-purple-500" />
          </div>
          
          <div className="flex items-center gap-4 relative">
             <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                <Cpu className="w-6 h-6 text-purple-500" />
             </div>
             <div>
                <h3 className="text-xl font-black text-white italic tracking-tight">Neural Tuning</h3>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Autonomous Logic Parameters</p>
             </div>
          </div>

          <div className="space-y-8 relative">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Model Architecture</label>
              <select 
                value={settings.neural_config.model}
                onChange={(e) => handleUpdate('neural_config', { ...settings.neural_config, model: e.target.value })}
                className="w-full h-14 bg-white/[0.02] border border-white/5 rounded-2xl px-6 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all appearance-none cursor-pointer"
              >
                <option value="GPT-4-Turbo">GPT-4-Turbo (Optimized)</option>
                <option value="Claude-3-Opus">Claude-3-Opus (High Reasoning)</option>
                <option value="Llama-3-70B">Llama-3-70B (Private Edge)</option>
              </select>
            </div>

            <div className="space-y-5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Creativity Bias (Temp)</label>
                <span className="text-sm font-black text-primary italic">{settings.neural_config.temperature}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                value={settings.neural_config.temperature}
                onChange={(e) => setSettings({ ...settings, neural_config: { ...settings.neural_config, temperature: parseFloat(e.target.value) } })}
                onMouseUp={() => handleUpdate('neural_config', settings.neural_config)}
                className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-30">
                <span>Deterministic</span>
                <span>Creative</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/[0.03] space-y-2">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Max Throughput</p>
                  <p className="text-xl font-black text-white italic tracking-tighter">{settings.neural_config.concurrentAnalysis} OPS</p>
               </div>
               <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/[0.03] space-y-2">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Ctx Window</p>
                  <p className="text-xl font-black text-white italic tracking-tighter">128k</p>
               </div>
            </div>
          </div>
        </Card>

        {/* Security & Telemetry Section */}
        <Card className="bg-[#0d0d0d] border-white/[0.05] rounded-[2.5rem] p-10 space-y-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5">
             <ShieldCheck className="w-32 h-32 text-emerald-500" />
          </div>
          
          <div className="flex items-center gap-4 relative">
             <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
             </div>
             <div>
                <h3 className="text-xl font-black text-white italic tracking-tight">Security Matrix</h3>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Access Control & Fraud Filter</p>
             </div>
          </div>

          <div className="space-y-8 relative">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2">
                <Eye className="w-3 h-3" /> Audit Log Verbosity
              </label>
              <div className="flex gap-3">
                 {['Low', 'Standard', 'Ultra'].map((level) => (
                   <button
                    key={level}
                    onClick={() => handleUpdate('security', { ...settings.security, auditLevel: level })}
                    className={cn(
                      "flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                      settings.security.auditLevel === level 
                        ? "bg-emerald-500 text-black border-emerald-500 shadow-xl shadow-emerald-500/20" 
                        : "bg-white/[0.02] text-white/40 border-white/5 hover:border-white/10"
                    )}
                   >
                     {level}
                   </button>
                 ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Master API Key</label>
                <Badge variant="danger" className="text-[8px]">Encrypted</Badge>
              </div>
              <div className="relative group">
                <input 
                  type="password" 
                  value="••••••••••••••••••••••••••••" 
                  readOnly
                  className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl px-6 text-sm font-medium text-white/20 focus:outline-none"
                />
                <Lock className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/5" />
              </div>
            </div>

            <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-5">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                 <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] leading-loose">
                Real-time fraud filter operating at 99.8% precision.
              </p>
            </div>
          </div>
        </Card>

        {/* Interface Preferences Section */}
        <Card className="bg-[#0d0d0d] border-white/[0.05] rounded-[2.5rem] p-10 space-y-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5">
             <Monitor className="w-32 h-32 text-blue-500" />
          </div>
          
          <div className="flex items-center gap-4 relative">
             <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <Monitor className="w-6 h-6 text-blue-500" />
             </div>
             <div>
                <h3 className="text-xl font-black text-white italic tracking-tight">Interface Deck</h3>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Aesthetic & UX Parameters</p>
             </div>
          </div>

          <div className="space-y-8 relative">
            <div className="flex items-center justify-between p-6 bg-white/[0.01] border border-white/[0.03] rounded-2xl group transition-all hover:bg-white/[0.03]">
               <div>
                  <h4 className="text-sm font-black text-white italic tracking-tight">Motion Graphics</h4>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1 opacity-60">High-Fidelity Transitions</p>
               </div>
               <button 
                onClick={() => handleUpdate('interface', { ...settings.interface, animations: !settings.interface.animations })}
                className={cn(
                  "w-14 h-8 rounded-full transition-all relative p-1",
                  settings.interface.animations ? "bg-primary" : "bg-white/10"
                )}
               >
                 <div className={cn(
                   "w-6 h-6 bg-white rounded-full shadow-xl transition-all transform",
                   settings.interface.animations ? "translate-x-6" : "translate-x-0"
                 )} />
               </button>
            </div>

            <div className="flex items-center justify-between p-6 bg-white/[0.01] border border-white/[0.03] rounded-2xl group transition-all hover:bg-white/[0.03]">
               <div>
                  <h4 className="text-sm font-black text-white italic tracking-tight">Glassmorphism Intensity</h4>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1 opacity-60">Backdrop Blur Strength</p>
               </div>
               <div className="flex gap-2">
                 {[0.5, 0.8, 1.0].map((v) => (
                   <button
                    key={v}
                    onClick={() => handleUpdate('interface', { ...settings.interface, glassmorphism: v })}
                    className={cn(
                      "w-10 h-10 rounded-lg text-[10px] font-black transition-all border",
                      settings.interface.glassmorphism === v 
                        ? "bg-white text-black border-white" 
                        : "bg-white/[0.02] text-white/40 border-white/5"
                    )}
                   >
                     {v}
                   </button>
                 ))}
               </div>
            </div>

            <Button variant="premium" className="w-full h-16 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 group">
              Save All Preferences <Save className="w-4 h-4 ml-2 group-hover:animate-bounce" />
            </Button>
          </div>
        </Card>
      </div>

      {saving && (
        <div className="fixed bottom-10 right-10 bg-primary text-black font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 flex items-center gap-3">
           <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating {saving.replace('_', ' ')} Vector...
        </div>
      )}
    </div>
  );
};
