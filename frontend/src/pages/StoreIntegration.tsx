import React, { useState } from 'react';
import { 
  RefreshCw, 
  ExternalLink, 
  Plus,
  CheckCircle2,
  Copy,
  Layout,
  Globe,
  Trash2,
  X,
  Zap,
  ShieldCheck,
  Package
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
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight italic">Store <span className="text-primary not-italic">Integration</span></h1>
          <p className="text-muted-foreground mt-2 font-medium tracking-wide uppercase text-[10px] tracking-[0.2em]">Synchronized Commerce Nodes</p>
        </div>
        <div className="flex gap-4">
           <Button variant="secondary" className="h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest border-white/5 gap-2">
              <Zap className="w-4 h-4" /> Global Refresh
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Stores List */}
        <div className="lg:col-span-2 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {stores.map((store) => (
              <Card key={store.id} className="relative overflow-hidden group bg-[#0d0d0d] border-white/[0.05] rounded-[2.5rem] p-8 transition-all duration-500 hover:border-primary/30">
                <div className="absolute top-0 right-0 p-6 flex gap-3 translate-x-2 group-hover:translate-x-0 transition-transform">
                  <Badge variant={store.status === 'Connected' ? 'success' : 'warning'} className="h-6 rounded-md text-[8px] font-black uppercase tracking-widest">
                    {store.status}
                  </Badge>
                  <button 
                    onClick={() => removeStore(store.id)}
                    className="p-2 rounded-lg bg-red-500/5 text-red-400 border border-red-500/10 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-6">
                   <div className="w-16 h-16 rounded-[1.5rem] bg-white/[0.03] border border-white/5 flex items-center justify-center text-3xl shadow-2xl transition-transform group-hover:scale-110">
                     {store.platform === 'Shopify' ? '🛍️' : store.platform === 'WordPress' ? '🌐' : '🛒'}
                   </div>
                   
                   <div>
                      <h3 className="text-xl font-black text-white italic tracking-tight">{store.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                         <Globe className="w-3 h-3" /> {store.url}
                      </div>
                   </div>

                   <div className="flex items-center justify-between pt-6 border-t border-white/[0.03]">
                      <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50">
                        <RefreshCw className={cn("w-3 h-3", store.status === 'Syncing' && "animate-spin")} />
                        Last sync: {store.lastSync}
                      </div>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="h-9 px-5 rounded-xl font-black text-[9px] uppercase tracking-widest border-white/5"
                        onClick={() => syncStore(store.id)}
                        disabled={store.status === 'Syncing'}
                      >
                        Push Sync
                      </Button>
                   </div>
                </div>
              </Card>
            ))}
            
            <div className="grid grid-cols-1 gap-4">
               <button 
                onClick={() => openModal('Shopify')}
                className="group relative h-[140px] bg-white/[0.01] border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:bg-white/[0.03] hover:border-primary/30 transition-all duration-500"
               >
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                  <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                </div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] group-hover:text-white transition-colors">Initialize Shopify</span>
              </button>
              
              <button 
                onClick={() => openModal('WordPress')}
                className="group relative h-[140px] bg-white/[0.01] border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:bg-white/[0.03] hover:border-primary/30 transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                  <Globe className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                </div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] group-hover:text-white transition-colors">Link WooCommerce</span>
              </button>
            </div>
          </div>

          <Card className="bg-[#0d0d0d] border-white/[0.05] rounded-[2.5rem] p-10 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-10 opacity-5">
               <Copy className="w-32 h-32" />
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black text-white italic tracking-tight">Manual Integration</h3>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Cross-Environment Neural Bridge</p>
              </div>
              
              <div className="bg-black/60 rounded-2xl p-6 border border-white/[0.05] font-mono text-[11px] text-primary relative group">
                <code className="break-all leading-relaxed">
                  {`<script src="https://cdn.scalefy.ai/v1/pixel.js" data-id="SK_LIVE_9921"></script>`}
                </code>
                <Button variant="premium" size="sm" className="absolute top-4 right-4 h-8 px-4 rounded-lg font-black text-[8px] uppercase tracking-widest shadow-xl shadow-primary/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Copy className="w-3 h-3 mr-2" /> Copy String
                </Button>
              </div>

              <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                 <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                 </div>
                 <p className="text-[10px] font-black text-primary/80 uppercase tracking-widest leading-loose">
                   Inject this signal vector into the <span className="text-white">&lt;head&gt;</span> block of your custom environment to activate real-time telemetry.
                 </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Integration Guides */}
        <div className="space-y-10">
          <Card className="bg-primary/[0.03] border-primary/20 rounded-[2.5rem] p-10 relative overflow-hidden group">
            <div className="absolute -bottom-10 -right-10 opacity-5 transition-transform group-hover:scale-110 duration-700">
               <Zap className="w-48 h-48 text-primary" />
            </div>
            <div className="space-y-8 relative">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                   <Layout className="w-6 h-6 text-primary" />
                 </div>
                 <h3 className="text-xl font-black text-white italic tracking-tight">Webhook Protocol</h3>
              </div>
              
              <p className="text-sm font-medium text-white/60 leading-relaxed">
                Activate real-time data streams by configuring reactive webhooks in your core commerce engine.
              </p>

              <div className="space-y-4">
                {[
                  'Orders created',
                  'Orders fulfilled',
                  'Checkout abandoned',
                  'Refunds processed'
                ].map((step) => (
                  <div key={step} className="flex items-center gap-4 group/item">
                    <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center transition-colors group-hover/item:bg-primary/20">
                      <CheckCircle2 className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">{step}</span>
                  </div>
                ))}
              </div>
              
              <Button variant="premium" className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/20 mt-6">Generate Secure Key</Button>
            </div>
          </Card>

          <Card className="bg-[#0d0d0d] border-white/[0.05] rounded-[2.5rem] p-10">
            <div className="flex items-center gap-4 mb-8">
               <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
                 <Package className="w-5 h-5 text-muted-foreground" />
               </div>
               <h3 className="text-lg font-black text-white italic tracking-tight">Validated Vectors</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {['Shopify', 'Woo', 'Magento', 'BigComm', 'Wix', 'Presta'].map((p) => (
                <div key={p} className="flex items-center justify-center p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer hover:bg-primary/10 hover:border-primary/20 hover:text-primary transition-all duration-300">
                  {p}
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-emerald-500/[0.03] border-emerald-500/20 rounded-[2.5rem] p-8 flex items-center gap-5">
             <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
               <ShieldCheck className="w-6 h-6 text-emerald-500" />
             </div>
             <div>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Secure Sync</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">End-to-End Encryption Active</p>
             </div>
          </Card>
        </div>
      </div>

      {/* Integration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
           <Card className="w-full max-w-xl bg-[#0d0d0d] border-white/[0.05] rounded-[3rem] p-10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-transparent" />
              
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-10">
                <div className="flex items-center gap-4 mb-2">
                   <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                     {modalType === 'Shopify' ? <Zap className="w-6 h-6 text-primary" /> : <Globe className="w-6 h-6 text-primary" />}
                   </div>
                   <div>
                     <h2 className="text-2xl font-black text-white italic tracking-tight italic">Link {modalType}</h2>
                     <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Authentication Sequence</p>
                   </div>
                </div>
                <p className="text-sm font-medium text-white/50 leading-relaxed mt-6">
                  {modalType === 'Shopify' 
                    ? 'Enter your Shopify store designation to establish a secure neural link between our cores.'
                    : 'Configure your WooCommerce endpoint and API secret keys for deep-level synchronization.'}
                </p>
              </div>

              <form onSubmit={handleConnect} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
                    {modalType === 'Shopify' ? 'Signal URL' : 'Base Endpoint'}
                  </label>
                  <div className="relative group">
                    <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input 
                      type="text" 
                      placeholder={modalType === 'Shopify' ? 'your-store.myshopify.com' : 'https://yourwebsite.com'} 
                      className="w-full h-14 bg-white/[0.02] border border-white/5 rounded-[1.5rem] py-3 pl-14 pr-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/10"
                      value={storeUrl}
                      onChange={(e) => setStoreUrl(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                {modalType === 'Shopify' ? (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Client Identifier</label>
                      <input 
                        type="text" 
                        placeholder="ID_XXXXX" 
                        className="w-full h-14 bg-white/[0.02] border border-white/5 rounded-[1.25rem] px-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/10"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Security Secret</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        className="w-full h-14 bg-white/[0.02] border border-white/5 rounded-[1.25rem] px-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/10"
                        value={clientSecret}
                        onChange={(e) => setClientSecret(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Consumer Vector</label>
                      <input 
                        type="text" 
                        placeholder="ck_xxxxxxxx" 
                        className="w-full h-14 bg-white/[0.02] border border-white/5 rounded-[1.25rem] px-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/10"
                        value={consumerKey}
                        onChange={(e) => setConsumerKey(e.target.value)}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Secret Key</label>
                      <input 
                        type="password" 
                        placeholder="cs_xxxxxxxx" 
                        className="w-full h-14 bg-white/[0.02] border border-white/5 rounded-[1.25rem] px-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/10"
                        value={consumerSecret}
                        onChange={(e) => setConsumerSecret(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-6">
                   <Button type="button" variant="secondary" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] border-white/5" onClick={() => setShowModal(false)}>Cancel Sequence</Button>
                   <Button type="submit" variant="premium" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20" disabled={isConnecting}>
                      {isConnecting ? <RefreshCw className="w-5 h-5 animate-spin" /> : `Initiate Connection`}
                   </Button>
                </div>
              </form>
           </Card>
        </div>
      )}
    </div>
  );
};
