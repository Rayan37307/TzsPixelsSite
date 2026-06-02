import axios from 'axios';
import { NotificationService } from './notificationService.js';

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

export class ShopifyService {
  private static get SHOP() {
    return process.env.SHOPIFY_SHOP || 'innovist-bd.myshopify.com';
  }

  private static get API_VERSION() {
    return '2024-01';
  }

  private static get BASE_URL() {
    return `https://${this.SHOP}/admin/api/${this.API_VERSION}`;
  }

  static isConfigured(): boolean {
    return !!(process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET);
  }

  /**
   * Exchanges Client ID and Client Secret for an Access Token with caching
   */
  static async getAccessToken() {
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
      console.log('🔑 Using cached Shopify access token');
      return cachedToken;
    }

    console.log('🔄 Fetching new Shopify access token...');
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', process.env.SHOPIFY_CLIENT_ID || '');
      params.append('client_secret', process.env.SHOPIFY_CLIENT_SECRET || '');

      const response = await axios.post(
        `https://${this.SHOP}/admin/oauth/access_token`,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      cachedToken = response.data.access_token;
      // Refresh 5 minutes early
      tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

      console.log('✅ New access token obtained');
      return cachedToken;
    } catch (error: any) {
      console.error(`❌ Error fetching Shopify access token:`, error.response?.data || error.message);
      throw new Error('Failed to fetch Shopify access token');
    }
  }

  /**
   * Base fetch function for Shopify API
   */
  private static async shopifyFetch(endpoint: string, options: any = {}) {
    const token = await this.getAccessToken();
    console.log(`📡 [Shopify API] ${options.method || 'GET'} ${endpoint}`);
    try {
      const response = await axios({
        url: `${this.BASE_URL}${endpoint}`,
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': token,
          ...options.headers,
        },
      });
      console.log(`✅ [Shopify API] Success ${endpoint}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ [Shopify API] Error ${endpoint}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Fetch all orders and normalize them to Tzs Pixels format
   */
  static async fetchOrders() {
    const data = await this.shopifyFetch('/orders.json?status=any&limit=50');
    
    return data.orders.map((order: any) => ({
      id: `SHP-${order.order_number}`,
      customer: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() || 'Guest',
      phone: order.customer?.phone || order.billing_address?.phone || 'N/A',
      amount: `${order.currency} ${order.total_price}`,
      status: order.fulfillment_status === 'fulfilled' ? 'Delivered' : 
              order.fulfillment_status === null ? 'Pending' : 'Shipped',
      fraudRisk: order.risk_level === 'high' ? 'High' : 
                 order.risk_level === 'medium' ? 'Medium' : 'Low',
      courier: 'Shopify Logistics',
      date: new Date(order.created_at).toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric', year: 'numeric' 
      })
    }));
  }

  /**
   * Get single order by ID
   */
  static async getOrder(orderId: string) {
    const data = await this.shopifyFetch(`/orders/${orderId}.json`);
    return data.order;
  }

  /**
   * Create an order
   */
  static async createOrder(orderData: any) {
    const data = await this.shopifyFetch('/orders.json', {
      method: 'POST',
      data: { order: orderData }
    });
    
    // Add notification
    const order = data.order;
    await NotificationService.addNotification({
      type: 'order',
      title: 'New Order Received',
      message: `${order.customer?.first_name || 'A customer'} just placed an order for ${order.currency} ${order.total_price}.`,
      time: 'Just now'
    });

    return order;
  }

  /**
   * Update an order
   */
  static async updateOrder(orderId: string, updateData: any) {
    const data = await this.shopifyFetch(`/orders/${orderId}.json`, {
      method: 'PUT',
      data: { order: { id: orderId, ...updateData } }
    });
    return data.order;
  }

  /**
   * Cancel an order
   */
  static async cancelOrder(orderId: string) {
    const data = await this.shopifyFetch(`/orders/${orderId}/cancel.json`, {
      method: 'POST'
    });
    return data.order;
  }

  /**
   * Fetch products
   */
  static async getProducts() {
    const data = await this.shopifyFetch('/products.json');
    return data.products;

  }

  /**
   * GraphQL fetch for Shopify
   */
  private static async shopifyGraphQL(query: string, variables: any = {}) {
    const token = await this.getAccessToken();
    const response = await axios.post(
      `${this.BASE_URL}/graphql.json`,
      { query, variables },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': token,
        },
      }
    );
    if (response.data.errors) {
      console.error('❌ [Shopify GraphQL] Errors:', response.data.errors);
      throw new Error(response.data.errors[0].message);
    }
    return response.data.data;
  }

  /**
   * Fetch abandoned checkouts
   */
  static async fetchAbandonedCheckouts() {
    const query = `
      query GetAbandonedCheckouts($cursor: String) {
        abandonedCheckouts(first: 50, after: $cursor) {
          edges {
            node {
              id
              createdAt
              updatedAt
              abandonedCheckoutUrl
              completedAt
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              lineItems(first: 10) {
                edges {
                  node {
                    title
                    quantity
                    variant {
                      id
                      price
                    }
                  }
                }
              }
              customer {
                id
                firstName
                lastName
                email
                phone
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const allCheckouts: any[] = [];
    let cursor: string | null = null;
    let hasNextPage = true;

    while (hasNextPage) {
      const data = await this.shopifyGraphQL(query, { cursor });
      const checkouts = data.abandonedCheckouts.edges;
      
      for (const edge of checkouts) {
        const node = edge.node;
        if (!node.completedAt) {
          allCheckouts.push({
            id: node.id,
            createdAt: node.createdAt,
            updatedAt: node.updatedAt,
            checkoutUrl: node.abandonedCheckoutUrl,
            email: node.customer?.email,
            phone: node.customer?.phone,
            amount: parseFloat(node.totalPriceSet?.shopMoney?.amount || '0'),
            currency: node.totalPriceSet?.shopMoney?.currencyCode || 'BDT',
            lineItems: node.lineItems?.edges?.map((e: any) => ({
              title: e.node.title,
              quantity: e.node.quantity,
              price: parseFloat(e.node.variant?.price || '0'),
            })) || [],
            customer: node.customer,
          });
        }
      }

      hasNextPage = data.abandonedCheckouts.pageInfo.hasNextPage;
      cursor = data.abandonedCheckouts.pageInfo.endCursor;
    }

    return allCheckouts;
  }
}
