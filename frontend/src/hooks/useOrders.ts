import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi, fraudApi } from '../services/api';

export const useOrders = () => {
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: orderApi.getAllOrders,
  });

  const fraudQuery = useQuery({
    queryKey: ['fraudChecks'],
    queryFn: () => fraudApi.fetchFraudChecks(),
  });

  const syncShopifyMutation = useMutation({
    mutationFn: orderApi.fetchShopifyOrders,
    onSuccess: (newOrders) => {
      queryClient.setQueryData(['orders'], (old: any) => {
        const existingIds = new Set(old?.map((o: any) => o.id) || []);
        const uniqueNew = newOrders.filter((n: any) => !existingIds.has(n.id));
        return [...uniqueNew, ...(old || [])];
      });
    },
  });

  const orders = (ordersQuery.data || []).map((order: any) => {
    const fraudCheck = fraudQuery.data?.data?.find((f: any) => f.orderId === order.id);
    return {
      ...order,
      fraudRisk: fraudCheck?.riskLevel || order.fraudRisk || 'Low',
      fraudScore: fraudCheck?.riskScore || 0,
    };
  });

  return {
    orders,
    isLoading: ordersQuery.isLoading,
    isSyncing: syncShopifyMutation.isPending,
    syncShopify: syncShopifyMutation.mutate,
  };
};
