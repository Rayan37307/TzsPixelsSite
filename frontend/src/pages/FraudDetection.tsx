import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Globe, 
  Phone, 
  CreditCard,
  History,
  ScanLine,
  Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '../components/ui/Base';
import { cn } from '../utils/cn';
import { fraudApi } from '../services/api';

export const FraudDetection: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: fraudList = [], isLoading, error } = useQuery({
    queryKey: ['fraudChecks', statusFilter],
    queryFn: () => fraudApi.fetchFraudChecks(statusFilter || undefined),
  });

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

  const getRiskLevel = (score: number): 'High' | 'Medium' | 'Low' => {
    if (score >= 70) return 'High';
    if (score >= 30) return 'Medium';
    return 'Low';
  };

  const formatAmount = (amount: number) => `$${amount.toFixed(2)}`;

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
        <p className="text-red-400">Failed to load fraud checks. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Fraud Detection</h1>
          <p className="text-muted-foreground mt-1">Real-time risk assessment and fraud prevention.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="primary" 
            onClick={() => scanMutation.mutate()}
            disabled={scanMutation.isPending}
          >
            {scanMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ScanLine className="w-4 h-4 mr-2" />
            )}
            Scan Now
          </Button>
          <Button variant="outline">Block Settings</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Fraud List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Pending Review</h3>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          {fraudList.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No fraud checks found.
              </CardContent>
            </Card>
          ) : (
          fraudList.map((item: any) => (
            <Card key={item.orderId || item.id} className="group cursor-pointer hover:ring-1 hover:ring-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold",
                    getRiskLevel(item.riskScore) === 'High' ? 'bg-red-500/20 text-red-400' : 
                    getRiskLevel(item.riskScore) === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                  )}>
                    {item.riskScore}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      {item.orderId} • {item.customerName || item.customer}
                      <Badge variant={getRiskLevel(item.riskScore) === 'High' ? 'danger' : getRiskLevel(item.riskScore) === 'Medium' ? 'warning' : 'success'}>
                        {getRiskLevel(item.riskScore)} Risk
                      </Badge>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">Amount: {formatAmount(item.amount)} • {(item.riskReasons || item.reasons || []).join(', ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Button 
                     variant="outline" 
                     size="sm" 
                     className="h-8 text-emerald-400 hover:bg-emerald-500/10"
                     onClick={() => updateStatusMutation.mutate({ orderId: item.orderId || item.id, status: 'approved' })}
                     disabled={updateStatusMutation.isPending}
                   >
                     Approve
                   </Button>
                   <Button 
                     variant="outline" 
                     size="sm" 
                     className="h-8 text-amber-400 hover:bg-amber-500/10"
                     onClick={() => updateStatusMutation.mutate({ orderId: item.orderId || item.id, status: 'pending' })}
                     disabled={updateStatusMutation.isPending}
                   >
                     Hold
                   </Button>
                   <Button 
                     variant="danger" 
                     size="sm" 
                     className="h-8"
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

        {/* Breakdown & Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                     <span className="text-muted-foreground">High Risk Orders</span>
                     <span className="text-red-400 font-bold">12%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full">
                     <div className="bg-red-500 h-full w-[12%] rounded-full" />
                  </div>
               </div>
               <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                     <span className="text-muted-foreground">Medium Risk Orders</span>
                     <span className="text-amber-400 font-bold">28%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full">
                     <div className="bg-amber-500 h-full w-[28%] rounded-full" />
                  </div>
               </div>
               <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                     <span className="text-muted-foreground">Safe Orders</span>
                     <span className="text-emerald-400 font-bold">60%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full">
                     <div className="bg-emerald-500 h-full w-[60%] rounded-full" />
                  </div>
               </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Common Indicators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {[
                 { icon: Globe, label: 'VPN/Proxy Usage', count: 45, color: 'text-blue-400' },
                 { icon: Phone, label: 'Duplicate Phones', count: 12, color: 'text-purple-400' },
                 { icon: CreditCard, label: 'High Value Orders', count: 8, color: 'text-emerald-400' },
                 { icon: History, label: 'Frequent Cancellations', count: 22, color: 'text-amber-400' },
               ].map((item) => (
                 <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <item.icon className={cn("w-4 h-4", item.color)} />
                       <span className="text-xs text-white">{item.label}</span>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">{item.count}</span>
                 </div>
               ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
