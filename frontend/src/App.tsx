import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardHome } from './pages/DashboardHome';
import { OrderManagement } from './pages/OrderManagement';
import { StoreIntegration } from './pages/StoreIntegration';
import { FraudDetection } from './pages/FraudDetection';
import { AIAssistant } from './pages/AIAssistant';
import { AbandonedCheckout } from './pages/AbandonedCheckout';
import { CourierSupport } from './pages/CourierSupport';
import { NotificationsCenter } from './pages/NotificationsCenter';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './store/useAuthStore';

const queryClient = new QueryClient();

const App: React.FC = () => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<DashboardHome />} />
              <Route path="/orders" element={<OrderManagement />} />
              <Route path="/stores" element={<StoreIntegration />} />
              <Route path="/fraud" element={<FraudDetection />} />
              <Route path="/ai" element={<AIAssistant />} />
              <Route path="/abandoned" element={<AbandonedCheckout />} />
              <Route path="/courier" element={<CourierSupport />} />
              <Route path="/notifications" element={<NotificationsCenter />} />
              <Route path="/settings" element={<div className="p-8 text-white">Settings Page Coming Soon</div>} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
