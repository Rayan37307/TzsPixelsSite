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
  RefreshCw,
  X
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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight">Orders <span className="text-primary italic">Management</span></h1>
          <p className="text-muted-foreground mt-2 font-medium tracking-wide">Orchestrate your commerce flow with precision.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="secondary" 
            className="rounded-2xl h-12" 
            onClick={() => syncShopify()}
            disabled={isSyncing}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isSyncing && "animate-spin")} /> 
            {isSyncing ? "Syncing..." : "Sync Shopify"}
          </Button>
          <Button variant="premium" className="rounded-2xl h-12" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create Order
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-white/[0.05] bg-[#0d0d0d] shadow-2xl">
        <div className="p-8 border-b border-white/[0.03] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search orders, customers or tracking IDs..." 
                className="pl-12 h-14 bg-white/[0.02]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="secondary" size="icon" className="shrink-0 h-14 w-14 rounded-2xl">
              <Filter className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex bg-white/[0.02] p-1.5 rounded-2xl border border-white/[0.05]">
                <button className="px-5 py-2 text-[10px] font-black uppercase tracking-widest bg-white/10 text-white rounded-xl shadow-lg">All Orders</button>
                <button className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">Pending</button>
                <button className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">Shipped</button>
             </div>
             <Button variant="outline" className="h-12 w-12 p-0 rounded-2xl border-white/[0.05]">
               <Download className="w-5 h-5" />
             </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-24 flex flex-col items-center justify-center gap-6">
               <div className="w-16 h-16 rounded-full border-t-2 border-primary animate-spin" />
               <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">Retrieving Secure Data...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-white/[0.03]">
                    <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                      Order Identifier <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-white/[0.03]">Customer Profile</th>
                  <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-white/[0.03]">Financials</th>
                  <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-white/[0.03]">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-white/[0.03]">Risk Vector</th>
                  <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-white/[0.03]">Logistics</th>
                  <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-white/[0.03] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {orders.filter((o: any) => 
                  o.customer.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  o.id.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((order: any) => (
                  <tr key={order.id} className="hover:bg-white/[0.01] transition-all group">
                    <td className="px-8 py-6">
                      <span className="text-sm font-black text-white italic">#{order.id}</span>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1 tracking-wider opacity-60">{order.date}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-white tracking-tight">{order.customer}</span>
                        <span className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-widest">{order.phone}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm font-black text-white italic tracking-tighter">{order.amount}</td>
                    <td className="px-8 py-6">
                      <Badge variant={
                        order.status === 'Delivered' ? 'success' : 
                        order.status === 'Cancelled' ? 'danger' : 
                        order.status === 'Pending' ? 'warning' : 'info'
                      } className="rounded-lg px-3 py-1">
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          order.fraudRisk === 'Low' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 
                          order.fraudRisk === 'Medium' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                        )} />
                        <span className="text-[11px] font-black text-white uppercase tracking-widest">{order.fraudRisk}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/5 group-hover:border-primary/30 transition-all">
                           <Truck className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <span className="text-[11px] font-black text-white uppercase tracking-widest">{order.courier}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl bg-white/5 border-white/5 hover:bg-primary hover:text-white transition-all">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl bg-white/5 border-white/5">
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

        <div className="p-8 border-t border-white/[0.03] flex items-center justify-between bg-black/[0.1]">
           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Showing <span className="text-white">{orders.length}</span> individual entries</p>
           <div className="flex items-center gap-3">
              <Button variant="secondary" size="icon" className="h-11 w-11 rounded-xl" disabled>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                 <Button variant="primary" size="icon" className="h-11 w-11 rounded-xl text-xs">1</Button>
                 <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl text-xs hover:bg-white/5">2</Button>
                 <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl text-xs hover:bg-white/5">3</Button>
              </div>
              <Button variant="secondary" size="icon" className="h-11 w-11 rounded-xl">
                <ChevronRight className="w-5 h-5" />
              </Button>
           </div>
        </div>
      </Card>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <Card className="w-full max-w-2xl bg-[#0d0d0d] border-white/[0.05] p-12 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-emerald-400 to-primary/50" />
            
            <div className="flex items-center justify-between mb-10">
               <div>
                  <h2 className="text-3xl font-black text-white tracking-tight italic">Initiate <span className="text-primary">Order</span></h2>
                  <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Manual system entry protocol</p>
               </div>
               <Button variant="ghost" size="icon" onClick={() => setShowCreateModal(false)} className="rounded-full hover:bg-red-500/10 hover:text-red-500">
                  <X className="w-6 h-6" />
               </Button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Customer Identifier</label>
                  <Input 
                    required
                    value={formData.customerName}
                    onChange={e => setFormData({...formData, customerName: e.target.value})}
                    placeholder="Full legal name"
                    className="h-14 bg-white/[0.02]"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Secure Contact</label>
                  <Input 
                    type="tel" 
                    required
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="+880 1xxx-xxxxxx"
                    className="h-14 bg-white/[0.02]"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Product Manifest</label>
                <select 
                  required
                  value={formData.productName}
                  onChange={e => setFormData({...formData, productName: e.target.value})}
                  className="w-full h-14 bg-white/[0.02] border border-white/[0.05] rounded-[1.25rem] px-5 text-sm text-white font-black italic outline-none focus:ring-1 focus:ring-primary transition-all appearance-none"
                >
                  <option value="" className="bg-[#0d0d0d]">Select target SKU</option>
                  {products.map((p: any) => (
                    <option key={p.id} value={p.name} className="bg-[#0d0d0d]">
                      {p.name} — {p.price || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Unit Quantity</label>
                  <Input 
                    type="number" 
                    min="1"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                    className="h-14 bg-white/[0.02]"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Regional Vector</label>
                  <Input 
                    required
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                    placeholder="City / Region"
                    className="h-14 bg-white/[0.02]"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Delivery Vector Address</label>
                <textarea 
                  required
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-white/[0.02] border border-white/[0.05] rounded-[1.5rem] px-5 py-4 text-sm text-white font-medium outline-none focus:ring-1 focus:ring-primary transition-all h-28 resize-none"
                  placeholder="Precise destination coordinates..."
                />
              </div>

              <div className="flex gap-6 pt-6">
                <Button type="button" variant="secondary" className="flex-1 h-16 rounded-[1.5rem]" onClick={() => setShowCreateModal(false)}>Abort Process</Button>
                <Button type="submit" className="flex-1 h-16 rounded-[1.5rem]" variant="premium" disabled={isCreating}>
                  {isCreating ? 'Finalizing...' : 'Execute Order Entry'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};