import React, { useEffect, useState } from 'react';
import { dashboardApi } from '../services/api';
import { 
  TrendingUp, 
  ShoppingBag, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  Bot,
  Truck,
  Activity
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button } from '../components/ui/Base';
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-red-500/10 border border-red-500/20 rounded-2xl">
        <p className="text-red-400">{error || 'Something went wrong'}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const { stats, salesData, orderStatusData, activityFeed } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Scalefy Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, here's what's happening with your stores today.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">Download Report</Button>
          <Button>+ Manual Order</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Revenue</CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalRevenue}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-emerald-400 text-xs font-semibold flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-0.5" /> {stats.revenueChange}
              </span>
              <span className="text-muted-foreground text-[10px]">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Orders</CardTitle>
            <ShoppingBag className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">+{stats.totalOrders}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-emerald-400 text-xs font-semibold flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-0.5" /> {stats.ordersChange}
              </span>
              <span className="text-muted-foreground text-[10px]">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Fraud Alerts</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.fraudAlerts}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-red-400 text-xs font-semibold flex items-center">
                <ArrowDownRight className="w-3 h-3 mr-0.5" /> {stats.fraudChange}
              </span>
              <span className="text-muted-foreground text-[10px]">from yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Recovery Rate</CardTitle>
            <Activity className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.recoveryRate}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-emerald-400 text-xs font-semibold flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-0.5" /> {stats.recoveryChange}
              </span>
              <span className="text-muted-foreground text-[10px]">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Sales performance across all connected stores.</CardDescription>
            </div>
            <Button variant="outline" size="sm">Last 7 Days</Button>
          </CardHeader>
          <CardContent className="h-[350px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#99f6e4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#99f6e4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#525252" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#525252" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `৳${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141414', border: '1px solid #262626', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#99f6e4" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Current fulfillment breakdown.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141414', border: '1px solid #262626', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 mt-4 w-full">
              {orderStatusData.map((status) => (
                <div key={status.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                  <span className="text-xs text-muted-foreground">{status.name}</span>
                  <span className="text-xs font-bold text-white ml-auto">{status.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid: Activity Feed & AI Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Live Activity</CardTitle>
            <Badge variant="info">Live</Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            {activityFeed.map((item) => (
              <div key={item.id} className="flex gap-4 relative">
                <div className={cn(
                  "w-2 h-2 rounded-full mt-1.5",
                  item.status === 'success' ? 'bg-emerald-500' : 
                  item.status === 'danger' ? 'bg-red-500' : 
                  item.status === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                )} />
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{item.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-4">View All Logs</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>AI Assistant</CardTitle>
            <Bot className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Automated Replies</span>
                <span className="text-xs font-bold text-emerald-400">85% Success</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[85%]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                <p className="text-xl font-bold text-white">458</p>
                <p className="text-[10px] text-muted-foreground uppercase">Queries today</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                <p className="text-xl font-bold text-white">12m</p>
                <p className="text-[10px] text-muted-foreground uppercase">Time saved</p>
              </div>
            </div>
            <Button className="w-full">Open AI Studio</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
