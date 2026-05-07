import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { supabase } from './integrations/supabase/client';
import { CartProvider } from './contexts/CartContext';
import ClientHome from './pages/ClientHome';
import Marketplace from './pages/Marketplace';
import ClientCheckout from './pages/ClientCheckout';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Login from './pages/Login';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#0d0f0c] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#e2725b] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <CartProvider>
      <Toaster position="top-center" reverseOrder={false} />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Marketplace />} />
          <Route path="/checkout" element={<ClientCheckout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={session ? <AdminDashboard /> : <Navigate to="/login" />} />
          <Route path="/super-admin" element={session ? <SuperAdminDashboard /> : <Navigate to="/login" />} />
          <Route path="/:slug" element={<ClientHome />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}
