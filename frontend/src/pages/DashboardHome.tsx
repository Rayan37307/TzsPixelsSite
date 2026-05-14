import React, { useEffect, useState } from 'react';
import { dashboardApi } from '../services/api';
import { 
  TrendingUp, 
  ShoppingBag, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  Bot,
  Activity,
  Zap,
  Clock,
  ExternalLink,
  RefreshCw,
  Filter,
  Play,
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card, Badge, Button } from '../components/ui/Base';
import { cn } from '../utils/cn';

export const DashboardHome: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await dashboardApi.getStats();
        setData(stats);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center animate-pulse shadow-2xl shadow-primary/20">
           <Zap className="w-10 h-10 text-primary animate-bounce" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-12 text-center bg-red-500/5 border border-red-500/10 rounded-[3rem] animate-in zoom-in-95 duration-500 max-w-xl mx-auto mt-20">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
           <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-white italic tracking-tight mb-2">Sync Error</h2>
        <p className="text-sm font-medium text-red-400/60 leading-relaxed mb-8">{error || 'Neural link failed to establish.'}</p>
        <Button variant="secondary" className="px-10 h-12 rounded-xl font-black uppercase tracking-widest text-[10px]" onClick={() => window.location.reload()}>Re-initialize</Button>
      </div>
    );
  }

  const { stats, salesData, orderStatusData, activityFeed } = data;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tight italic">Core <span className="text-primary not-italic">Dashboard</span></h1>
          <p className="text-muted-foreground mt-2 font-black uppercase text-[10px] tracking-[0.3em]">Real-Time Ecosystem Telemetry</p>
        </div>
        <div className="flex gap-4">
          <Button variant="secondary" className="h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest border-white/5 gap-3">
            <Activity className="w-4 h-4 text-primary" /> Live Stream
          </Button>
          <Button variant="premium" className="h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest gap-3 shadow-2xl shadow-primary/30">
            <Zap className="w-4 h-4 fill-white" /> Rapid Action
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'GROSS REVENUE', value: stats.totalRevenue, change: stats.revenueChange, icon: TrendingUp, color: 'primary' },
          { label: 'PAYLOAD UNITS', value: `+${stats.totalOrders}`, change: stats.ordersChange, icon: ShoppingBag, color: 'primary' },
          { label: 'ANOMALY ALERTS', value: stats.fraudAlerts, change: stats.fraudChange, icon: AlertTriangle, color: 'danger', isNegative: true },
          { label: 'RECOVERY RATE', value: stats.recoveryRate, change: stats.recoveryChange, icon: Activity, color: 'success' }
        ].map((item, idx) => (
          <Card key={idx} className="relative overflow-hidden group bg-[#0d0d0d] border-white/[0.05] rounded-[2.5rem] p-8 transition-all duration-500 hover:border-primary/30">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all duration-700">
               <item.icon className="w-24 h-24 text-white" />
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{item.label}</h4>
              <div className="text-5xl font-black text-white tracking-tighter italic">{item.value}</div>
              <div className="flex items-center gap-3">
                <Badge variant={item.isNegative ? 'danger' : 'success'} className="h-6 rounded-md text-[9px] font-black uppercase tracking-widest px-2">
                  {item.isNegative ? <ArrowDownRight className="w-3 h-3 mr-1" /> : <ArrowUpRight className="w-3 h-3 mr-1" />} {item.change}
                </Badge>
                <span className="text-muted-foreground text-[9px] font-black uppercase tracking-[0.15em] opacity-40">Offset v. Prev</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <Card className="lg:col-span-2 bg-[#0d0d0d] border-white/[0.05] rounded-[2.5rem] p-10 overflow-hidden relative">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-white italic tracking-tight">Performance Stream</h3>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Multi-Channel Revenue Vector</p>
            </div>
            <div className="flex bg-white/[0.03] p-1.5 rounded-xl border border-white/5">
               <button className="h-9 px-6 rounded-lg text-[10px] font-black uppercase tracking-widest bg-primary text-black shadow-xl shadow-primary/20 transition-all">Phase 1</button>
               <button className="h-9 px-6 rounded-lg text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Phase 2</button>
            </div>
          </div>
          <div className="h-[400px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#ffffff10" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={20}
                  fontWeight={900}
                />
                <YAxis 
                  stroke="#ffffff10" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `$${value}`}
                  fontWeight={900}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d0d0d', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2rem', padding: '20px' }}
                  itemStyle={{ color: '#8b5cf6', fontSize: '14px', fontWeight: '900', fontStyle: 'italic' }}
                  labelStyle={{ color: '#666', fontSize: '10px', fontWeight: '900', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.2em' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8b5cf6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-[#0d0d0d] border-white/[0.05] rounded-[2.5rem] p-10 flex flex-col">
          <div className="mb-10">
            <h3 className="text-xl font-black text-white italic tracking-tight">Fulfillment Hub</h3>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Payload Distribution</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="h-[250px] w-full relative">
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Aggregate</p>
                  <p className="text-3xl font-black text-white italic tracking-tighter mt-1">2,410</p>
               </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={105}
                    paddingAngle={10}
                    dataKey="value"
                    stroke="none"
                  >
                    {orderStatusData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0d0d0d', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1.5rem' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4 mt-12 w-full">
              {orderStatusData.map((status: any) => (
                <div key={status.name} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.03] group hover:bg-white/[0.05] transition-all cursor-pointer">
                  <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-transform group-hover:scale-125" style={{ backgroundColor: status.color }} />
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest group-hover:text-white transition-colors">{status.name}</span>
                  <span className="text-sm font-black text-white ml-auto italic tracking-tight">{status.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Grid: Activity Feed & AI Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <Card className="bg-[#0d0d0d] border-white/[0.05] rounded-[2.5rem] p-10">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Layers className="w-6 h-6 text-primary" />
               </div>
               <div>
                  <h3 className="text-xl font-black text-white italic tracking-tight">Signal Stream</h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Real-time Telemetry</p>
               </div>
            </div>
            <Badge variant="success" className="animate-pulse h-6 rounded-md text-[8px] font-black uppercase tracking-widest px-3">ACTIVE LINK</Badge>
          </div>
          <div className="space-y-10 pt-4 px-2">
            {activityFeed.map((item: any, i: number) => (
              <div key={item.id} className="flex gap-8 relative group">
                {i !== activityFeed.length - 1 && (
                  <div className="absolute left-[7px] top-[28px] bottom-[-40px] w-[2px] bg-white/[0.03]" />
                )}
                <div className={cn(
                  "w-4 h-4 rounded-full border-4 border-black z-10 shrink-0 mt-1 transition-transform group-hover:scale-125",
                  item.status === 'success' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 
                  item.status === 'danger' ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 
                  item.status === 'warning' ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-primary shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                )} />
                <div className="flex-1 pb-4">
                  <p className="text-sm text-white/90 font-bold leading-relaxed group-hover:text-primary transition-colors italic">{item.message}</p>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-3 opacity-40">{item.time} OFFSET</p>
                </div>
              </div>
            ))}
            <Button variant="secondary" className="w-full mt-6 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] border-white/5">Expand Signal Database</Button>
          </div>
        </Card>

        <Card className="bg-[#0d0d0d] border-white/[0.05] rounded-[2.5rem] p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 transition-transform group-hover:scale-110 duration-1000">
             <Bot className="w-32 h-32 text-primary" />
          </div>
          
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
               </div>
               <div>
                  <h3 className="text-xl font-black text-white italic tracking-tight">Neural Engine</h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Autonomous Logic v4.2</p>
               </div>
            </div>
            <Badge variant="primary" className="h-6 rounded-md text-[8px] font-black uppercase tracking-widest px-3">CORE ACTIVE</Badge>
          </div>

          <div className="space-y-10 pt-4">
            <div className="p-10 rounded-[3rem] bg-white/[0.02] border border-white/[0.05] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent opacity-30" />
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Precision Index</span>
                <span className="text-lg font-black text-primary italic">98.4%</span>
              </div>
              <div className="w-full bg-white/[0.03] h-4 rounded-full overflow-hidden p-1 border border-white/[0.05]">
                <div className="bg-gradient-to-r from-primary via-purple-400 to-primary h-full rounded-full w-[98.4%] shadow-[0_0_20px_rgba(139,92,246,0.6)] animate-pulse" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/[0.03] text-center group hover:bg-primary/[0.05] hover:border-primary/20 transition-all duration-500">
                <p className="text-5xl font-black text-white tracking-tighter italic group-hover:scale-110 transition-transform">1.2k</p>
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-3 opacity-40">Vectors Solved</p>
              </div>
              <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/[0.03] text-center group hover:bg-emerald-500/[0.05] hover:border-emerald-500/20 transition-all duration-500">
                <p className="text-5xl font-black text-white tracking-tighter italic group-hover:scale-110 transition-transform">45m</p>
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-3 opacity-40">Efficiency Gain</p>
              </div>
            </div>

            <Button variant="premium" className="w-full h-18 rounded-[2rem] font-black text-sm italic shadow-2xl shadow-primary/30 group">
               Open Neural Configuration Studio
               <ArrowUpRight className="w-6 h-6 ml-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
