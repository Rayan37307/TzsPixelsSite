import React, { useState, useEffect } from 'react';
import { settingsApi } from '../services/api';
import {
  RefreshCw,
  Cpu,
  Key,
  ShieldCheck,
} from 'lucide-react';
import { Card, Badge } from '../components/ui/Base';

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
        <div className="w-10 h-10 rounded-full border-2 border-border border-t-[var(--color-accent)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="text-center py-10 mb-6">
        <Badge variant="primary" className="mb-4 border-2">Settings</Badge>
        <h1 className="text-5xl font-black text-foreground tracking-tight mb-2">Control center</h1>
        <p className="font-mono text-sm text-muted-foreground">API credentials and configuration</p>
      </div>

      <Card className="p-10 relative">
        <div className="flex items-center gap-5 mb-10">
           <div className="w-12 h-12 rounded-lg border-2 border-[var(--color-accent)]/30 flex items-center justify-center">
              <Cpu className="w-6 h-6 text-[var(--color-accent)]" />
           </div>
           <div>
              <h3 className="text-2xl font-black text-foreground tracking-tight">AI configuration</h3>
              <p className="font-mono text-sm text-muted-foreground mt-0.5">Engine and API keys</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="font-mono text-xs text-muted-foreground">Active model</label>
              <div className="relative">
                <select
                  value={settings.neural_config?.model || 'GPT-4-Turbo'}
                  onChange={(e) => handleUpdate('neural_config', { ...settings.neural_config, model: e.target.value })}
                  className="w-full h-12 bg-card border-2 border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-[var(--color-accent)] transition-all appearance-none cursor-pointer"
                >
                  <option value="GPT-4-Turbo">GPT-4-Turbo (Intelligence)</option>
                  <option value="Gemini-1.5-Pro">Gemini 1.5 Pro (Accuracy)</option>
                  <option value="Claude-3-Opus">Claude 3 Opus (Reasoning)</option>
                </select>
                <RefreshCw className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="p-5 border-2 border-[var(--color-accent)]/20 rounded-lg flex items-center gap-4">
              <ShieldCheck className="w-5 h-5 text-[var(--color-accent)] shrink-0" />
              <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                Engine integrity verified for high-concurrency analysis.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="font-mono text-xs text-muted-foreground">Gemini API key</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter key..."
                  value={settings.neural_config?.geminiKey || ''}
                  onChange={(e) => setSettings({ ...settings, neural_config: { ...settings.neural_config, geminiKey: e.target.value } })}
                  onBlur={() => handleUpdate('neural_config', settings.neural_config)}
                  className="w-full h-12 bg-card border-2 border-border rounded-lg px-4 pr-12 text-sm text-foreground focus:outline-none focus:border-[var(--color-accent)] transition-all"
                />
                <Key className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="font-mono text-xs text-muted-foreground">ChatGPT API key</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter key..."
                  value={settings.neural_config?.chatgptKey || ''}
                  onChange={(e) => setSettings({ ...settings, neural_config: { ...settings.neural_config, chatgptKey: e.target.value } })}
                  onBlur={() => handleUpdate('neural_config', settings.neural_config)}
                  className="w-full h-12 bg-card border-2 border-border rounded-lg px-4 pr-12 text-sm text-foreground focus:outline-none focus:border-[var(--color-accent)] transition-all"
                />
                <Key className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {saving && (
        <div className="fixed bottom-8 right-8 bg-card border-2 border-border text-foreground font-mono text-xs px-6 py-4 rounded-lg flex items-center gap-3 z-[100]">
           <RefreshCw className="w-4 h-4 animate-spin" /> Saving {saving.replace('_', ' ')}...
        </div>
      )}
    </div>
  );
};
