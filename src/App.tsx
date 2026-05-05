import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { supabase } from './integrations/supabase/client';
import { CartProvider } from './contexts/CartContext';
import ClientHome from './pages/ClientHome';
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

  if (loading) return null;

  const isSuperAdmin = session?.user?.email === 'arleisilverio41@gmail.com';

  return (
    <CartProvider>
      <Toaster position="top-center" reverseOrder={false} />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
          
          {/* Rota principal (pode ser uma lista de lojas ou redirecionar para a padrão) */}
          <Route path="/" element={<Navigate to="/s/marmitaria-talita" />} />
          
          {/* ROTA DA LOJA DINÂMICA (Multi-tenant) */}
          <Route path="/s/:slug" element={<ClientHome />} />
          <Route path="/checkout/:slug" element={<ClientCheckout />} />
          
          <Route 
            path="/super-admin" 
            element={isSuperAdmin ? <SuperAdminDashboard /> : <Navigate to="/" />} 
          />

          <Route 
            path="/admin" 
            element={session ? <AdminDashboard /> : <Navigate to="/login" />} 
          />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}