import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Globe,
  Phone,
  CreditCard,
  History,
  ScanLine,
  Loader2,
  ShieldCheck,
  ChevronDown,
  Truck,
} from 'lucide-react';
import { Card, Badge, Button } from '../components/ui/Base';
import { cn } from '../utils/cn';
import { fraudApi } from '../services/api';

export const FraudDetection: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['fraudChecks', statusFilter],
    queryFn: () => fraudApi.fetchFraudChecks(statusFilter || undefined),
  });

  const fraudList = data?.data || [];

  const scanMutation = useMutation({
    mutationFn: fraudApi.triggerFraudScan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fraudChecks'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      fraudApi.updateFraudStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fraudChecks'] });
    },
  });

  const courierMutation = useMutation({
    mutationFn: (orderId: string) => fraudApi.courierCheck(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fraudChecks'] });
    },
  });

  const courierAllMutation = useMutation({
    mutationFn: (orderIds: string[]) => fraudApi.courierCheckAll(orderIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fraudChecks'] });
    },
  });

  const getRiskLevel = (score: number): 'High' | 'Medium' | 'Low' => {
    if (score >= 70) return 'High';
    if (score >= 30) return 'Medium';
    return 'Low';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 rounded-full border-2 border-border border-t-[var(--color-accent)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Fraud shield</h1>
          <p className="font-mono text-sm text-muted-foreground mt-1">Risk assessment and prevention</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => scanMutation.mutate()}
            disabled={scanMutation.isPending}
            className="gap-2"
          >
            {scanMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ScanLine className="w-4 h-4" />
            )}
            Run scan
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => courierAllMutation.mutate(fraudList.map((i: any) => i.orderId || i.id))}
            disabled={courierAllMutation.isPending || fraudList.length === 0}
            className="gap-2"
          >
            {courierAllMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Truck className="w-4 h-4" />
            )}
            Courier check all
          </Button>
          <Button variant="secondary" size="md">Settings</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fraud list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-sm text-muted-foreground">Analysis feed</p>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-card border-2 border-border rounded-lg px-4 py-2 font-mono text-xs text-foreground focus:outline-none focus:border-[var(--color-accent)] appearance-none pr-8"
              >
                <option value="">Filter: all</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="blocked">Blocked</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {fraudList.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-24">
                <ShieldCheck className="w-12 h-12 text-muted-foreground mb-4 opacity-30" />
                <p className="font-mono text-sm text-muted-foreground">No threats detected</p>
            </Card>
          ) : (
          fraudList.map((item: any) => (
            <Card key={item.orderId || item.id} className="p-6 hover:border-[var(--color-border-hover)] transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-lg border-2 flex items-center justify-center font-mono text-lg font-bold",
                    getRiskLevel(item.riskScore) === 'High' ? 'border-[var(--color-danger)] text-[var(--color-danger)] bg-[var(--color-danger)]/10' :
                    getRiskLevel(item.riskScore) === 'Medium' ? 'border-[var(--color-warning)] text-[var(--color-warning)] bg-[var(--color-warning)]/10' : 'border-[var(--color-success)] text-[var(--color-success)] bg-[var(--color-success)]/10'
                  )}>
                    {item.riskScore}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-foreground">{item.orderId}</h4>
                      <Badge variant={getRiskLevel(item.riskScore) === 'High' ? 'danger' : getRiskLevel(item.riskScore) === 'Medium' ? 'warning' : 'success'}>
                        {getRiskLevel(item.riskScore)} risk
                      </Badge>
                    </div>
                    <p className="font-medium text-sm text-foreground mt-0.5">{item.customerName || item.customer}</p>
                    <p className="font-mono text-xs text-muted-foreground mt-1">
                       {item.amount ? `$${item.amount.toFixed(2)}` : ''} · {(item.riskReasons || item.reasons || []).join(', ')}
                    </p>
                    {item.courierData?.summary && (
                      <p className="font-mono text-xs text-muted-foreground mt-1">
                        Courier: {item.courierData.summary.success_ratio}% success
                        {item.courierData.reports?.length ? ` · ${item.courierData.reports.length} report(s)` : ''}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <Button
                     variant="secondary"
                     size="sm"
                     onClick={() => courierMutation.mutate(item.orderId || item.id)}
                     disabled={courierMutation.isPending}
                     className="gap-1.5"
                   >
                     {courierMutation.isPending && courierMutation.variables === (item.orderId || item.id) ? (
                       <Loader2 className="w-3.5 h-3.5 animate-spin" />
                     ) : (
                       <Truck className="w-3.5 h-3.5" />
                     )}
                     Courier
                   </Button>
                   <Button
                     variant="secondary"
                     size="sm"
                     className="border-[var(--color-success)] text-[var(--color-success)]"
                     onClick={() => updateStatusMutation.mutate({ orderId: item.orderId || item.id, status: 'approved' })}
                     disabled={updateStatusMutation.isPending}
                   >
                     Clear
                   </Button>
                   <Button
                     variant="secondary"
                     size="sm"
                     className="border-[var(--color-warning)] text-[var(--color-warning)]"
                     onClick={() => updateStatusMutation.mutate({ orderId: item.orderId || item.id, status: 'pending' })}
                     disabled={updateStatusMutation.isPending}
                   >
                     Secure
                   </Button>
                   <Button
                     variant="danger"
                     size="sm"
                     onClick={() => updateStatusMutation.mutate({ orderId: item.orderId || item.id, status: 'blocked' })}
                     disabled={updateStatusMutation.isPending}
                   >
                     Block
                   </Button>
                </div>
              </div>
            </Card>
          ))
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-black text-lg text-foreground tracking-tight mb-6">Risk analytics</h3>
            <div className="space-y-6">
               <div className="space-y-2">
                  <div className="flex items-center justify-between">
                     <span className="font-mono text-xs text-muted-foreground">Critical</span>
                     <span className="font-mono text-xs font-bold text-[var(--color-danger)]">12.4%</span>
                  </div>
                  <div className="w-full bg-border h-2 rounded-sm overflow-hidden">
                     <div className="bg-[var(--color-danger)] h-full rounded-sm w-[12.4%]" />
                  </div>
               </div>
               <div className="space-y-2">
                  <div className="flex items-center justify-between">
                     <span className="font-mono text-xs text-muted-foreground">Suspicious</span>
                     <span className="font-mono text-xs font-bold text-[var(--color-warning)]">28.1%</span>
                  </div>
                  <div className="w-full bg-border h-2 rounded-sm overflow-hidden">
                     <div className="bg-[var(--color-warning)] h-full rounded-sm w-[28.1%]" />
                  </div>
               </div>
               <div className="space-y-2">
                  <div className="flex items-center justify-between">
                     <span className="font-mono text-xs text-muted-foreground">Verified</span>
                     <span className="font-mono text-xs font-bold text-[var(--color-success)]">59.5%</span>
                  </div>
                  <div className="w-full bg-border h-2 rounded-sm overflow-hidden">
                     <div className="bg-[var(--color-success)] h-full rounded-sm w-[59.5%]" />
                  </div>
               </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-black text-lg text-foreground tracking-tight mb-6">Security vectors</h3>
            <div className="space-y-4">
               {[
                 { icon: Globe, label: 'Proxy detection', count: 45 },
                 { icon: Phone, label: 'VoIP usage', count: 12 },
                 { icon: CreditCard, label: 'Velocity triggers', count: 8 },
                 { icon: History, label: 'Negative pattern', count: 22 },
               ].map((item) => (
                 <div key={item.label} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-[var(--color-border-hover)] transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                       <item.icon className="w-4 h-4 text-muted-foreground" />
                       <span className="font-mono text-xs text-foreground">{item.label}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-foreground">{item.count}</span>
                 </div>
               ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
