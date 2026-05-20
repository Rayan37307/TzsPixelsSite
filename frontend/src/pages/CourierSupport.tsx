import React from 'react';
import { Card, Badge, Button } from '../components/ui/Base';
import { Plus, CheckCircle2, AlertCircle, ExternalLink, Settings2, Power, Truck, Zap, ShieldCheck, Copy, Globe, Search } from 'lucide-react';
import { cn } from '../utils/cn';

const connectedCouriers = [
  { 
    id: 1, 
    name: 'FedEx', 
    logo: 'https://logo.clearbit.com/fedex.com', 
    status: 'Active', 
    deliveries: '1,245', 
    successRate: '98.5%',
    lastSync: '5 mins ago'
  },
  { 
    id: 2, 
    name: 'DHL Express', 
    logo: 'https://logo.clearbit.com/dhl.com', 
    status: 'Active', 
    deliveries: '890', 
    successRate: '97.2%',
    lastSync: '12 mins ago'
  },
  { 
    id: 3, 
    name: 'UPS', 
    logo: 'https://logo.clearbit.com/ups.com', 
    status: 'Warning', 
    deliveries: '452', 
    successRate: '85.4%',
    lastSync: '1 hour ago',
    issue: 'API Latency'
  },
];

const availableCouriers = [
  { name: 'Aramex', category: 'International', logo: 'https://logo.clearbit.com/aramex.com' },
  { name: 'BlueDart', category: 'Domestic', logo: 'https://logo.clearbit.com/bluedart.com' },
  { name: 'Delhivery', category: 'Domestic', logo: 'https://logo.clearbit.com/delhivery.com' },
  { name: 'ShipRocket', category: 'Aggregator', logo: 'https://logo.clearbit.com/shiprocket.in' },
  { name: 'DTDC', category: 'Domestic', logo: 'https://logo.clearbit.com/dtdc.in' },
  { name: 'Ecom Express', category: 'Domestic', logo: 'https://logo.clearbit.com/ecomexpress.in' },
];

