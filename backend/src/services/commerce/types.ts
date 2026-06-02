export interface NormalizedProduct {
  id: string;
  name: string;
  price: string;
  currency?: string;
  inStock: boolean;
  description?: string;
}

export interface PlaceOrderInput {
  customerName: string;
  phone: string;
  address: string;
  city: string;
  email: string;
  productName: string;
  quantity: number;
}

export interface PlaceOrderResult {
  orderId: string;
  orderNumber: string;
}

export interface CustomerOrderHistory {
  total: number;
  delivered: number;
  successRate: number; // 0..100
}

export interface CommerceProvider {
  name: 'woocommerce' | 'shopify';
  listProducts(limit?: number): Promise<NormalizedProduct[]>;
  searchProducts(query: string): Promise<NormalizedProduct[]>;
  createOrder(input: PlaceOrderInput): Promise<PlaceOrderResult>;
  getCustomerOrderHistory(phone: string): Promise<CustomerOrderHistory>;
}
