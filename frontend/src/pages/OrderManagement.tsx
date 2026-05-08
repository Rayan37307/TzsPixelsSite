import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  MoreVertical, 
  Eye, 
  Truck, 
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RefreshCw
} from 'lucide-react';
import { Card, Badge, Button } from '../components/ui/Base';
import { cn } from '../utils/cn';
import { useOrders } from '../hooks/useOrders';
import { useStoreStore } from '../store/useStoreStore';
import { orderApi } from '../services/api';

export const OrderManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const { orders, isLoading, isSyncing, syncShopify } = useOrders();
  void useStoreStore();

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    address: '',
    city: '',
    email: '',
    productName: '',
    quantity: 1
  });

  useEffect(() => {
    if (showCreateModal) {
      orderApi.getProducts().then(setProducts).catch(console.error);
    }
  }, [showCreateModal]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await orderApi.createOrder(formData);
      setShowCreateModal(false);
      setFormData({ customerName: '', phone: '', address: '', city: '', email: '', productName: '', quantity: 1 });
      syncShopify();
    } catch (err) {
      console.error('Failed to create order:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSync = () => {
    syncShopify();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage and track all customer orders in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="gap-2" 
            onClick={handleSync}
            disabled={isSyncing}
          >
            <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} /> 
            {isSyncing ? "Syncing Shopify..." : "Sync Shopify"}
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button className="gap-2" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" /> Create Order
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-white/5">
        <div className="p-4 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search orders, customers..." 
                className="w-full bg-background border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="flex border border-white/10 rounded-lg overflow-hidden">
                <button className="px-3 py-2 text-xs font-medium bg-white/10 text-white border-r border-white/10">All</button>
                <button className="px-3 py-2 text-xs font-medium hover:bg-white/5 text-muted-foreground transition-colors border-r border-white/10">Pending</button>
                <button className="px-3 py-2 text-xs font-medium hover:bg-white/5 text-muted-foreground transition-colors">Shipped</button>
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4">
               <RefreshCw className="w-8 h-8 text-primary animate-spin" />
               <p className="text-sm text-muted-foreground">Loading your orders...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.01]">
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-white/5">
                    <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                      Order ID <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-white/5">Customer</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-white/5">Amount</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-white/5">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-white/5">Fraud Risk</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-white/5">Courier</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-white/5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.filter((o: any) => 
                  o.customer.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  o.id.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((order: any) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-white">{order.id}</span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{order.date}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{order.customer}</span>
                        <span className="text-xs text-muted-foreground">{order.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-white">{order.amount}</td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        order.status === 'Delivered' ? 'success' : 
                        order.status === 'Cancelled' ? 'danger' : 
                        order.status === 'Pending' ? 'warning' : 'info'
                      }>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className={cn(
                          "w-4 h-4",
                          order.fraudRisk === 'Low' ? 'text-emerald-500' : 
                          order.fraudRisk === 'Medium' ? 'text-amber-500' : 'text-red-500'
                        )} />
                        <span className="text-xs text-white">{order.fraudRisk}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-white">{order.courier}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 border-t border-white/5 flex items-center justify-between">
           <p className="text-xs text-muted-foreground">Showing {orders.length} orders</p>
           <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-1">
                 <Button variant="secondary" size="sm" className="h-8 w-8 p-0 text-xs">1</Button>
                 <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-xs">2</Button>
                 <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-xs">3</Button>
              </div>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
           </div>
        </div>
      </Card>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <Card className="w-full max-w-lg">
            <h2 className="text-xl font-bold text-white mb-6">Create New Order</h2>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Customer Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.customerName}
                  onChange={e => setFormData({...formData, customerName: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:ring-1 focus:ring-primary"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                <input 
                  type="tel" 
                  required
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:ring-1 focus:ring-primary"
                  placeholder="01xxxxxxxxx"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Product</label>
                <select 
                  required
                  value={formData.productName}
                  onChange={e => setFormData({...formData, productName: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="" className="bg-gray-900">Select a product</option>
                  {products.map((p: any) => (
                    <option key={p.id} value={p.name} className="bg-gray-900">
                      {p.name} - {p.price || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Quantity</label>
                  <input 
                    type="number" 
                    min="1"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">City</label>
                  <input 
                    type="text" 
                    required
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Dhaka"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Address</label>
                <textarea 
                  required
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:ring-1 focus:ring-primary h-20 resize-none"
                  placeholder="Full delivery address"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Email (Optional)</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:ring-1 focus:ring-primary"
                  placeholder="customer@example.com"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Order'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};