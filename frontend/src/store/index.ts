import { create } from 'zustand';

interface AuthState {
  user: { name: string; email: string; role: string; avatar?: string } | null;
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: { 
    name: "Noah Brooks", 
    email: "noah@scalefy.ai", 
    role: "HR Lead",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Noah"
  },
  isAuthenticated: true, // Default to true for prototype
  login: async () => {
    // Mock login
    set({ 
      user: { name: "Noah Brooks", email: "noah@scalefy.ai", role: "HR Lead" }, 
      isAuthenticated: true 
    });
  },
  logout: () => set({ user: null, isAuthenticated: false }),
}));

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
