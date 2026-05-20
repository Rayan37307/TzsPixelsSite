import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Badge, Button } from '../components/ui/Base';
import { ShoppingCart, DollarSign, ShoppingBag, Loader2, Send, Clock, TrendingDown } from 'lucide-react';
import { cn } from '../utils/cn';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const fetchAbandoned = async () => {
  const res = await fetch(`${API_BASE_URL}/shopify/abandoned`);
  const data = await res.json();
  return data;
};

function formatAmount(amount: number) {
  return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export const AbandonedCheckout: React.FC = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['abandoned'],
    queryFn: fetchAbandoned,
    refetchInterval: 1800000,
  });

  const checkouts = data?.data || [];
  const stats = data?.stats || { totalAbandoned: 0, lostRevenue: 0, currency: 'BDT', topProducts: [] };

  const refetchMutation = useMutation({
    mutationFn: fetchAbandoned,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['abandoned'] }),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-12 h-12 rounded-full border-t-2 border-primary animate-spin" />
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Scanning Carts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="flex flex-col items-center justify-center h-96 bg-red-500/5 border-red-500/10 rounded-[2.5rem]">
        <TrendingDown className="w-12 h-12 text-red-400 mb-4 opacity-50" />
        <p className="text-sm font-black text-red-400 uppercase tracking-widest">Failed to stabilize data stream</p>
        <Button variant="outline" className="mt-6 border-red-500/20 text-red-400" onClick={() => queryClient.invalidateQueries({ queryKey: ['abandoned'] })}>Reconnect</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight italic">Abandoned <span className="text-primary not-italic">Checkouts</span></h1>
          <p className="text-muted-foreground mt-2 font-medium tracking-wide uppercase text-[10px] tracking-[0.2em]">Revenue Recovery Matrix</p>
        </div>
        <div className="flex gap-4">
          <Button variant="premium" className="h-14 px-8 rounded-2xl gap-3 font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/20" onClick={() => refetchMutation.mutate()} disabled={refetchMutation.isPending}>
            {refetchMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
            Rescan Vector
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="bg-[#0d0d0d] border-white/[0.05] rounded-[2.5rem] p-8 group hover:border-red-500/30 transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
             <DollarSign className="w-24 h-24 text-red-500" />
          </div>
          <div className="flex flex-col gap-6">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-500" />
            </div>
            <div>
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Estimated Leakage</p>
               <div className="text-3xl font-black text-white italic tracking-tight">{formatAmount(stats.lostRevenue)}</div>
            </div>
          </div>
        </Card>

        <Card className="bg-[#0d0d0d] border-white/[0.05] rounded-[2.5rem] p-8 group hover:border-primary/30 transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
             <ShoppingCart className="w-24 h-24 text-primary" />
          </div>
          <div className="flex flex-col gap-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-primary" />
            </div>
            <div>
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Abandoned Units</p>
               <div className="text-3xl font-black text-white italic tracking-tight">{stats.totalAbandoned} <span className="text-xs text-muted-foreground not-italic font-bold">CARTS</span></div>
            </div>
          </div>
        </Card>

        <Card className="bg-[#0d0d0d] border-white/[0.05] rounded-[2.5rem] p-8 group hover:border-emerald-500/30 transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
             <ShoppingBag className="w-24 h-24 text-emerald-500" />
          </div>
          <div className="flex flex-col gap-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Critical Product</p>
               <div className="text-xl font-black text-white truncate max-w-[200px] italic tracking-tight">
                 {stats.topProducts[0]?.name || 'NO DATA'}
               </div>
               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">
                 {stats.topProducts[0]?.count || 0} SELECTIONS
               </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="bg-[#0d0d0d] border-white/[0.05] rounded-[3rem] overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary/30 via-transparent to-transparent" />
        <div className="p-8 border-b border-white/[0.03]">
           <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic flex items-center gap-3">
             <Clock className="w-4 h-4 text-primary" />
             Live Abandonment Stream
           </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.01]">
                <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Entity / Customer</th>
                <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Transaction Value</th>
                <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Payload Items</th>
                <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Temporal Offset</th>
                <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Signal Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-right">Intervention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {checkouts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center justify-center opacity-20">
                       <ShoppingCart className="w-12 h-12 mb-4" />
                       <p className="text-[10px] font-black uppercase tracking-widest">No active abandonment detected</p>
                    </div>
                  </td>
                </tr>
              ) : (
                checkouts.map((checkout: any) => (
                  <tr key={checkout.id} className="group hover:bg-white/[0.01] transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center font-black text-xs text-primary">
                          {checkout.customer?.firstName?.[0] || '?'}{checkout.customer?.lastName?.[0] || ''}
                        </div>
                        <div>
                          <div className="text-sm font-black text-white tracking-tight">
                            {checkout.email || 'NO_IDENTIFIER'}
                          </div>
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 opacity-60">
                            {checkout.customer?.firstName} {checkout.customer?.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm font-black text-white italic">
                      {formatAmount(checkout.amount)}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex -space-x-3 group-hover:-space-x-1 transition-all duration-300">
                        {(checkout.lineItems || []).slice(0, 3).map((item: any, i: number) => (
                          <div key={i} className="w-9 h-9 rounded-xl bg-[#111] border-2 border-[#0d0d0d] flex items-center justify-center overflow-hidden shadow-xl" title={item.name}>
                             <ShoppingBag className="w-4 h-4 text-primary/50" />
                          </div>
                        ))}
                        {(checkout.lineItems || []).length > 3 && (
                          <div className="w-9 h-9 rounded-xl bg-primary/10 border-2 border-[#0d0d0d] flex items-center justify-center text-[10px] font-black text-primary shadow-xl">
                            +{checkout.lineItems.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                      {formatDate(checkout.createdAt)}
                    </td>
                    <td className="px-8 py-6">
                      <Badge variant="warning" className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                        ABANDONED
                      </Badge>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                        {checkout.checkoutUrl && (
                          <a href={checkout.checkoutUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="premium" size="sm" className="h-9 px-5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl shadow-primary/10">
                              <Send className="w-3.5 h-3.5 mr-2" />
                              RECOVER
                            </Button>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};