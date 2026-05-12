# 🛡️ Auditoria de Segurança — Marmitaria Talita

Esta auditoria foi realizada seguindo as diretrizes do **Security Auditor Expert**.

## PARTE 1 — Riscos Críticos (Emergência 🚨)

1.  **Chaves Supabase Expostas**:
    *   `src/integrations/supabase/client.ts`: A `SUPABASE_PUBLISHABLE_KEY` está hardcoded diretamente no arquivo.
    *   `src/lib/api.ts`: A anon key está sendo passada diretamente no header `Authorization` na função `processAI`.
    *   **Risco**: Qualquer pessoa com acesso ao código (ou inspecionando o navegador) pode usar sua chave para fazer requisições ao seu banco.
2.  **Service Role Key vs Anon Key**:
    *   Embora a chave exposta seja a "anon", se o banco não tiver **RLS (Row Level Security)** habilitado em todas as tabelas, qualquer pessoa pode deletar ou alterar seus dados.

## PARTE 2 — Riscos Médios

1.  **Segurança do Chat de IA**:
    *   A função `processAI` envia mensagens diretamente para uma Edge Function do Supabase. Sem uma camada de rate-limiting ou validação rigorosa, um usuário mal-intencionado pode gerar custos excessivos na sua API do Gemini.
2.  **Validação de Admin**:
    *   O check de admin em `api.ts` (`checkAdminAccess`) busca por e-mail na tabela `app_admins`. Se o RLS permitir leitura pública dessa tabela, qualquer um pode descobrir quem são os administradores.

## PARTE 3 — Melhorias Recomendadas (Boas Práticas)

1.  **Variáveis de Ambiente**:
    *   Mover TODAS as chaves para o arquivo `.env`.
    *   No código, usar `import.meta.env.VITE_SUPABASE_URL` etc.
2.  **Row Level Security (RLS)**:
    *   Garantir que a tabela `orders` só permita inserção pública, mas leitura apenas por administradores autenticados.
3.  **Sanitização de Inputs**:
    *   Validar o tamanho e conteúdo das mensagens enviadas ao chat para evitar abusos.

## PARTE 4 — Plano de Correção

1.  **Imediato**: Limpar as chaves do código e usar variáveis de ambiente.
2.  **Curto Prazo**: Configurar Políticas de RLS no painel do Supabase.
3.  **Médio Prazo**: Implementar verificação de JWT real para o painel administrativo.
