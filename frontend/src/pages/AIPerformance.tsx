import React, { useEffect, useState } from 'react';
import { aiApi } from '../services/api';
import { 
  Cpu, 
  TrendingUp, 
  Coins, 
  CheckCircle2, 
  Activity, 
  Clock, 
  Zap, 
  AlertTriangle,
  Bot,
  MessageCircle,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { Card, Badge, Button } from '../components/ui/Base';

export const AIPerformance: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const performanceData = await aiApi.getPerformance();
      setData(performanceData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch AI performance stats:', err);
      setError('Failed to establish neural metrics link.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center animate-pulse shadow-2xl shadow-primary/20">
           <Zap className="w-10 h-10 text-primary animate-bounce" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-12 text-center bg-red-500/5 border border-red-500/10 rounded-[3rem] animate-in zoom-in-95 duration-500 max-w-xl mx-auto mt-20">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
           <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-white italic tracking-tight mb-2">Metrics Offline</h2>
        <p className="text-sm font-medium text-red-400/60 leading-relaxed mb-8">{error}</p>
        <Button variant="secondary" className="px-10 h-12 rounded-xl font-black uppercase tracking-widest text-[10px]" onClick={fetchStats}>Retry Link</Button>
      </div>
    );
  }

  const { stats, hourlyData, modelDistribution, recentActions } = data;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-primary tracking-tight italic">AI <span className="text-primary not-italic">Performance</span></h1>
          <p className="text-muted-foreground mt-2 font-black uppercase text-[10px] tracking-[0.3em]">Real-Time Messenger Automation Telemetry</p>
        </div>
        <div className="flex gap-4">
          <Button 
            variant="secondary" 
            className="h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest border-white/5 gap-3"
            onClick={fetchStats}
          >
            <Activity className="w-4 h-4 text-primary" /> Sync Data
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Messages Sent */}
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Cpu className="w-24 h-24 text-primary" />
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Messages Sent Today</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white font-mono tracking-tight">{stats.messagesSent}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black uppercase tracking-wider mt-2">
              <Activity className="w-3.5 h-3.5" /> AI Engine Active
            </div>
          </div>
        </Card>

        {/* Messages Received */}
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <MessageCircle className="w-24 h-24 text-emerald-400" />
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Inbound Messages Today</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white font-mono tracking-tight">{stats.messagesReceived}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black uppercase tracking-wider mt-2">
              <TrendingUp className="w-3.5 h-3.5" /> High Engagement
            </div>
          </div>
        </Card>

        {/* Estimated Cost */}
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Coins className="w-24 h-24 text-amber-500" />
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Estimated API Cost</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white font-mono tracking-tight">{stats.totalCost}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-black uppercase tracking-wider mt-2">
              <Clock className="w-3.5 h-3.5" /> Avg ৳ 0.05/response
            </div>
          </div>
        </Card>

        {/* Automation Rate */}
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <CheckCircle2 className="w-24 h-24 text-[#10b981]" />
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Automation Resolution Rate</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white font-mono tracking-tight">{stats.conversionsResolved}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#10b981] text-[10px] font-black uppercase tracking-wider mt-2">
              <ShieldCheck className="w-3.5 h-3.5" /> {stats.handoverRate} Handover Rate
            </div>
          </div>
        </Card>
      </div>

      {/* Graphs & Model Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Hourly Volume Chart */}
        <Card className="lg:col-span-2">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Ecosystem Message Traffic</h3>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Hourly Message Frequency Today</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="primary" className="h-6 px-3 bg-[#10b981]/10 border-[#10b981]/20 text-[#10b981]">AI Responses</Badge>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={hourlyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={10} 
                  fontWeight="bold" 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={10} 
                  fontWeight="bold" 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d0d0d',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '1rem',
                  }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 11 }}
                  itemStyle={{ color: '#10b981', fontWeight: 'bold', fontSize: 11 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="messages" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorMessages)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Model breakdown */}
        <Card className="flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-white uppercase italic tracking-tight mb-2">Model Architecture</h3>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-8">Active Model Distribution Today</p>

            <div className="space-y-6">
              {modelDistribution.map((model: any) => {
                const totalVal = modelDistribution.reduce((acc: number, curr: any) => acc + curr.value, 0);
                const percent = totalVal > 0 ? Math.round((model.value / totalVal) * 100) : 0;
                
                return (
                  <div key={model.name} className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: model.color }} />
                        {model.name}
                      </span>
                      <span className="font-mono text-muted-foreground">{percent}% ({model.value})</span>
                    </div>
                    <div className="h-2 w-full bg-white/[0.03] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${percent}%`, backgroundColor: model.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
             </div>
             <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Health Status</h4>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">All neural links executing correctly.</p>
             </div>
          </div>
        </Card>
      </div>

      {/* Recent AI Action Logs */}
      <Card>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-lg font-black text-white uppercase italic tracking-tight">AI Automation Logs</h3>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Real-Time Chatbot Transmissions</p>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
               <span className="w-2 h-2 rounded-full bg-primary animate-ping" /> Live Feed
             </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4">Customer</th>
                <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4">User Query</th>
                <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4">AI Response</th>
                <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4">Response Stats</th>
                <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {recentActions.map((action: any) => (
                <tr key={action.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="py-6 px-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${action.customerName}`} 
                        alt="Avatar" 
                        className="w-8 h-8 rounded-full border border-white/10"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">{action.customerName}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">{action.timestamp}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-4 max-w-xs">
                    <p className="text-xs text-muted-foreground line-clamp-2 italic">"{action.query}"</p>
                  </td>
                  <td className="py-6 px-4 max-w-sm">
                    <p className="text-xs text-white line-clamp-2 font-medium">
                      {action.response}
                    </p>
                  </td>
                  <td className="py-6 px-4">
                    <div className="flex flex-col gap-1 text-[10px]">
                      <span className="text-muted-foreground font-mono">Cost: <strong className="text-white">{action.cost}</strong></span>
                      <span className="text-muted-foreground font-mono">Latency: <strong className="text-white">{action.latency}</strong></span>
                    </div>
                  </td>
                  <td className="py-6 px-4 text-right">
                    {action.status === 'handover' ? (
                      <Badge variant="warning" className="gap-1 border-amber-500/20 bg-amber-500/5 text-amber-500">
                        <UserCheck className="w-3 h-3" /> Handover
                      </Badge>
                    ) : (
                      <Badge variant="success" className="gap-1 border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
                        <Bot className="w-3 h-3" /> Auto-Resolved
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
