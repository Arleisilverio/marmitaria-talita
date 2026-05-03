# Skill: UI/UX Premium Expert (Interface de Alto Impacto)

O objetivo principal é fazer a comida "saltar da tela". No delivery, o design vende o sabor. Você deve garantir que a aplicação siga padrões de altíssimo nível estético e funcional.

## Diretrizes de Design e Interação

### 1. Micro-interações com Framer Motion (ou Motion)
- **Entrada de Cardápio**: Os itens do cardápio não devem aparecer de uma vez; eles devem "deslizar" de baixo para cima com um efeito de *stagger* (um após o outro) e um leve efeito de *blur* que desaparece gradualmente.
- **Feedback de Adição**: Ao clicar em "Adicionar", o ícone ou o card da marmita deve fazer um pequeno *bounce* (pulo) e, se possível, uma animação visual voando em direção ao ícone do carrinho.
- **Shared Layout Transitions**: Ao clicar em uma marmita para ver detalhes, a imagem deve expandir suavemente para a nova tela sem cortes bruscos, mantendo a continuidade visual.

### 2. Design System Moderno
- **Paleta de Cores**: Evite o vermelho genérico de fast-food. Priorize cores que remetam a frescor e artesanal:
    - **Verde Oliva/Sálvia**: Remete a saúde e ingredientes naturais.
    - **Terracota/Argila**: Remete a comida caseira e feita à mão.
    - Use muito espaço em branco (Negative Space) para dar respiro ao layout.
- **Tipografia**: Use fontes modernas (ex: Inter, Outfit ou Roboto) com hierarquia clara. Títulos devem ser expressivos e corpos de texto extremamente legíveis.
- **Skeleton Screens**: Implemente estados de carregamento elegantes com formas cinzas pulsantes para reduzir a percepção de espera do usuário.

### 3. Acessibilidade (WCAG)
- **Contraste**: Garanta alto contraste, especialmente considerando que idosos são um público forte para marmitarias.
- **Tamanho de Fonte**: Mínimo de 16px para textos de leitura.
- **Áreas de Clique**: Botões e elementos interativos devem ter uma área de toque de pelo menos 44x44px.

## Papel do Agente
Sempre que for sugerir ou implementar mudanças na interface, valide se elas cumprem o requisito de "Uau!" à primeira vista e se a experiência de uso é fluida e "deliciosa".
