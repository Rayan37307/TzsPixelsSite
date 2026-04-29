import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, CardDescription } from '../components/ui/Base';
import { Plus, CheckCircle2, AlertCircle, ExternalLink, Settings2, Power } from 'lucide-react';
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Courier Integration</h1>
          <p className="text-muted-foreground mt-1">Connect and manage your shipping partners for automated fulfillment.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
             <Settings2 className="w-4 h-4" /> Global Rules
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Custom Carrier
          </Button>
        </div>
      </div>

      {/* Connected Couriers Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">Connected Partners</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connectedCouriers.map((courier) => (
            <Card key={courier.id} className="relative group hover:border-primary/30 transition-all">
              <div className="absolute top-4 right-4">
                <Badge variant={courier.status === 'Active' ? 'success' : 'warning'}>
                  {courier.status}
                </Badge>
              </div>
              
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-white p-2 flex items-center justify-center overflow-hidden border border-white/10">
                   <img src={courier.logo} alt={courier.name} className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">{courier.name}</h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    ID: {courier.id * 1024} <ExternalLink className="w-3 h-3" />
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-t border-white/5">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Deliveries</p>
                  <p className="text-sm font-bold text-white">{courier.deliveries}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Success Rate</p>
                  <p className={cn(
                    "text-sm font-bold",
                    parseFloat(courier.successRate) > 95 ? "text-emerald-400" : "text-amber-400"
                  )}>{courier.successRate}</p>
                </div>
              </div>

              {courier.issue && (
                <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-[10px] text-red-400 font-medium">{courier.issue} detected</span>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-[10px] text-muted-foreground">Sync: {courier.lastSync}</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Settings2 className="w-4 h-4" />
                  </Button>
                  <Button variant="danger" size="sm" className="h-8 w-8 p-0 bg-red-500/5 border-none hover:bg-red-500/10">
                    <Power className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Available for Integration Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Available Integrations</h3>
          <div className="flex gap-2">
             <Badge variant="default" className="cursor-pointer hover:bg-white/20 transition-colors">All</Badge>
             <Badge variant="ghost" className="cursor-pointer hover:bg-white/10 transition-colors">Domestic</Badge>
             <Badge variant="ghost" className="cursor-pointer hover:bg-white/10 transition-colors">International</Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {availableCouriers.map((courier) => (
            <Card key={courier.name} className="p-4 hover:bg-white/[0.02] cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white p-1.5 border border-white/10">
                    <img src={courier.logo} alt={courier.name} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{courier.name}</p>
                    <p className="text-[10px] text-muted-foreground">{courier.category}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-8 text-[10px] px-3">Connect</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* API Documentation / Help Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> Smart Routing AI
            </CardTitle>
            <CardDescription className="text-primary/70">
              Automate courier selection based on cost, delivery time, and success rate.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <ul className="space-y-2">
               {[
                 'Automatic label generation',
                 'Real-time tracking synchronization',
                 'Automated weight verification',
                 'RTO (Return to Origin) reduction tools'
               ].map((feature) => (
                 <li key={feature} className="flex items-center gap-2 text-xs text-white">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary" /> {feature}
                 </li>
               ))}
             </ul>
             <Button className="w-full mt-6 bg-primary text-black">Enable Smart Routing</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhook Integration</CardTitle>
            <CardDescription>Receive instant updates from your courier partners.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-xl bg-black/50 border border-white/5 font-mono text-[10px] text-emerald-400">
               https://api.scalefy.ai/hooks/courier/v1/update
            </div>
            <p className="text-[10px] text-muted-foreground">
              Configure this endpoint in your carrier's developer dashboard to enable real-time tracking updates.
            </p>
            <Button variant="outline" className="w-full gap-2">
               <Copy className="w-3.5 h-3.5" /> Copy Endpoint
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

import { Copy } from 'lucide-react';
