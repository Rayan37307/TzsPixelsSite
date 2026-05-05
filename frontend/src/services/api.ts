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
  },

  connectShopify: async (shopUrl: string, clientId: string, clientSecret: string) => {
    const response = await axios.post(`${API_BASE_URL}/stores/connect`, {
      shopUrl, clientId, clientSecret
    });
    return response.data;
  }
};

export const dashboardApi = {
  getStats: async () => {
    const response = await axios.get(`${API_BASE_URL}/dashboard/stats`);
    return response.data;
  }
};

export const notificationApi = {
  getNotifications: async () => {
    const response = await axios.get(`${API_BASE_URL}/notifications`);
    return response.data;
  },
  markAsRead: async (id: string) => {
    const response = await axios.post(`${API_BASE_URL}/notifications/${id}/read`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await axios.post(`${API_BASE_URL}/notifications/read-all`);
    return response.data;
  }
};

export const botApi = {
  createBot: async (data: any) => {
    const response = await axios.post(`${API_BASE_URL}/bots`, data);
    return response.data;
  },
  getAllBots: async () => {
    const response = await axios.get(`${API_BASE_URL}/bots`);
    return response.data;
  },
  getBot: async (id: string) => {
    const response = await axios.get(`${API_BASE_URL}/bots/${id}`);
    return response.data;
  },
  updateBot: async (id: string, data: any) => {
    const response = await axios.put(`${API_BASE_URL}/bots/${id}`, data);
    return response.data;
  },
  deleteBot: async (id: string) => {
    const response = await axios.delete(`${API_BASE_URL}/bots/${id}`);
    return response.data;
  },
  chat: async (id: string, message: string, history: any[]) => {
    const response = await axios.post(`${API_BASE_URL}/bots/${id}/chat`, { message, history });
    return response.data;
  }
};

export const fraudApi = {
  fetchFraudChecks: async (status?: string) => {
    const response = await axios.get(`${API_BASE_URL}/fraud/results`, { params: { status } });
    return response.data;
  },
  triggerFraudScan: async () => {
    const response = await axios.post(`${API_BASE_URL}/fraud/scan`);
    return response.data;
  },
  updateFraudStatus: async (orderId: string, status: string) => {
    const response = await axios.patch(`${API_BASE_URL}/fraud/results/${orderId}`, { status });
    return response.data;
  }
};

export const messengerApi = {
  getConversations: async () => {
    const response = await axios.get(`${API_BASE_URL}/messenger/conversations`);
    return response.data;
  },
  getConversation: async (chatId: string) => {
    const response = await axios.get(`${API_BASE_URL}/messenger/conversations/${chatId}`);
    return response.data;
  }
};
