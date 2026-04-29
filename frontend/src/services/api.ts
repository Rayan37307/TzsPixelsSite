import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const orderApi = {
  // Simulate fetching Shopify orders
  fetchShopifyOrders: async () => {
    const response = await axios.get(`${API_BASE_URL}/orders`);
    return response.data;
  },

  getAllOrders: async () => {
    const response = await axios.get(`${API_BASE_URL}/orders`);
    return response.data;
  },

  fetchOrdersByStore: async (storeId: string, platform: string) => {
    // In production, the backend would handle the specific platform logic
    const response = await axios.get(`${API_BASE_URL}/orders`, {
      params: { storeId, platform }
    });
    return response.data;
  }
};
