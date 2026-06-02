import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Badge, Button } from '../components/ui/Base';
import { ShoppingCart, ShoppingBag, Loader2, Send, Clock, TrendingDown } from 'lucide-react';

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
        <div className="w-10 h-10 rounded-full border-2 border-border border-t-[var(--color-accent)] animate-spin" />
        <p className="font-mono text-sm text-muted-foreground">Scanning carts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="flex flex-col items-center justify-center h-96 border-2 border-[var(--color-danger-dim)]">
        <TrendingDown className="w-12 h-12 text-[var(--color-danger)] mb-4 opacity-50" />
        <p className="font-mono text-sm text-muted-foreground">Failed to load data</p>
        <Button variant="outline" className="mt-6" onClick={() => queryClient.invalidateQueries({ queryKey: ['abandoned'] })}>Retry</Button>
      </Card>
    );
  }

  return (
    <div className="pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Abandoned checkouts</h1>
          <p className="font-mono text-sm text-muted-foreground mt-1">Recover lost revenue</p>
        </div>
        <div className="flex gap-3">
          <Button variant="primary" size="md" onClick={() => refetchMutation.mutate()} disabled={refetchMutation.isPending} className="gap-2">
            {refetchMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
            Rescan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="p-6 border-2 border-[var(--color-danger)]/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg border-2 border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-[var(--color-danger)]" />
            </div>
            <p className="font-mono text-xs text-muted-foreground">Estimated leakage</p>
          </div>
          <p className="text-3xl font-black text-foreground tracking-tight">{formatAmount(stats.lostRevenue)}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg border-2 border-border bg-[var(--color-paper-3)] flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="font-mono text-xs text-muted-foreground">Abandoned units</p>
          </div>
          <p className="text-3xl font-black text-foreground tracking-tight">{stats.totalAbandoned} <span className="font-mono text-sm font-normal text-muted-foreground">carts</span></p>
        </Card>

        <Card className="p-6 border-2 border-[var(--color-success)]/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg border-2 border-[var(--color-success)]/30 bg-[var(--color-success)]/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-[var(--color-success)]" />
            </div>
            <p className="font-mono text-xs text-muted-foreground">Top abandoned product</p>
          </div>
          <p className="text-xl font-black text-foreground tracking-tight truncate">
            {stats.topProducts[0]?.name || 'No data'}
          </p>
          <p className="font-mono text-xs text-[var(--color-success)] mt-1">
            {stats.topProducts[0]?.count || 0} selections
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-border">
           <h3 className="font-black text-base text-foreground tracking-tight flex items-center gap-2">
             <Clock className="w-4 h-4 text-muted-foreground" />
             Live abandonment stream
           </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-paper-3)]">
                {['Customer', 'Value', 'Items', 'Time', 'Status', ''].map((h) => (
                  <th key={h} className="px-6 py-4 font-mono text-xs text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {checkouts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center opacity-20">
                       <ShoppingCart className="w-12 h-12 mb-4" />
                       <p className="font-mono text-sm">No abandonments detected</p>
                    </div>
                  </td>
                </tr>
              ) : (
                checkouts.map((checkout: any) => (
                  <tr key={checkout.id} className="group hover:bg-[var(--color-paper-3)] transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[var(--color-paper-3)] border-2 border-border flex items-center justify-center font-bold font-mono text-xs text-foreground">
                          {checkout.customer?.firstName?.[0] || '?'}{checkout.customer?.lastName?.[0] || ''}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-foreground">
                            {checkout.email || 'No identifier'}
                          </div>
                          <div className="font-mono text-xs text-muted-foreground mt-0.5">
                            {checkout.customer?.firstName} {checkout.customer?.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-mono text-sm font-bold text-foreground">
                      {formatAmount(checkout.amount)}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex -space-x-2">
                        {(checkout.lineItems || []).slice(0, 3).map((item: any, i: number) => (
                          <div key={i} className="w-8 h-8 rounded-lg bg-[var(--color-paper-3)] border-2 border-card flex items-center justify-center" title={item.name}>
                             <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                          </div>
                        ))}
                        {(checkout.lineItems || []).length > 3 && (
                          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 border-2 border-card flex items-center justify-center font-mono text-xs font-bold text-[var(--color-accent)]">
                            +{checkout.lineItems.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 font-mono text-xs text-muted-foreground">
                      {formatDate(checkout.createdAt)}
                    </td>
                    <td className="px-6 py-5">
                      <Badge variant="warning">Abandoned</Badge>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {checkout.checkoutUrl && (
                          <a href={checkout.checkoutUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="primary" size="sm" className="gap-2">
                              <Send className="w-3.5 h-3.5" />
                              Recover
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
