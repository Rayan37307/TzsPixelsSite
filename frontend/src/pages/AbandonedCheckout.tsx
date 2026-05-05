import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '../components/ui/Base';
import { ShoppingCart, DollarSign, ShoppingBag, Loader2, Send } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const fetchAbandoned = async () => {
  const res = await fetch(`${API_BASE_URL}/shopify/abandoned`);
  const data = await res.json();
  return data;
};

function formatAmount(amount: number) {
  return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT' }).format(amount);
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-400">Failed to load abandoned checkouts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Abandoned Checkouts</h1>
          <p className="text-muted-foreground mt-1">Recover lost sales from incomplete transactions.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="primary" onClick={() => refetchMutation.mutate()} disabled={refetchMutation.isPending}>
            {refetchMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lost Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-red-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-400">{formatAmount(stats.lostRevenue)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Abandoned Carts</CardTitle>
            <ShoppingCart className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-white">{stats.totalAbandoned}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Product</CardTitle>
            <ShoppingBag className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-white truncate">
              {stats.topProducts[0]?.name || 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.topProducts[0]?.count || 0} abandoned
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/[0.01] border-b border-white/5">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Email</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Amount</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Items</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Created</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {checkouts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                  No abandoned checkouts found.
                </td>
              </tr>
            ) : (
              checkouts.map((checkout: any) => (
                <tr key={checkout.id} className="group">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-white">
                      {checkout.email || 'No email'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {checkout.customer?.firstName} {checkout.customer?.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-white">{formatAmount(checkout.amount)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex -space-x-2">
                      {(checkout.lineItems || []).slice(0, 3).map((_: any, i: number) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-white/10 border-2 border-background flex items-center justify-center">
                          <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ))}
                      {(checkout.lineItems || []).length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-background flex items-center justify-center text-xs text-muted-foreground">
                          +{checkout.lineItems.length - 3}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-muted-foreground">{formatDate(checkout.createdAt)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="warning">Abandoned</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {checkout.checkoutUrl && (
                        <a href={checkout.checkoutUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="h-8">
                            <Send className="w-4 h-4 mr-1" />
                            Send
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
      </Card>
    </div>
  );
};