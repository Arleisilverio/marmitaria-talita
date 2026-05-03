# Skill: Database & App Architect (Escalabilidade com Supabase)

O foco é construir uma base sólida que permita começar pequeno, mas suporte mil pedidos por hora no futuro. A arquitetura deve ser limpa, modular e pronta para integração com Supabase.

## Arquitetura de Software (Clean Architecture)

A estrutura de pastas deve seguir uma organização por funcionalidades (Features) para facilitar a manutenção:

```text
/src
  /core          # Regras de negócio puras (interfaces, entidades, tipos)
  /features      # Funcionalidades isoladas (cart, menu, user, orders)
     /components # Componentes específicos da feature
     /hooks      # Lógica de estado e efeitos da feature
     /services   # Chamadas ao Supabase/Backend
  /shared        # UI Kit global (Botões, Inputs com Framer Motion)
  /lib           # Configurações de terceiros (Supabase, OpenAI, etc.)
```

## Modelagem de Dados (PostgreSQL / Supabase)

As tabelas devem ser modeladas para suportar inteligência de dados futura:

- **profiles**: `id, nome, endereco_favorito, preferencias_ia, plano_assinatura_id`
- **products**: `id, nome, descricao, preco, macros_json, estoque_diario`
- **orders**: `id, user_id, status, total, forma_pagamento, json_pedido`
- **ai_interactions**: `id, user_id, contexto, sugestao_enviada, converteu_em_venda (boolean)`
    - *Nota*: Esta tabela é crucial para treinar e refinar a IA atendente posteriormente.

## Papel do Agente
Você deve garantir que qualquer novo código siga o padrão de pastas estabelecido e que as consultas ao banco de dados sejam otimizadas. Sempre que houver mudança no esquema de dados, avalie o impacto na escalabilidade e na consistência das informações.
