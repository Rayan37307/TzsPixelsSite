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
  X
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from '../components/ui/Base';
import { useStoreStore } from '../store/useStoreStore';
import { cn } from '../utils/cn';
import { storeApi, orderApi } from '../services/api';

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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Store Integration</h1>
          <p className="text-muted-foreground mt-1">Connect and sync your ecommerce platforms.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stores List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stores.map((store) => (
              <Card key={store.id} className="relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 flex gap-2">
                  <Badge variant={store.status === 'Connected' ? 'success' : 'warning'}>
                    {store.status}
                  </Badge>
                  <button 
                    onClick={() => removeStore(store.id)}
                    className="p-1 rounded bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 text-xl">
                    {store.platform === 'Shopify' ? '🛍️' : store.platform === 'WordPress' ? '🌐' : '🛒'}
                  </div>
                  <CardTitle>{store.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    {store.url} <ExternalLink className="w-3 h-3" />
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mt-4 py-3 border-t border-white/5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <RefreshCw className={cn("w-3 h-3", store.status === 'Syncing' && "animate-spin")} />
                      Last sync: {store.lastSync}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => syncStore(store.id)}
                      disabled={store.status === 'Syncing'}
                    >
                      Sync
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <div className="grid grid-cols-1 gap-3">
               <button 
                onClick={() => openModal('Shopify')}
                className="border-2 border-dashed border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-white/[0.02] transition-colors group"
               >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Connect Shopify</span>
              </button>
              
              <button 
                onClick={() => openModal('WordPress')}
                className="border-2 border-dashed border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-white/[0.02] transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Globe className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Connect WooCommerce</span>
              </button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Manual Integration</CardTitle>
              <CardDescription>Use our JS tracking script for custom storefronts.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-black/50 rounded-xl p-4 border border-white/5 font-mono text-xs text-primary overflow-x-auto">
                {`<script src="https://cdn.scalefy.ai/v1/pixel.js" data-id="SK_LIVE_9921"></script>`}
              </div>
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-muted-foreground">Place this script inside the {`<head>`} tag of your store.</p>
                <Button variant="outline" size="sm" className="gap-2">
                  <Copy className="w-3 h-3" /> Copy Script
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integration Guides */}
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Layout className="w-4 h-4" /> Setup Webhooks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                To receive real-time order updates, ensure you've configured webhooks in your store admin.
              </p>
              <ul className="mt-4 space-y-3">
                {[
                  'Orders created',
                  'Orders fulfilled',
                  'Checkout abandoned',
                  'Refunds processed'
                ].map((step) => (
                  <li key={step} className="flex items-center gap-2 text-xs text-white font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> {step}
                  </li>
                ))}
              </ul>
              <Button className="w-full mt-6 bg-primary text-black">Get API Key</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platforms</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {['Shopify', 'Woo', 'Magento', 'BigCommerce', 'Wix', 'Presta'].map((p) => (
                <div key={p} className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/5 text-xs font-medium text-white cursor-pointer hover:bg-white/10">
                  {p}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Integration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <Card className="w-full max-w-md border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-200">
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <CardHeader>
                <CardTitle>Connect {modalType}</CardTitle>
                <CardDescription>
                  {modalType === 'Shopify' 
                    ? 'Enter your Shopify store domain to begin the secure integration.'
                    : 'Enter your WordPress/WooCommerce site URL and API credentials.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleConnect} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      {modalType === 'Shopify' ? 'Store Domain' : 'Website URL'}
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input 
                        type="text" 
                        placeholder={modalType === 'Shopify' ? 'your-store.myshopify.com' : 'https://yourwebsite.com'} 
                        className="w-full bg-background border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                        value={storeUrl}
                        onChange={(e) => setStoreUrl(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  {modalType === 'Shopify' ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                          Client ID
                        </label>
                        <div className="relative">
                          <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input 
                            type="text" 
                            placeholder="Enter Client ID" 
                            className="w-full bg-background border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                          Client Secret
                        </label>
                        <div className="relative">
                          <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input 
                            type="password" 
                            placeholder="Enter Client Secret" 
                            className="w-full bg-background border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                            value={clientSecret}
                            onChange={(e) => setClientSecret(e.target.value)}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                          Consumer Key
                        </label>
                        <div className="relative">
                          <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input 
                            type="text" 
                            placeholder="ck_xxxxxxxxxxxxxxxx" 
                            className="w-full bg-background border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                            value={consumerKey}
                            onChange={(e) => setConsumerKey(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                          Consumer Secret
                        </label>
                        <div className="relative">
                          <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input 
                            type="password" 
                            placeholder="cs_xxxxxxxxxxxxxxxx" 
                            className="w-full bg-background border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                            value={consumerSecret}
                            onChange={(e) => setConsumerSecret(e.target.value)}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <Button type="submit" className="w-full h-12" disabled={isConnecting}>
                    {isConnecting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      `Connect ${modalType}`
                    )}
                  </Button>
                </form>
              </CardContent>
           </Card>
        </div>
      )}
    </div>
  );
};
