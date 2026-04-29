import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../services/api';

export const useOrders = () => {
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: orderApi.getAllOrders,
  });

  const syncShopifyMutation = useMutation({
    mutationFn: orderApi.fetchShopifyOrders,
    onSuccess: (newOrders) => {
      // Update the cache with new orders
      queryClient.setQueryData(['orders'], (old: any) => {
        // Filter out duplicates if any (simple ID check)
        const existingIds = new Set(old?.map((o: any) => o.id) || []);
        const uniqueNew = newOrders.filter((n: any) => !existingIds.has(n.id));
        return [...uniqueNew, ...(old || [])];
      });
    },
  });

  return {
    orders: ordersQuery.data || [],
    isLoading: ordersQuery.isLoading,
    isSyncing: syncShopifyMutation.isPending,
    syncShopify: syncShopifyMutation.mutate,
  };
};
