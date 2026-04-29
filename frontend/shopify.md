 Shopify Admin API — Full Guide
1. Prerequisites
A Shopify store (e.g. innovistbd.myshopify.com)
A custom app created in Settings > Apps > Develop apps
App scopes: read_orders, write_orders, read_all_orders
2. Get Access Token
async function getAccessToken() {
  const res = await fetch(
    "https://innovistbd.myshopify.com/admin/oauth/access_token",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: process.env.SHOPIFY_CLIENT_ID,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET
      })
    }
  );
  const data = await res.json();
  return data.access_token; // shpat_... (valid ~24 hours)
}
3. Setup Base Config
const SHOP = "innovistbd.myshopify.com";
const API_VERSION = "2024-01";
const BASE_URL = `https://${SHOP}/admin/api/${API_VERSION}`;

async function shopifyFetch(endpoint, options = {}) {
  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
      ...options.headers
    }
  });
  return res.json();
}
4. Fetch Orders
Get all orders
async function getAllOrders() {
  const data = await shopifyFetch("/orders.json?status=any");
  return data.orders;
}
Get single order by ID
async function getOrder(orderId) {
  const data = await shopifyFetch(`/orders/${orderId}.json`);
  return data.order;
}
Get orders with filters
async function getFilteredOrders() {
  const data = await shopifyFetch(
    "/orders.json?status=open&limit=50&financial_status=paid"
  );
  return data.orders;
}
5. Create an Order
async function createOrder() {
  const data = await shopifyFetch("/orders.json", {
    method: "POST",
    body: JSON.stringify({
      order: {
        line_items: [
          {
            variant_id: 123456789, // your product variant ID
            quantity: 1
          }
        ],
        customer: {
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com"
        },
        billing_address: {
          first_name: "John",
          last_name: "Doe",
          address1: "123 Main St",
          city: "Dhaka",
          country: "Bangladesh",
          zip: "1200"
        },
        financial_status: "paid"
      }
    })
  });
  return data.order;
}
6. Update an Order
async function updateOrder(orderId) {
  const data = await shopifyFetch(`/orders/${orderId}.json`, {
    method: "PUT",
    body: JSON.stringify({
      order: {
        id: orderId,
        note: "Updated via API",
        tags: "vip, priority"
      }
    })
  });
  return data.order;
}
7. Cancel an Order
async function cancelOrder(orderId) {
  const data = await shopifyFetch(`/orders/${orderId}/cancel.json`, {
    method: "POST"
  });
  return data.order;
}
8. Fetch Products
async function getProducts() {
  const data = await shopifyFetch("/products.json");
  return data.products;
}
9. Environment Variables (.env)
SHOPIFY_CLIENT_ID=your_client_id_here
SHOPIFY_CLIENT_SECRET=your_client_secret_here
// Load at top of your app
require("dotenv").config();
10. Token Caching (Production Ready)
let cachedToken = null;
let tokenExpiry = null;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken; // reuse existing token
  }

  const res = await fetch(
    "https://innovistbd.myshopify.com/admin/oauth/access_token",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: process.env.SHOPIFY_CLIENT_ID,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET
      })
    }
  );

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 300) * 1000; // refresh 5 min early

  return cachedToken;
}
⚠️ Security Rules
Never hardcode credentials in your code
Always use .env files
Never expose the token in frontend/browser code
Rotate your client secret if it gets leaked
Always call the API from your backend server only