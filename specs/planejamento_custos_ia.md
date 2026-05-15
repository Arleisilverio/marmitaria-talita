# 💰 Projeções de Custos com IA (LLM) — Marmitaria Talita

Este documento é de uso exclusivo dos desenvolvedores. O objetivo é mapear, prever e otimizar os custos de consumo da API da OpenAI no processo de atendimento automatizado via Telegram.

## 1. O Modelo Atual: `gpt-4o-mini`

Atualmente, a Edge Function do Telegram utiliza o `gpt-4o-mini`.
Este modelo foi escolhido por ser extremamente rápido e ter o melhor custo-benefício do mercado para tarefas de raciocínio simples e extração de dados (como chamar a função `register_order`).

**Tabela de Preços Oficial (OpenAI - Ref: 2024):**
- **Input (Entrada de texto):** US$ 0,15 por 1 Milhão de tokens.
- **Output (Saída/Resposta):** US$ 0,60 por 1 Milhão de tokens.

*(Nota: 1 token ≈ 3/4 de uma palavra. 1000 tokens ≈ 750 palavras).*

---

## 2. Anatomia de um Pedido (Estimativa de Consumo)

Para calcular o custo real, precisamos entender o tamanho do `prompt` que enviamos a cada mensagem do cliente.

**O que enviamos a cada requisição (Input):**
1. **System Prompt (Regras + Dados do Cliente + Cardápio):** ~500 tokens.
2. **Histórico da Conversa (últimas 10 mensagens):** ~300 tokens.
3. **Nova mensagem do cliente:** ~20 tokens.
4. **Tools/Functions (Definição do `register_order`):** ~150 tokens.
- **Total de Input por mensagem:** ~970 tokens.

**O que a IA devolve (Output):**
- Respostas curtas (ex: "Claro, quer bebida?"): ~40 tokens.

### A Jornada de 1 Pedido Completo
Geralmente, um cliente troca em média **5 a 6 mensagens** com o bot até fechar o pedido:
1. *Oi, quero pedir* -> (Input 970 / Output 40)
2. *Quero a marmita G* -> (Input 1050 / Output 40)
3. *Sim, com bife acebolado* -> (Input 1130 / Output 40)
4. *Vou pagar no Pix* -> (Input 1210 / Output 40)
5. *Pode fechar* -> (Input 1290 / Output Tool Call) -> (Input 1350 / Output Confirmação)

**Consumo Total Médio por 1 Pedido Fechado:**
- **Input Total:** ~7.000 tokens
- **Output Total:** ~250 tokens

---

## 3. Projeção Financeira (Por Pedido)

Convertendo os tokens acima para dinheiro (Considerando Dólar a R$ 5,50):

**Custo de 1 Pedido:**
- Input (7k tokens): US$ 0,00105
- Output (250 tokens): US$ 0,00015
- **Custo Total (USD): ~US$ 0,0012 por pedido**
- **Custo Total (BRL): ~R$ 0,006 (Menos de 1 centavo por pedido!)**

**Projeção Mensal de Pedidos:**
| Volume de Pedidos | Custo Estimado (USD) | Custo Estimado (BRL) |
|-------------------|----------------------|----------------------|
| 100 pedidos       | US$ 0,12             | R$ 0,66              |
| 500 pedidos       | US$ 0,60             | R$ 3,30              |
| 1.000 pedidos     | US$ 1,20             | R$ 6,60              |
| 5.000 pedidos     | US$ 6,00             | R$ 33,00             |
| 10.000 pedidos    | US$ 12,00            | R$ 66,00             |

---

## 4. Estudo de Viabilidade SaaS (Micro-SaaS)

Simulação de modelo de negócios para comercialização do app no formato "Software as a Service", cobrando uma mensalidade fixa e utilizando planos de hospedagem gratuitos (Bootstrapper).

**Cenário Base:**
- 10 lojas parceiras pagando **R$ 50,00/mês**.
- Média de **30 pedidos/dia** por loja (Total: 9.000 pedidos/mês na plataforma).

**Receitas:**
- 10 lojas × R$ 50,00 = **R$ 500,00 / mês**.

**Despesas Estimadas:**
- **OpenAI:** ~R$ 54,00 (Para 9.000 pedidos/mês a R$ 0,006 cada).
- **Supabase (Banco/Backend):** R$ 0,00 (O plano Free suporta até 500MB e 50k usuários, sobra espaço para 10 lojas).
- **Vercel (Hospedagem Frontend):** R$ 0,00 (Plano Hobby suporta perfeitamente o tráfego inicial).
- **Domínio:** ~R$ 3,33 (R$ 40/ano).
- **Custo Fixo Total:** **~R$ 57,33 / mês**.

**Lucro e Margem:**
- Lucro Líquido: **R$ 442,67 / mês**.
- Margem de Lucro: **~88%**.

**Escalabilidade (Quando precisar pagar servidor):**
Se a plataforma crescer para 50 lojas, o banco de dados pode precisar do plano PRO do Supabase (US$ 25). Mesmo assim, com 50 lojas a R$ 50 (R$ 2.500 de receita), subtraindo R$ 137 do banco e uns R$ 250 de IA, o lucro salta para mais de **R$ 2.000,00 livres**.

---

## 5. Plano de Contenção e Economia (Estratégias Futuras)

Embora seja barato, se o app escalar para milhares de lojas, o custo acumula. Aqui estão técnicas para reduzir a conta no futuro:

### A. Limite de Histórico de Conversa
Atualmente o código guarda as últimas 10 interações. Se o custo subir, podemos alterar para `slice(-6)`. A IA lembrará apenas das últimas 3 interações (3 do usuário, 3 da IA), cortando o uso de Input tokens pela metade no fim da conversa.

### B. Minificação de JSON
O cardápio passado no `system_prompt` está injetando todas as propriedades. No futuro, podemos mapear o objeto do banco para enviar apenas o essencial (ex: ignorar URLs de imagens no prompt do Telegram).

### C. Alertas de Limite (Hard Caps na OpenAI)
**OBRIGATÓRIO PARA BOOTSTRAPPERS:**
Configure um **Soft Limit** de US$ 5.00 e um **Hard Limit** de US$ 10.00 na OpenAI para evitar ataques de spam gerando faturas indesejadas.

---
*Documento gerado para controle interno do CTO/Desenvolvedor.*