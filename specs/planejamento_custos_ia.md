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

## 3. Projeção Financeira

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

**Conclusão Financeira:** 
O custo operacional da IA é **insignificante** perto da margem de lucro de uma marmita. Você gastará cerca de R$ 6,60 para fechar MIL pedidos automatizados.

---

## 4. Plano de Contenção e Economia (Estratégias Futuras)

Embora seja barato, se o app escalar para milhares de lojas (SaaS), o custo acumula. Aqui estão técnicas para reduzir a conta no futuro:

### A. Limite de Histórico de Conversa
Atualmente o código guarda:
`const newHistory = [...chatHistory, ...].slice(-10);`
Se o custo subir, podemos alterar o `slice(-10)` para `slice(-6)`. A IA lembrará apenas das últimas 3 interações (3 do usuário, 3 da IA), o que é suficiente para pedidos de comida e corta o uso de Input tokens pela metade no fim da conversa.

### B. Minificação de JSON
O cardápio passado no `system_prompt` está injetando todas as propriedades. No futuro, podemos mapear o objeto do banco para enviar apenas o essencial:
Em vez de enviar a URL das imagens das bebidas para a IA (que ela não usa), mapeamos apenas `{ nome, preco }`.

### C. Alertas de Limite (Hard Caps na OpenAI)
**OBRIGATÓRIO PARA BOOTSTRAPPERS:**
Vá no painel da OpenAI (platform.openai.com) > *Settings* > *Billing* > *Usage Limits*.
1. Configure um **Soft Limit** de US$ 5.00 (Você recebe um email se bater).
2. Configure um **Hard Limit** de US$ 10.00 (A API bloqueia temporariamente se houver um ataque de spam no bot, salvando seu cartão de crédito).

### D. Alternativa Gratuita Temporária (Gemini)
Se a grana acabar de vez, o código atual pode ser refatorado para usar a API do Google Gemini 1.5 Flash. O Google atualmente oferece um *Free Tier* gigantesco (até 15 requisições por minuto de graça). A desvantagem é que o suporte a "Tool Calling" (chamar a função de salvar pedido) exige uma lógica um pouco mais complexa do que a da OpenAI. Por enquanto, o gpt-4o-mini vale a paz de espírito.

---
*Documento gerado para controle interno do CTO/Desenvolvedor.*