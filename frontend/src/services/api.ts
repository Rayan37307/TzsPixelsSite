import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const storeApi = {
  connect: async (data: { shopUrl: string; clientId?: string; clientSecret?: string; platform: string; consumerKey?: string; consumerSecret?: string }) => {
    const response = await axios.post(`${API_BASE_URL}/stores/connect`, data);
    return response.data;
  },
  getAll: async () => {
    const response = await axios.get(`${API_BASE_URL}/stores`);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await axios.delete(`${API_BASE_URL}/stores/${id}`);
    return response.data;
  }
};

export const orderApi = {
  fetchShopifyOrders: async () => {
    const response = await axios.get(`${API_BASE_URL}/orders`);
    return response.data;
  },

  getAllOrders: async () => {
    const response = await axios.get(`${API_BASE_URL}/orders`);
    return response.data;
  },

  fetchOrdersByStore: async (storeId: string, platform: string) => {
    const response = await axios.get(`${API_BASE_URL}/orders`, {
      params: { storeId, platform }
    });
    return response.data;
  },

  createOrder: async (orderData: any) => {
    const response = await axios.post(`${API_BASE_URL}/orders/create`, orderData);
    return response.data;
  },

  getProducts: async () => {
    const response = await axios.get(`${API_BASE_URL}/orders/products`);
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

export const messagingApi = {
  getConversations: async () => {
    const response = await axios.get(`${API_BASE_URL}/messaging/conversations`);
    return response.data;
  },
  getConversation: async (id: string) => {
    const response = await axios.get(`${API_BASE_URL}/messaging/conversations/${id}`);
    return response.data;
  },
  searchConversations: async (query: string) => {
    const response = await axios.get(`${API_BASE_URL}/messaging/conversations/search?q=${query}`);
    return response.data;
  },
  takeOver: async (id: string, adminId: string = 'admin') => {
    const response = await axios.post(`${API_BASE_URL}/messaging/conversations/${id}/takeover`, { admin_id: adminId });
    return response.data;
  },
  returnToAI: async (id: string) => {
    const response = await axios.post(`${API_BASE_URL}/messaging/conversations/${id}/return-to-ai`);
    return response.data;
  },
  sendMessage: async (id: string, message: string, senderName: string = 'Support Team') => {
    const response = await axios.post(`${API_BASE_URL}/messaging/conversations/${id}/message`, { message, sender_name: senderName });
    return response.data;
  },
  getStats: async () => {
    const response = await axios.get(`${API_BASE_URL}/messaging/stats`);
    return response.data;
  }
};
