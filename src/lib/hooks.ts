/**
 * Hooks de Query — Marmitaria Talita
 * 
 * Centraliza todas as chamadas ao banco usando TanStack Query.
 * Benefícios: cache automático, zero tela branca, atualização em segundo plano.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

// ======================================================
// CHAVES DE CACHE — identificam cada tipo de dados
// ======================================================
export const queryKeys = {
  menu: (slug: string) => ['menu', slug] as const,
  orders: (slug: string) => ['orders', slug] as const,
  adminAccess: (email: string) => ['adminAccess', email] as const,
  appAdmins: () => ['appAdmins'] as const,
};

// ======================================================
// HOOK: Cardápio da loja
// Fica em cache por 5 minutos. Revalida em segundo plano.
// ======================================================
export function useMenu(slug: string) {
  return useQuery({
    queryKey: queryKeys.menu(slug),
    queryFn: () => api.getMenu(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,   // 5 minutos em cache
    gcTime: 10 * 60 * 1000,     // Mantém na memória por 10 min
    refetchOnWindowFocus: false, // Não refaz ao trocar de aba
  });
}

// ======================================================
// HOOK: Pedidos da loja
// Atualiza a cada 30 segundos automaticamente.
// ======================================================
export function useOrders(slug: string) {
  return useQuery({
    queryKey: queryKeys.orders(slug),
    queryFn: () => api.getOrders(slug),
    enabled: !!slug,
    staleTime: 0,                  // Sempre considera dados como "velhos"
    refetchInterval: 30 * 1000,    // Atualiza a cada 30s em segundo plano
    refetchIntervalInBackground: true,
  });
}

// ======================================================
// HOOK: Meus Pedidos (Visão do Cliente)
// ======================================================
export function useMyOrders(userId: string | undefined) {
  return useQuery({
    queryKey: ['myOrders', userId],
    queryFn: () => api.getMyOrders(userId!),
    enabled: !!userId,
    staleTime: 10 * 1000,          // 10 segundos
    refetchInterval: 30 * 1000,    // Atualiza a cada 30s
  });
}

// ======================================================
// HOOK: Verificar acesso admin
// ======================================================
export function useAdminAccess(email: string | undefined) {
  return useQuery({
    queryKey: queryKeys.adminAccess(email ?? ''),
    queryFn: () => api.checkAdminAccess(email!),
    enabled: !!email,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

// ======================================================
// MUTATION: Atualizar status do pedido
// Invalida o cache automaticamente após atualizar
// ======================================================
export function useUpdateOrderStatus(storeSlug: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.updateOrderStatus(id, status),
    onSuccess: () => {
      // Força recarregamento dos pedidos após atualizar
      queryClient.invalidateQueries({ queryKey: queryKeys.orders(storeSlug) });
    },
  });
}

// ======================================================
// MUTATION: Salvar cardápio
// ======================================================
export function useSaveMenu(storeSlug: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (menuData: any) => api.updateMenu(storeSlug, menuData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menu(storeSlug) });
    },
  });
}
