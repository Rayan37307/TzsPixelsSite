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
  UserCheck,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
      setError('Failed to load AI performance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 rounded-full border-2 border-border border-t-[var(--color-accent)] animate-spin" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-12 text-center border-2 border-[var(--color-danger-dim)] rounded-xl max-w-xl mx-auto mt-20">
        <div className="w-12 h-12 rounded-lg border-2 border-[var(--color-danger-dim)] flex items-center justify-center mx-auto mb-6">
           <AlertTriangle className="w-6 h-6 text-[var(--color-danger)]" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-2">Metrics offline</h2>
        <p className="font-mono text-sm text-muted-foreground mb-8">{error}</p>
        <Button variant="secondary" size="md" onClick={fetchStats}>Retry</Button>
      </div>
    );
  }

  const { stats, hourlyData, modelDistribution, recentActions } = data;

  return (
    <div className="pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">AI performance</h1>
          <p className="font-mono text-sm text-muted-foreground mt-1">Messenger automation telemetry</p>
        </div>
        <Button variant="secondary" size="md" onClick={fetchStats} className="gap-2">
          <Activity className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card className="p-6">
          <p className="font-mono text-xs text-muted-foreground mb-3">Messages sent today</p>
          <p className="text-4xl font-black text-foreground tracking-tight font-mono">{stats.messagesSent}</p>
          <div className="flex items-center gap-1.5 mt-3 font-mono text-xs text-[var(--color-success)]">
            <Activity className="w-3.5 h-3.5" /> AI engine active
          </div>
        </Card>

        <Card className="p-6">
          <p className="font-mono text-xs text-muted-foreground mb-3">Inbound messages today</p>
          <p className="text-4xl font-black text-foreground tracking-tight font-mono">{stats.messagesReceived}</p>
          <div className="flex items-center gap-1.5 mt-3 font-mono text-xs text-[var(--color-success)]">
            <TrendingUp className="w-3.5 h-3.5" /> High engagement
          </div>
        </Card>

        <Card className="p-6">
          <p className="font-mono text-xs text-muted-foreground mb-3">Estimated API cost</p>
          <p className="text-4xl font-black text-foreground tracking-tight font-mono">{stats.totalCost}</p>
          <div className="flex items-center gap-1.5 mt-3 font-mono text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" /> Avg $0.05/response
          </div>
        </Card>

        <Card className="p-6">
          <p className="font-mono text-xs text-muted-foreground mb-3">Auto-resolution rate</p>
          <p className="text-4xl font-black text-foreground tracking-tight font-mono">{stats.conversionsResolved}</p>
          <div className="flex items-center gap-1.5 mt-3 font-mono text-xs text-[var(--color-success)]">
            <ShieldCheck className="w-3.5 h-3.5" /> {stats.handoverRate} handover rate
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Hourly volume */}
        <Card className="lg:col-span-2 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-foreground tracking-tight">Message traffic</h3>
              <p className="font-mono text-sm text-muted-foreground mt-1">Hourly volume today</p>
            </div>
            <Badge variant="primary">AI responses</Badge>
          </div>

          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={hourlyData}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="msgFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" vertical={false} strokeDasharray="4 4" />
                <XAxis
                  dataKey="time"
                  stroke="var(--color-ink-dim)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={12}
                  fontFamily="var(--font-mono)"
                />
                <YAxis
                  stroke="var(--color-ink-dim)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  fontFamily="var(--font-mono)"
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-paper-2)',
                    border: '2px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '12px 16px',
                    boxShadow: 'none',
                  }}
                  labelStyle={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-ink-dim)', marginBottom: '4px' }}
                  itemStyle={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: '700', color: 'var(--color-accent)' }}
                />
                <Area
                  type="stepBefore"
                  dataKey="messages"
                  stroke="var(--color-accent)"
                  strokeWidth={2.5}
                  fill="url(#msgFill)"
                  animationDuration={1200}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Model distribution */}
        <Card className="p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-foreground tracking-tight mb-2">Models</h3>
            <p className="font-mono text-sm text-muted-foreground mb-8">Active distribution today</p>

            <div className="space-y-5">
              {modelDistribution.map((model: any) => {
                const totalVal = modelDistribution.reduce((acc: number, curr: any) => acc + curr.value, 0);
                const percent = totalVal > 0 ? Math.round((model.value / totalVal) * 100) : 0;

                return (
                  <div key={model.name} className="space-y-1.5">
                    <div className="flex justify-between items-center font-mono text-xs">
                      <span className="text-foreground flex items-center gap-2">
                        <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: model.color }} />
                        {model.name}
                      </span>
                      <span className="text-muted-foreground">{percent}% ({model.value})</span>
                    </div>
                    <div className="h-2 w-full bg-border rounded-sm overflow-hidden">
                      <div
                        className="h-full rounded-sm transition-all duration-1000"
                        style={{ width: `${percent}%`, backgroundColor: model.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 p-5 border-2 border-border rounded-lg flex items-center gap-4">
             <ShieldCheck className="w-5 h-5 text-[var(--color-success)] shrink-0" />
             <div>
                <h4 className="font-bold text-sm text-foreground">Health status</h4>
                <p className="font-mono text-xs text-muted-foreground mt-0.5">All systems operational</p>
             </div>
          </div>
        </Card>
      </div>

      {/* Recent actions */}
      <Card className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-black text-foreground tracking-tight">AI automation logs</h3>
            <p className="font-mono text-sm text-muted-foreground mt-1">Recent chatbot actions</p>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-sm bg-[var(--color-accent)]" /> Live
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                {['Customer', 'Query', 'Response', 'Stats', 'Status'].map((h) => (
                  <th key={h} className="pb-4 font-mono text-xs text-muted-foreground px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentActions.map((action: any) => (
                <tr key={action.id} className="hover:bg-[var(--color-paper-3)] transition-colors group">
                  <td className="py-5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${action.customerName}`}
                        alt="Avatar"
                        className="w-8 h-8 rounded-lg border-2 border-border"
                      />
                      <div>
                        <span className="font-bold text-sm text-foreground">{action.customerName}</span>
                        <p className="font-mono text-xs text-muted-foreground mt-0.5">{action.timestamp}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-4 max-w-xs">
                    <p className="font-mono text-xs text-muted-foreground line-clamp-2">"{action.query}"</p>
                  </td>
                  <td className="py-5 px-4 max-w-sm">
                    <p className="text-xs text-foreground line-clamp-2 font-medium">
                      {action.response}
                    </p>
                  </td>
                  <td className="py-5 px-4">
                    <div className="font-mono text-xs text-muted-foreground space-y-0.5">
                      <span>Cost: <strong className="text-foreground">{action.cost}</strong></span>
                      <br />
                      <span>Latency: <strong className="text-foreground">{action.latency}</strong></span>
                    </div>
                  </td>
                  <td className="py-5 px-4 text-right">
                    {action.status === 'handover' ? (
                      <Badge variant="warning" className="gap-1">
                        <UserCheck className="w-3 h-3" /> Handover
                      </Badge>
                    ) : (
                      <Badge variant="success" className="gap-1">
                        <Bot className="w-3 h-3" /> Auto-resolved
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
