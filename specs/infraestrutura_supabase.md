# 🏗️ Especificação de Infraestrutura — Marmitaria Talita

Documentação de infraestrutura baseada no **Supabase Backend Expert** e **Vercel CI/CD Expert**.

## 1. Arquitetura do Sistema
O projeto utiliza uma arquitetura **Serverless** composta por:
- **Frontend**: React 19 hospedado na **Vercel**.
- **Backend (BaaS)**: **Supabase** provendo:
  - Banco de Dados PostgreSQL.
  - Autenticação de usuários.
  - Edge Functions (Processamento de IA).
  - Realtime (Status de pedidos).

## 2. Esquema do Banco de Dados (Proposto/Atual)
As tabelas principais identificadas para este app profissional:
- `store_settings`: Configurações da loja (nome, slug, menu JSON).
- `orders`: Registro de pedidos dos clientes.
- `app_admins`: Controle de quem pode acessar o painel administrativo.

## 3. Fluxo de CI/CD (Vercel + GitHub)
Para manter o profissionalismo e agilidade:
- **Branches**:
  - `main`: Produção (Vercel faz deploy automático ao dar push).
  - `develop`: Testes e novas funcionalidades.
- **Environment Variables**: Devem ser configuradas no Dashboard da Vercel para que não fiquem no código.

## 4. Edge Functions
O app utiliza uma função chamada `ai-process`.
- **Localização**: Deve ficar em `supabase/functions/ai-process`.
- **Deploy**: Feito via Supabase CLI (`supabase functions deploy ai-process`).

## 5. Próximos Passos de Infra
- [ ] Criar pasta `supabase/migrations` para versionar o banco.
- [ ] Configurar logs na Vercel para monitorar erros de clientes em tempo real.
