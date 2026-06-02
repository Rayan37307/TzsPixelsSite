import React, { useState } from 'react';
import {
  RefreshCw,
  Plus,
  CheckCircle2,
  Copy,
  Globe,
  Trash2,
  X,
  Zap,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { Card, Badge, Button } from '../components/ui/Base';
import { useStoreStore } from '../store/useStoreStore';
import { cn } from '../utils/cn';
import { storeApi } from '../services/api';

export const StoreIntegration: React.FC = () => {
  const { stores, addStore, removeStore, syncStore } = useStoreStore();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'Shopify' | 'WordPress' | null>(null);
  const [storeUrl, setStoreUrl] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeUrl) return;

    setIsConnecting(true);
    try {
      const connectData = {
        shopUrl: storeUrl,
        platform: modalType || 'Shopify',
        clientId: modalType === 'Shopify' ? clientId : undefined,
        clientSecret: modalType === 'Shopify' ? clientSecret : undefined,
        consumerKey: modalType === 'WordPress' ? consumerKey : undefined,
        consumerSecret: modalType === 'WordPress' ? consumerSecret : undefined
      };

      const result = await storeApi.connect(connectData);

      if (result.store) {
        addStore({
          name: result.store.name,
          platform: result.store.platform,
          url: result.store.url,
          accessToken: result.store.accessToken,
        });
      }

      setShowModal(false);
      setStoreUrl('');
      setClientId('');
      setClientSecret('');
      setConsumerKey('');
      setConsumerSecret('');
      setModalType(null);
    } catch (error: any) {
      console.error('Connection failed:', error);
      alert(error?.response?.data?.error || 'Failed to connect. Please check your credentials.');
    } finally {
      setIsConnecting(false);
    }
  };

  const openModal = (type: 'Shopify' | 'WordPress') => {
    setModalType(type);
    setStoreUrl('');
    setClientId('');
    setClientSecret('');
    setConsumerKey('');
    setConsumerSecret('');
    setShowModal(true);
  };

  return (
    <div className="pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Store integration</h1>
          <p className="font-mono text-sm text-muted-foreground mt-1">Connect and sync your stores</p>
        </div>
        <Button variant="secondary" size="md" className="gap-2">
          <Zap className="w-4 h-4" /> Refresh all
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stores list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stores.map((store) => (
              <Card key={store.id} className="p-6 relative group overflow-hidden">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Badge variant={store.status === 'Connected' ? 'success' : 'warning'}>
                    {store.status}
                  </Badge>
                  <button
                    onClick={() => removeStore(store.id)}
                    className="p-2 rounded-lg border-2 border-[var(--color-danger-dim)] text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-5">
                   <div className="w-12 h-12 rounded-lg bg-[var(--color-paper-3)] border-2 border-border flex items-center justify-center text-xl">
                     {store.platform === 'Shopify' ? 'S' : store.platform === 'WordPress' ? 'W' : 'C'}
                   </div>

                   <div>
                      <h3 className="text-lg font-black text-foreground tracking-tight">{store.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1 font-mono text-xs text-muted-foreground">
                         <Globe className="w-3 h-3" /> {store.url}
                      </div>
                   </div>

                   <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                        <RefreshCw className={cn("w-3 h-3", store.status === 'Syncing' && "animate-spin")} />
                        Last sync: {store.lastSync}
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => syncStore(store.id)}
                        disabled={store.status === 'Syncing'}
                      >
                        Sync
                      </Button>
                   </div>
                </div>
              </Card>
            ))}

            <div className="space-y-4">
               <button
                onClick={() => openModal('Shopify')}
                className="w-full h-[140px] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 hover:border-[var(--color-border-hover)] hover:bg-[var(--color-paper-3)] transition-all cursor-pointer"
               >
                <Plus className="w-6 h-6 text-muted-foreground" />
                <span className="font-mono text-xs text-muted-foreground">Connect Shopify</span>
              </button>

              <button
                onClick={() => openModal('WordPress')}
                className="w-full h-[140px] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 hover:border-[var(--color-border-hover)] hover:bg-[var(--color-paper-3)] transition-all cursor-pointer"
              >
                <Globe className="w-6 h-6 text-muted-foreground" />
                <span className="font-mono text-xs text-muted-foreground">Link WooCommerce</span>
              </button>
            </div>
          </div>

          {/* Manual integration */}
          <Card className="p-8">
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-black text-foreground tracking-tight">Manual integration</h3>
                <p className="font-mono text-sm text-muted-foreground mt-1">Embed script for custom stores</p>
              </div>

              <div className="bg-black/40 border-2 border-border rounded-lg p-6 relative group">
                <code className="font-mono text-xs text-[var(--color-accent)] break-all leading-relaxed block">
                  {`<script src="https://cdn.scalefy.ai/v1/pixel.js" data-id="SK_LIVE_9921"></script>`}
                </code>
                <Button variant="secondary" size="sm" className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                  <Copy className="w-3 h-3" /> Copy
                </Button>
              </div>

              <div className="flex items-center gap-3 p-4 border-2 border-[var(--color-accent)]/20 rounded-lg">
                 <CheckCircle2 className="w-5 h-5 text-[var(--color-accent)] shrink-0" />
                 <p className="font-mono text-xs text-muted-foreground">
                   Inject this script into the <code className="text-foreground font-bold">&lt;head&gt;</code> of your site to activate telemetry.
                 </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Integrations sidebar */}
        <div className="space-y-6">
          <Card className="p-8 border-2 border-[var(--color-accent)]/20">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-lg border-2 border-[var(--color-accent)]/30 flex items-center justify-center">
                   <Zap className="w-5 h-5 text-[var(--color-accent)]" />
                 </div>
                 <h3 className="font-black text-lg text-foreground tracking-tight">Webhooks</h3>
              </div>

              <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                Configure webhooks in your commerce engine for real-time data sync.
              </p>

              <div className="space-y-3">
                {['Orders created', 'Orders fulfilled', 'Checkout abandoned', 'Refunds processed'].map((step) => (
                  <div key={step} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)]" />
                    <span className="font-mono text-xs text-foreground">{step}</span>
                  </div>
                ))}
              </div>

              <Button variant="primary" size="md" className="w-full">Generate key</Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
               <Package className="w-5 h-5 text-muted-foreground" />
               <h3 className="font-black text-base text-foreground tracking-tight">Supported platforms</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['Shopify', 'Woo', 'Magento', 'BigComm', 'Wix', 'Presta'].map((p) => (
                <div key={p} className="flex items-center justify-center p-3 rounded-lg border-2 border-border font-mono text-xs text-muted-foreground cursor-pointer hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all">
                  {p}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 border-2 border-[var(--color-success)]/20 flex items-center gap-4">
             <ShieldCheck className="w-6 h-6 text-[var(--color-success)] shrink-0" />
             <div>
                <p className="font-mono text-xs font-bold text-[var(--color-success)]">Secure sync</p>
                <p className="font-mono text-xs text-muted-foreground mt-0.5">End-to-end encryption active</p>
             </div>
          </Card>
        </div>
      </div>

      {/* Integration modal */}
      {showModal && (
        <div className="fixed inset-0 bg-paper/80 z-50 flex items-center justify-center p-6">
           <Card className="w-full max-w-xl p-10 relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-lg border-2 border-border flex items-center justify-center hover:bg-[var(--color-paper-3)] transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                   <div className="w-10 h-10 rounded-lg border-2 border-[var(--color-accent)]/30 flex items-center justify-center">
                     {modalType === 'Shopify' ? <Zap className="w-5 h-5 text-[var(--color-accent)]" /> : <Globe className="w-5 h-5 text-[var(--color-accent)]" />}
                   </div>
                   <div>
                     <h2 className="text-2xl font-black text-foreground tracking-tight">Connect {modalType}</h2>
                     <p className="font-mono text-sm text-muted-foreground mt-0.5">Authentication</p>
                   </div>
                </div>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                  {modalType === 'Shopify'
                    ? 'Enter your Shopify store details to connect.'
                    : 'Configure your WooCommerce endpoint and API keys.'}
                </p>
              </div>

              <form onSubmit={handleConnect} className="space-y-6">
                <div className="space-y-2">
                  <label className="font-mono text-xs text-muted-foreground">Store URL</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={modalType === 'Shopify' ? 'your-store.myshopify.com' : 'https://yourwebsite.com'}
                      className="w-full h-12 bg-card border-2 border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-[var(--color-accent)] transition-all placeholder:text-muted-foreground"
                      value={storeUrl}
                      onChange={(e) => setStoreUrl(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                {modalType === 'Shopify' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="font-mono text-xs text-muted-foreground">Client ID</label>
                      <input
                        type="text"
                        placeholder="ID_XXXXX"
                        className="w-full h-12 bg-card border-2 border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-[var(--color-accent)] transition-all"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="font-mono text-xs text-muted-foreground">Secret</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full h-12 bg-card border-2 border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-[var(--color-accent)] transition-all"
                        value={clientSecret}
                        onChange={(e) => setClientSecret(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="font-mono text-xs text-muted-foreground">Consumer key</label>
                      <input
                        type="text"
                        placeholder="ck_xxxxxxxx"
                        className="w-full h-12 bg-card border-2 border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-[var(--color-accent)] transition-all"
                        value={consumerKey}
                        onChange={(e) => setConsumerKey(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="font-mono text-xs text-muted-foreground">Secret key</label>
                      <input
                        type="password"
                        placeholder="cs_xxxxxxxx"
                        className="w-full h-12 bg-card border-2 border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-[var(--color-accent)] transition-all"
                        value={consumerSecret}
                        onChange={(e) => setConsumerSecret(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                   <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                   <Button type="submit" variant="primary" className="flex-1" disabled={isConnecting}>
                      {isConnecting ? 'Connecting...' : 'Connect'}
                   </Button>
                </div>
              </form>
           </Card>
        </div>
      )}
    </div>
  );
};
