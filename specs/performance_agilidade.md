# ⚡ Performance e Agilidade — Marmitaria Talita

Como tornar o app profissional e extremamente rápido no carregamento.

## 1. Estratégia de Cache (Frontend)
Atualmente, o app busca dados do Supabase em cada carregamento de página sem cache persistente.
- **Recomendação**: Instalar o **TanStack Query (React Query)**.
  - **Por que?**: Ele mantém os dados do cardápio em memória. Se o usuário navegar entre páginas, o carregamento será instantâneo.
  - **Auto-Refresh**: Podemos configurar para atualizar os pedidos em segundo plano a cada 30 segundos.

## 2. Otimização de Imagens
- Uso de formatos modernos como **WebP**.
- Carregamento "Lazy Load" para imagens que não estão visíveis inicialmente.

## 3. Agilidade no Carregamento (Vite)
- **Code Splitting**: O painel de Admin não precisa ser carregado para o cliente que está apenas vendo o cardápio.
- **PWA (Progressive Web App)**: Transformar o app em PWA para que ele funcione offline e carregue como um aplicativo nativo no celular do cliente.

## 4. Supabase Realtime
- Implementar o `supabase.channel()` para que o painel administrativo receba novos pedidos instantaneamente, sem precisar atualizar a página (F5).

## 5. Plano de Ação
- [ ] Adicionar `@tanstack/react-query`.
- [ ] Refatorar `src/lib/api.ts` para usar hooks de query.
- [ ] Implementar Skeleton Screens (esqueletos de carregamento) para evitar que a tela fique branca enquanto os dados carregam.
