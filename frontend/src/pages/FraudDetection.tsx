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
  ShieldX,
  AlertOctagon,
  ChevronDown
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '../components/ui/Base';
import { cn } from '../utils/cn';
import { fraudApi } from '../services/api';

export const FraudDetection: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
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

  const getRiskLevel = (score: number): 'High' | 'Medium' | 'Low' => {
    if (score >= 70) return 'High';
    if (score >= 30) return 'Medium';
    return 'Low';
  };

  const formatAmount = (amount: number) => `$${amount.toFixed(2)}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Fraud <span className="text-primary italic">Shield</span></h1>
          <p className="text-muted-foreground mt-2 font-medium tracking-wide">Autonomous risk assessment and prevention protocols.</p>
        </div>
        <div className="flex gap-4">
          <Button 
            variant="premium" 
            className="rounded-[1.25rem] h-12"
            onClick={() => scanMutation.mutate()}
            disabled={scanMutation.isPending}
          >
            {scanMutation.isPending ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <ScanLine className="w-5 h-5 mr-2" />
            )}
            Initiate System Scan
          </Button>
          <Button variant="secondary" className="rounded-[1.25rem] h-12 border-white/5">Protocol Settings</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Fraud List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Live Analysis Feed</h3>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#0d0d0d] border border-white/[0.05] rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:ring-1 focus:ring-primary appearance-none pr-10"
              >
                <option value="">Filter: All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="blocked">Blocked</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          
          {fraudList.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-24 bg-white/[0.01]">
                <ShieldCheck className="w-16 h-16 text-emerald-500/20 mb-4" />
                <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">No Security Threats Detected</p>
            </Card>
          ) : (
          fraudList.map((item: any) => (
            <Card key={item.orderId || item.id} className="group p-8 bg-[#0d0d0d] border-white/[0.05] hover:border-primary/20 transition-all duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-xl font-black italic shadow-2xl",
                    getRiskLevel(item.riskScore) === 'High' ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-red-500/5' : 
                    getRiskLevel(item.riskScore) === 'Medium' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-amber-500/5' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-emerald-500/5'
                  )}>
                    {item.riskScore}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-black text-white tracking-tight italic">
                        {item.orderId}
                      </h4>
                      <Badge variant={getRiskLevel(item.riskScore) === 'High' ? 'danger' : getRiskLevel(item.riskScore) === 'Medium' ? 'warning' : 'success'}>
                        {getRiskLevel(item.riskScore)} Risk Factor
                      </Badge>
                    </div>
                    <p className="text-sm text-white font-bold mt-1 opacity-90">{item.customerName || item.customer}</p>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-2">
                       Vector: {formatAmount(item.amount)} • {(item.riskReasons || item.reasons || []).join(', ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 md:translate-x-4 md:group-hover:translate-x-0">
                   <Button 
                     variant="secondary" 
                     size="sm" 
                     className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border-emerald-500/10"
                     onClick={() => updateStatusMutation.mutate({ orderId: item.orderId || item.id, status: 'approved' })}
                     disabled={updateStatusMutation.isPending}
                   >
                     Clear
                   </Button>
                   <Button 
                     variant="secondary" 
                     size="sm" 
                     className="bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white border-amber-500/10"
                     onClick={() => updateStatusMutation.mutate({ orderId: item.orderId || item.id, status: 'pending' })}
                     disabled={updateStatusMutation.isPending}
                   >
                     Secure
                   </Button>
                   <Button 
                     variant="danger" 
                     size="sm" 
                     className="shadow-lg shadow-red-500/20"
                     onClick={() => updateStatusMutation.mutate({ orderId: item.orderId || item.id, status: 'blocked' })}
                     disabled={updateStatusMutation.isPending}
                   >
                     Eliminate
                   </Button>
                </div>
              </div>
            </Card>
          ))
          )}
        </div>

        {/* Breakdown & Stats */}
        <div className="space-y-10">
          <Card className="p-8">
            <CardHeader className="p-0 mb-8">
              <CardTitle className="flex items-center gap-2">
                <ScanLine className="w-5 h-5 text-primary" />
                Risk Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-8">
               <div className="space-y-3">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Critical Threats</span>
                     <span className="text-red-500 font-black italic">12.4%</span>
                  </div>
                  <div className="w-full bg-white/[0.05] h-3 rounded-full overflow-hidden p-0.5 border border-white/[0.05]">
                     <div className="bg-gradient-to-r from-red-600 to-red-400 h-full rounded-full w-[12.4%] shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                  </div>
               </div>
               <div className="space-y-3">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Suspicious Activity</span>
                     <span className="text-amber-500 font-black italic">28.1%</span>
                  </div>
                  <div className="w-full bg-white/[0.05] h-3 rounded-full overflow-hidden p-0.5 border border-white/[0.05]">
                     <div className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full w-[28.1%] shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                  </div>
               </div>
               <div className="space-y-3">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Verified Transactions</span>
                     <span className="text-emerald-500 font-black italic">59.5%</span>
                  </div>
                  <div className="w-full bg-white/[0.05] h-3 rounded-full overflow-hidden p-0.5 border border-white/[0.05]">
                     <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full w-[59.5%] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  </div>
               </div>
            </CardContent>
          </Card>

          <Card className="p-8">
            <CardHeader className="p-0 mb-8">
              <CardTitle className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-primary" />
                Security Vectors
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
               {[
                 { icon: Globe, label: 'Proxy Detection', count: 45, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                 { icon: Phone, label: 'VoIP Usage', count: 12, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
                 { icon: CreditCard, label: 'Velocity Triggers', count: 8, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                 { icon: History, label: 'Negative Pattern', count: 22, color: 'text-amber-400', bg: 'bg-amber-400/10' },
               ].map((item) => (
                 <div key={item.label} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.05] transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                       <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110", item.bg)}>
                          <item.icon className={cn("w-5 h-5", item.color)} />
                       </div>
                       <span className="text-[11px] font-black text-white uppercase tracking-widest">{item.label}</span>
                    </div>
                    <span className="text-xs font-black text-muted-foreground group-hover:text-white">{item.count}</span>
                 </div>
               ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