export const CourierSupport: React.FC = () => {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight italic">Courier <span className="text-primary not-italic">Logistics</span></h1>
          <p className="text-muted-foreground mt-2 font-medium tracking-wide uppercase text-[10px] tracking-[0.2em]">Automated Fulfillment Network</p>
        </div>
        <div className="flex gap-4">
          <Button variant="secondary" className="h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest border-white/5 gap-2">
             <Settings2 className="w-4 h-4" /> Logistics Rules
          </Button>
          <Button variant="premium" className="h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 shadow-xl shadow-primary/20">
            <Plus className="w-4 h-4" /> Link Carrier
          </Button>
        </div>
      </div>

      {/* Connected Couriers Section */}
      <div className="space-y-8">
        <div className="flex items-center gap-3 px-1">
           <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
           </div>
           <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Active Fleet Vector</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {connectedCouriers.map((courier) => (
            <Card key={courier.id} className="relative group p-0 overflow-hidden bg-[#0d0d0d] border-white/[0.05] rounded-[2.5rem] transition-all duration-500 hover:border-primary/30">
              <div className="absolute top-0 right-0 p-6 flex gap-3">
                <Badge variant={courier.status === 'Active' ? 'success' : 'warning'} className="h-6 rounded-md text-[8px] font-black uppercase tracking-widest">
                  {courier.status}
                </Badge>
              </div>
              
              <div className="p-8">
                <div className="flex items-start gap-5 mb-8">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-white p-3 flex items-center justify-center overflow-hidden border-4 border-white/[0.05] transition-transform group-hover:scale-110 shadow-2xl">
                     <img src={courier.logo} alt={courier.name} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-white italic tracking-tight">{courier.name}</h4>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mt-1 opacity-60">
                      ID: {courier.id * 1024} <ExternalLink className="w-3 h-3 text-primary" />
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 py-6 border-y border-white/[0.03]">
                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-50">Payload Units</p>
                    <p className="text-lg font-black text-white italic tracking-tight">{courier.deliveries}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-50">Precision Rate</p>
                    <p className={cn(
                      "text-lg font-black italic tracking-tight",
                      parseFloat(courier.successRate) > 95 ? "text-emerald-400" : "text-amber-400"
                    )}>{courier.successRate}</p>
                  </div>
                </div>

                {courier.issue && (
                  <div className="mt-6 p-3 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                       <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <span className="text-[9px] text-red-400 font-black uppercase tracking-widest">{courier.issue} Detected</span>
                  </div>
                )}

                <div className="mt-8 flex items-center justify-between pt-2">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40 italic">Sync: {courier.lastSync}</span>
                  <div className="flex gap-3">
                    <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl border-white/5 hover:bg-primary/10 hover:text-primary transition-all">
                      <Settings2 className="w-4 h-4" />
                    </Button>
                    <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl bg-red-500/5 border-red-500/10 text-red-400 hover:bg-red-500/10 transition-all">
                      <Power className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Available for Integration Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-1">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                 <Truck className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Available Carriers</h3>
           </div>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input type="text" placeholder="Filter..." className="bg-white/[0.02] border border-white/5 rounded-lg py-1.5 pl-9 pr-3 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-white/10" />
           </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {availableCouriers.map((courier) => (
            <Card key={courier.name} className="p-5 bg-white/[0.01] border-white/[0.05] rounded-[1.5rem] hover:bg-primary/[0.03] hover:border-primary/20 cursor-pointer group transition-all duration-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white p-2 border border-white/10 shadow-xl transition-transform group-hover:scale-110">
                    <img src={courier.logo} alt={courier.name} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white italic tracking-tight group-hover:text-primary transition-colors">{courier.name}</p>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-0.5 opacity-60">{courier.category}</p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" className="h-8 text-[9px] font-black uppercase tracking-widest px-4 rounded-lg border-white/5 group-hover:bg-primary group-hover:text-black transition-all">Link</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* API Documentation / Help Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <Card className="bg-primary/[0.03] border-primary/20 rounded-[2.5rem] p-10 relative overflow-hidden group">
          <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:opacity-10 transition-transform duration-700">
             <Zap className="w-48 h-48 text-primary" />
          </div>
          <div className="space-y-8 relative">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
               </div>
               <h3 className="text-xl font-black text-white italic tracking-tight">Smart Routing AI</h3>
            </div>
            <p className="text-sm font-medium text-white/60 leading-relaxed max-w-md">
              Optimize fulfillment overhead by dynamically allocating payload vectors based on fiscal efficiency and temporal precision.
            </p>
            <div className="space-y-4">
               {[
                 'Automatic label generation',
                 'Real-time tracking synchronization',
                 'Automated weight verification',
                 'RTO reduction tools'
               ].map((feature) => (
                 <div key={feature} className="flex items-center gap-4 group/item">
                    <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center transition-colors group-hover/item:bg-primary/20">
                      <CheckCircle2 className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">{feature}</span>
                 </div>
               ))}
            </div>
            <Button variant="premium" className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/20 mt-4">Activate Intelligent Router</Button>
          </div>
        </Card>

        <Card className="bg-[#0d0d0d] border-white/[0.05] rounded-[2.5rem] p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5">
             <Globe className="w-32 h-32 text-emerald-500" />
          </div>
          <div className="space-y-8 relative">
            <div>
              <h3 className="text-xl font-black text-white italic tracking-tight">Telemetry Webhook</h3>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Real-time Stream Integration</p>
            </div>
            
            <p className="text-sm font-medium text-white/60 leading-relaxed max-w-md">
              Inject this endpoint into your carrier's core telemetry hub to receive instant state transitions across your fleet.
            </p>

            <div className="bg-black/60 rounded-2xl p-6 border border-white/[0.05] font-mono text-[10px] text-emerald-400 relative group overflow-hidden">
               <code className="break-all leading-relaxed">
                  https://api.scalefy.ai/hooks/courier/v1/update
               </code>
               <Button variant="premium" size="sm" className="absolute top-4 right-4 h-8 px-4 rounded-lg font-black text-[8px] uppercase tracking-widest shadow-xl shadow-primary/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Copy className="w-3 h-3 mr-2" /> Copy String
               </Button>
            </div>

            <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-5">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                 <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] leading-loose">
                Telemetry handshake verified. Ready for bidirectional synchronization.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
