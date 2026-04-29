import React from 'react';
import { 
  Globe, 
  Phone, 
  CreditCard,
  History
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '../components/ui/Base';
import { cn } from '../utils/cn';

const fraudList = [
  { id: 'ORD-1247', customer: 'Emma Wilson', score: 85, risk: 'High', reasons: ['VPN Detected', 'Suspicious Value'], amount: '$890.00' },
  { id: 'ORD-1246', customer: 'Michael Chen', score: 42, risk: 'Medium', reasons: ['New Customer', 'Multiple Attempts'], amount: '$125.50' },
  { id: 'ORD-1252', customer: 'Alice Smith', score: 92, risk: 'High', reasons: ['Duplicate Phone', 'Repeat Cancellation'], amount: '$1,500.00' },
  { id: 'ORD-1245', customer: 'Sarah Johnson', score: 12, risk: 'Low', reasons: ['Verified Customer'], amount: '$458.00' },
];

export const FraudDetection: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Fraud Detection</h1>
          <p className="text-muted-foreground mt-1">Real-time risk assessment and fraud prevention.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">Review History</Button>
          <Button variant="danger">Block Settings</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Fraud List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">Pending Review</h3>
          {fraudList.map((item) => (
            <Card key={item.id} className="group cursor-pointer hover:ring-1 hover:ring-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold",
                    item.risk === 'High' ? 'bg-red-500/20 text-red-400' : 
                    item.risk === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                  )}>
                    {item.score}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      {item.id} • {item.customer}
                      <Badge variant={item.risk === 'High' ? 'danger' : item.risk === 'Medium' ? 'warning' : 'success'}>
                        {item.risk} Risk
                      </Badge>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">Amount: {item.amount} • {item.reasons.join(', ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Button variant="outline" size="sm" className="h-8 text-emerald-400 hover:bg-emerald-500/10">Approve</Button>
                   <Button variant="outline" size="sm" className="h-8 text-amber-400 hover:bg-amber-500/10">Hold</Button>
                   <Button variant="danger" size="sm" className="h-8">Block</Button>
                </div>
              </div>
            </Card>
          ))}
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
