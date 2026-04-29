import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '../components/ui/Base';
import { Send, Percent } from 'lucide-react';

export const AbandonedCheckout: React.FC = () => {
  const abandonedCarts = [
    { id: 'AC-9921', customer: 'Emma Watson', value: '$245.00', time: '15m ago', items: 3, status: 'Notified' },
    { id: 'AC-9922', customer: 'Liam Neeson', value: '$89.99', time: '45m ago', items: 1, status: 'Pending' },
    { id: 'AC-9923', customer: 'Zendaya', value: '$1,200.00', time: '2h ago', items: 5, status: 'Recovered' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Abandoned Checkouts</h1>
          <p className="text-muted-foreground mt-1">Recover lost sales with automated follow-ups.</p>
        </div>
        <Button>Recovery Settings</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Recovery Value</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-400">$12,450.00</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Recovery Rate</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-white">24.5%</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Active Carts</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-white">45</div></CardContent>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/[0.01] border-b border-white/5">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Cart ID</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Customer</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Value</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Time</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {abandonedCarts.map((cart) => (
              <tr key={cart.id} className="hover:bg-white/[0.01]">
                <td className="px-6 py-4 text-sm font-bold text-white">{cart.id}</td>
                <td className="px-6 py-4 text-sm text-white">{cart.customer}</td>
                <td className="px-6 py-4 text-sm text-white">{cart.value}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{cart.time}</td>
                <td className="px-6 py-4">
                   <Badge variant={cart.status === 'Recovered' ? 'success' : cart.status === 'Notified' ? 'info' : 'warning'}>
                    {cart.status}
                   </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                   <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" className="gap-2"><Send className="w-3 h-3" /> Remind</Button>
                      <Button variant="outline" size="sm" className="gap-2"><Percent className="w-3 h-3" /> Discount</Button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
