import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Store {
  id: string;
  name: string;
  platform: 'Shopify' | 'WooCommerce' | 'WordPress' | 'Custom';
  status: 'Connected' | 'Syncing' | 'Error';
  lastSync: string;
  url: string;
  accessToken?: string;
}

interface StoreState {
  stores: Store[];
  addStore: (store: Omit<Store, 'id' | 'status' | 'lastSync'>) => void;
  removeStore: (id: string) => void;
  syncStore: (id: string) => Promise<void>;
}

export const useStoreStore = create<StoreState>()(
  persist(
    (set) => ({
      stores: [
        { id: '1', name: 'Tzs Fashion Store', platform: 'Shopify', status: 'Connected', lastSync: '2 mins ago', url: 'tzsfashion.myshopify.com' },
        { id: '2', name: 'GamerGear Hub', platform: 'WooCommerce', status: 'Connected', lastSync: '10 mins ago', url: 'gamergear.com' },
      ],
      addStore: (newStore) => {
        const store: Store = {
          ...newStore,
          id: Math.random().toString(36).substr(2, 9),
          status: 'Syncing',
          lastSync: 'Just now',
        };
        set((state) => ({ stores: [...state.stores, store] }));
        
        // Simulate sync completion
        setTimeout(() => {
          set((state) => ({
            stores: state.stores.map((s) => 
              s.id === store.id ? { ...s, status: 'Connected' } : s
            )
          }));
        }, 3000);
      },
      removeStore: (id) => {
        set((state) => ({ stores: state.stores.filter((s) => s.id !== id) }));
      },
      syncStore: async (id) => {
        set((state) => ({
          stores: state.stores.map((s) => 
            s.id === id ? { ...s, status: 'Syncing' } : s
          )
        }));
        await new Promise((resolve) => setTimeout(resolve, 2000));
        set((state) => ({
          stores: state.stores.map((s) => 
            s.id === id ? { ...s, status: 'Connected', lastSync: 'Just now' } : s
          )
        }));
      },
    }),
    {
      name: 'scalefy-stores',
    }
  )
);
