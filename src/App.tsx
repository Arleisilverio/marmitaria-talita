import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { supabase } from './integrations/supabase/client';
import { CartProvider } from './contexts/CartContext';
import ClientHome from './pages/ClientHome';
import ClientCheckout from './pages/ClientCheckout';
import AdminDashboard from './pages/AdminDashboard';
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

  const isAdmin = session?.user?.email === 'arleisilverio41@gmail.com';

  return (
    <CartProvider>
      <Toaster position="top-center" reverseOrder={false} />
      <BrowserRouter>
        <Routes>
          {/* REGRA CORRIGIDA: Se logar como Admin, vai para /admin. Se for Cliente, vai para / */}
          <Route 
            path="/login" 
            element={
              !session 
                ? <Login /> 
                : (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/" />)
            } 
          />
          
          <Route path="/" element={<ClientHome />} />
          <Route path="/checkout" element={<ClientCheckout />} />
          
          <Route 
            path="/admin" 
            element={isAdmin ? <AdminDashboard /> : <Navigate to="/" />} 
          />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}