# 🎨 Guia de Estilo Premium — Marmitaria Talita

Diretrizes para manter o app com aparência profissional e de alto nível, baseado no **UI Premium Expert**.

## 1. Identidade Visual (Design System)
- **Cores**:
  - **Terracota (`#D14D1D`)**: Cor de destaque, usada para botões de ação e preços.
  - **Olive (`#556B2F`)**: Cor secundária, usada para detalhes orgânicos e selos.
  - **Fundo (`#09090B`)**: Dark mode profundo para uma sensação premium.
- **Tipografia**:
  - **Headings**: `Outfit` (Moderna e geométrica).
  - **Body**: `Inter` (Legibilidade máxima).

## 2. Efeitos Glassmorphism
Para um visual profissional, o app utiliza o efeito "Vidro":
- **Configuração**: `bg-zinc-900/50 backdrop-blur-xl border border-white/5`.
- **Onde usar**: Modais de pedido, Carrinho flutuante e Header.

## 3. Animações (Framer Motion)
Nada deve aparecer "seco" na tela.
- **Entrada**: Usar `fade-up` (deslizar para cima com opacidade) para os itens do cardápio.
- **Feedback**: Botões devem ter escala de `0.95` ao serem clicados.

## 4. UX Profissional
- **Micro-interações**: Pequenos ícones animados ao adicionar ao carrinho.
- **Empty States**: Quando não houver pedidos, mostrar uma ilustração bonita e não apenas "Sem pedidos".
- **Haptics**: (Para PWA) Pequenas vibrações ao confirmar ações.

## 5. Checklist de Qualidade Visual
- [ ] O contraste está adequado para leitura no sol?
- [ ] Os botões têm tamanho mínimo de 44px para dedos grandes?
- [ ] O carregamento inicial tem uma tela de splash profissional?
