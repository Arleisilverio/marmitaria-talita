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
import CourierDashboard from './pages/CourierDashboard';
import InstallPWA from './components/InstallPWA';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Timeout de segurança para garantir que a tela inicial abra sem travar
    const timer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 1200);

    supabase.auth.getSession()
      .then(({ data }) => {
        if (isMounted) {
          setSession(data?.session || null);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Auth getSession error fallback:", err);
        if (isMounted) setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#0d0f0c] flex flex-col items-center justify-center gap-4 text-white">
      <div className="w-12 h-12 border-3 border-[#e2725b] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">Carregando Da Quebrada...</p>
    </div>
  );

  return (
    <CartProvider>
      <Toaster position="top-center" reverseOrder={false} />
      <InstallPWA />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Marketplace />} />
          <Route path="/checkout" element={<ClientCheckout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/motoboy" element={<CourierDashboard />} />
          <Route path="/courier" element={<CourierDashboard />} />
          <Route path="/admin" element={session ? <AdminDashboard /> : <Navigate to="/login" />} />
          <Route path="/super-admin" element={session ? <SuperAdminDashboard /> : <Navigate to="/login" />} />
          <Route path="/:slug" element={<ClientHome />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}
