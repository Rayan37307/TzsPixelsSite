import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  MoreVertical,
  Eye,
  Truck,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
  X,
} from 'lucide-react';
import { Card, Badge, Button, Input } from '../components/ui/Base';
import { cn } from '../utils/cn';
import { useOrders } from '../hooks/useOrders';
import { orderApi } from '../services/api';

export const OrderManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const { orders, isLoading, isSyncing, syncShopify } = useOrders();

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

  return (
    <div className="pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Orders</h1>
          <p className="font-mono text-sm text-muted-foreground mt-1">Manage and track all orders</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => syncShopify()}
            disabled={isSyncing}
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
            {isSyncing ? "Syncing..." : "Sync"}
          </Button>
          <Button variant="primary" size="md" onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="w-4 h-4" /> New order
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search orders or customers..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="secondary" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex border-2 border-border rounded-lg p-0.5">
                <button className="px-4 py-1.5 text-xs font-bold bg-card text-foreground rounded-md transition-all">All</button>
                <button className="px-4 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-all">Pending</button>
                <button className="px-4 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-all">Shipped</button>
             </div>
             <Button variant="secondary" size="icon">
               <Download className="w-4 h-4" />
             </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-24 flex flex-col items-center justify-center gap-4">
               <div className="w-10 h-10 rounded-full border-2 border-border border-t-[var(--color-accent)] animate-spin" />
               <p className="font-mono text-sm text-muted-foreground">Loading orders...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  {['Order ID', 'Customer', 'Amount', 'Status', 'Risk', 'Courier', ''].map((h) => (
                    <th key={h} className="px-6 py-4 font-mono text-xs text-muted-foreground border-b border-border">
                      <div className="flex items-center gap-1.5">
                        {h === 'Order ID' ? <ArrowUpDown className="w-3 h-3" /> : null}
                        {h || 'Actions'}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.filter((o: any) =>
                  o.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  o.id.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((order: any) => (
                  <tr key={order.id} className="hover:bg-[var(--color-paper-3)] transition-colors group">
                    <td className="px-6 py-5">
                      <span className="font-mono text-sm font-bold text-foreground">#{order.id}</span>
                      <p className="font-mono text-xs text-muted-foreground mt-0.5">{order.date}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-bold text-sm text-foreground">{order.customer}</span>
                      <p className="font-mono text-xs text-muted-foreground mt-0.5">{order.phone}</p>
                    </td>
                    <td className="px-6 py-5 font-mono text-sm font-bold text-foreground">{order.amount}</td>
                    <td className="px-6 py-5">
                      <Badge variant={
                        order.status === 'Delivered' ? 'success' :
                        order.status === 'Cancelled' ? 'danger' :
                        order.status === 'Pending' ? 'warning' : 'info'
                      }>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-sm",
                          order.fraudRisk === 'Low' ? 'bg-[var(--color-success)]' :
                          order.fraudRisk === 'Medium' ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-danger)]'
                        )} />
                        <span className="font-mono text-xs font-bold text-foreground">{order.fraudRisk}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono text-xs text-foreground">{order.courier}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="secondary" size="icon" className="w-9 h-9">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="secondary" size="icon" className="w-9 h-9">
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

        <div className="p-6 border-t border-border flex items-center justify-between">
           <p className="font-mono text-xs text-muted-foreground">Showing {orders.length} entries</p>
           <div className="flex items-center gap-2">
              <Button variant="secondary" size="icon" className="w-9 h-9" disabled>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="primary" size="sm" className="w-9 h-9 px-0">1</Button>
              <Button variant="ghost" size="sm" className="w-9 h-9 px-0">2</Button>
              <Button variant="ghost" size="sm" className="w-9 h-9 px-0">3</Button>
              <Button variant="secondary" size="icon" className="w-9 h-9">
                <ChevronRight className="w-4 h-4" />
              </Button>
           </div>
        </div>
      </Card>

      {showCreateModal && (
        <div className="fixed inset-0 bg-paper/80 z-[100] flex items-center justify-center p-6">
          <Card className="w-full max-w-2xl p-10 relative">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h2 className="text-2xl font-black text-foreground tracking-tight">Create order</h2>
                  <p className="font-mono text-sm text-muted-foreground mt-1">Manual entry form</p>
               </div>
               <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 rounded-lg border-2 border-border flex items-center justify-center hover:bg-[var(--color-paper-3)] transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
               </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-mono text-xs text-muted-foreground">Customer name</label>
                  <Input
                    required
                    value={formData.customerName}
                    onChange={e => setFormData({...formData, customerName: e.target.value})}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-xs text-muted-foreground">Phone</label>
                  <Input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="+880 1xxx-xxxxxx"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-mono text-xs text-muted-foreground">Product</label>
                <select
                  required
                  value={formData.productName}
                  onChange={e => setFormData({...formData, productName: e.target.value})}
                  className="w-full h-12 bg-card border-2 border-border rounded-lg px-4 text-sm text-foreground font-medium outline-none focus:border-[var(--color-accent)] transition-all appearance-none"
                >
                  <option value="" className="bg-card">Select product</option>
                  {products.map((p: any) => (
                    <option key={p.id} value={p.name} className="bg-card">
                      {p.name} — {p.price || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-mono text-xs text-muted-foreground">Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-xs text-muted-foreground">City</label>
                  <Input
                    required
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                    placeholder="City / region"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-mono text-xs text-muted-foreground">Address</label>
                <textarea
                  required
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-card border-2 border-border rounded-lg px-4 py-3 text-sm text-foreground outline-none focus:border-[var(--color-accent)] transition-all h-24 resize-none"
                  placeholder="Full delivery address"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" className="flex-1" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create order'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
