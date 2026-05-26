/* Hallmark · macrostructure: Workbench · tone: brutalist · anchor hue: 160 (green)
 * genre: modern-minimal · theme: Brutal
 * pre-emit critique: P4 H5 E4 S4 R5 V4
 * slop test: 69/69 ✓
 */

import React, { useEffect, useState } from 'react';
import { dashboardApi } from '../services/api';
import {
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  Activity,
  Zap,
  Layers,
  RefreshCw,
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
  Cell,
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
        <div className="w-16 h-16 rounded-lg border-2 border-border flex items-center justify-center">
           <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-12 text-center border-2 border-[var(--color-danger-dim)] rounded-xl max-w-xl mx-auto mt-20">
        <div className="w-12 h-12 rounded-lg border-2 border-[var(--color-danger-dim)] flex items-center justify-center mx-auto mb-6">
           <AlertTriangle className="w-6 h-6 text-[var(--color-danger)]" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-2">Connection failed</h2>
        <p className="font-mono text-sm text-muted-foreground mb-8">{error || 'Could not reach the API.'}</p>
        <Button variant="secondary" size="md" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  const { stats, salesData, orderStatusData, activityFeed } = data;

  const metricBlocks = [
    {
      label: 'Revenue',
      value: stats.totalRevenue,
      change: stats.revenueChange,
      positive: true,
      icon: TrendingUp,
    },
    {
      label: 'Orders',
      value: String(stats.totalOrders),
      change: stats.ordersChange,
      positive: true,
      icon: ShoppingBag,
    },
    {
      label: 'Fraud alerts',
      value: String(stats.fraudAlerts),
      change: stats.fraudChange,
      positive: false,
      icon: AlertTriangle,
      danger: true,
    },
    {
      label: 'Recovery rate',
      value: stats.recoveryRate,
      change: stats.recoveryChange,
      positive: true,
      icon: Activity,
    },
  ];

  return (
    <div className="pb-20">
      {/* Workspace header */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight overflow-anywhere min-w-0" style={{ minWidth: 0 }}>Dashboard</h1>
          <p className="font-mono text-sm text-muted-foreground mt-1">Overview · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <Button variant="primary" size="md" className="gap-3">
          <RefreshCw className="w-4 h-4" /> Sync now
        </Button>
      </div>

      {/* Metric slab — 4 stat blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
        {metricBlocks.map((item, idx) => (
          <div
            key={idx}
            className="border-2 border-border rounded-xl p-6 bg-card hover:border-[var(--color-border-hover)] transition-colors duration-150"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-sm text-muted-foreground">{item.label}</span>
              <item.icon className={cn(
                "w-5 h-5",
                item.danger ? "text-[var(--color-danger)]" : "text-muted-foreground"
              )} />
            </div>
            <div className={cn(
              "text-4xl font-black tracking-tight leading-none mb-3 overflow-anywhere",
              item.danger ? "text-[var(--color-danger)]" : "text-foreground"
            )} style={{ minWidth: 0 }}>
              {item.value}
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "inline-flex items-center gap-1 font-mono text-sm font-bold",
                item.positive ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
              )}>
                {item.positive
                  ? <ArrowUpRight className="w-3.5 h-3.5" />
                  : <ArrowDownRight className="w-3.5 h-3.5" />
                }
                {item.change}
              </span>
              <span className="font-mono text-xs text-muted-foreground">vs prev</span>
            </div>
          </div>
        ))}
      </div>

      {/* Primary workspace — chart + distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-14">
        {/* Revenue chart — 2/3 */}
        <Card className="lg:col-span-2 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-foreground tracking-tight">Revenue stream</h2>
              <p className="font-mono text-sm text-muted-foreground mt-1">7-day revenue by channel</p>
            </div>
            <div className="flex border-2 border-border rounded-lg p-0.5">
               <button className="h-8 px-4 rounded-md text-xs font-bold bg-card text-foreground transition-all">Week</button>
               <button className="h-8 px-4 rounded-md text-xs font-bold text-muted-foreground hover:text-foreground transition-all">Month</button>
            </div>
          </div>
          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" vertical={false} strokeDasharray="4 4" />
                <XAxis
                  dataKey="name"
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
                  tickFormatter={(v) => `$${v}`}
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
                  itemStyle={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: '700', color: 'var(--color-accent)' }}
                  labelStyle={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: '500', color: 'var(--color-ink-dim)', marginBottom: '4px' }}
                />
                <Area
                  type="stepBefore"
                  dataKey="revenue"
                  stroke="var(--color-accent)"
                  strokeWidth={2.5}
                  fill="url(#revenueFill)"
                  animationDuration={1200}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Order distribution — 1/3 */}
        <Card className="p-8 flex flex-col">
          <div className="mb-8">
            <h2 className="text-xl font-black text-foreground tracking-tight">Order breakdown</h2>
            <p className="font-mono text-sm text-muted-foreground mt-1">Status distribution</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="h-[220px] w-full relative">
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-mono text-xs text-muted-foreground">Total</span>
                  <span className="text-3xl font-black text-foreground tracking-tight mt-1">
                    {orderStatusData.reduce((a: number, b: any) => a + b.value, 0)}
                  </span>
               </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {orderStatusData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-paper-2)',
                      border: '2px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'none',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full mt-8 space-y-2">
              {orderStatusData.map((status: any) => (
                <div key={status.name} className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border hover:border-[var(--color-border-hover)] transition-colors cursor-pointer">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: status.color }} />
                  <span className="font-mono text-sm text-muted-foreground">{status.name}</span>
                  <span className="font-mono text-sm font-bold text-foreground ml-auto">{status.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Tool area — activity log + quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Activity log — terminal-style */}
        <Card className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
               <div className="w-9 h-9 rounded-lg border-2 border-border flex items-center justify-center">
                  <Layers className="w-5 h-5 text-muted-foreground" />
               </div>
               <div>
                  <h2 className="text-lg font-black text-foreground tracking-tight">Activity log</h2>
                  <p className="font-mono text-xs text-muted-foreground mt-0.5">Real-time events</p>
               </div>
            </div>
            <Badge variant="primary" className="border-2">Live</Badge>
          </div>
          <div className="space-y-0">
            {activityFeed.map((item: any, i: number) => (
              <div key={item.id} className="flex gap-4 py-3.5 border-b border-border last:border-0 group">
                <div className={cn(
                  "w-2 h-2 rounded-sm mt-1.5 shrink-0",
                  item.status === 'success' ? 'bg-[var(--color-success)]' :
                  item.status === 'danger' ? 'bg-[var(--color-danger)]' :
                  item.status === 'warning' ? 'bg-[var(--color-warning)]' :
                  'bg-muted-foreground'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground group-hover:text-[var(--color-accent)] transition-colors truncate">{item.message}</p>
                  <p className="font-mono text-xs text-muted-foreground mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
            {activityFeed.length === 0 && (
              <p className="font-mono text-sm text-muted-foreground py-8 text-center">No recent activity.</p>
            )}
          </div>
          <div className="mt-6 pt-6 border-t border-border">
            <Button variant="secondary" size="md" className="w-full">View all activity</Button>
          </div>
        </Card>

        {/* Quick actions */}
        <Card className="p-8">
          <div className="flex items-center gap-3 mb-8">
             <div className="w-9 h-9 rounded-lg border-2 border-border flex items-center justify-center">
                <Zap className="w-5 h-5 text-muted-foreground" />
             </div>
             <div>
                <h2 className="text-lg font-black text-foreground tracking-tight">Quick actions</h2>
                <p className="font-mono text-xs text-muted-foreground mt-0.5">Common tasks</p>
             </div>
          </div>

          <div className="space-y-4">
            <div className="border-2 border-border rounded-xl p-6 hover:border-[var(--color-border-hover)] transition-colors cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-sm text-muted-foreground">All orders</span>
                <ShoppingBag className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <p className="font-black text-2xl text-foreground tracking-tight">{stats.totalOrders}</p>
              <p className="font-mono text-xs text-muted-foreground mt-1.5">{stats.ordersChange} vs last period</p>
            </div>

            <div className="border-2 border-border rounded-xl p-6 hover:border-[var(--color-border-hover)] transition-colors cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-sm text-muted-foreground">Fraud shield</span>
                <AlertTriangle className="w-5 h-5 text-muted-foreground group-hover:text-[var(--color-danger)] transition-colors" />
              </div>
              <p className="font-black text-2xl text-foreground tracking-tight">{stats.fraudAlerts}</p>
              <p className="font-mono text-xs text-muted-foreground mt-1.5">{stats.fraudChange} vs last period</p>
            </div>

            <Button variant="primary" size="lg" className="w-full mt-4 gap-2">
              <Zap className="w-5 h-5" /> Open full dashboard
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
