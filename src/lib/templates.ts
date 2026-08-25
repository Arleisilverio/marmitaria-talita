export interface ProductItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  available: boolean;
  stock?: number;
  image?: string;
}

export interface StoreTemplate {
  niche: 'espetinho' | 'marmitaria' | 'bolos_doces' | 'hamburgueria';
  label: string;
  icon: string;
  description: string;
  menu_data: {
    isOpen: boolean;
    hasDelivery: boolean;
    prepTime: number;
    deliveryFee: number;
    title: string;
    description: string;
    image: string;
    niche: 'espetinho' | 'marmitaria' | 'bolos_doces' | 'hamburgueria';
    prices?: { p: number; m: number; g: number };
    meats?: { name: string; available: boolean }[];
    drinks: { id?: string; name: string; price: number; available: boolean; stock?: number }[];
    slides: { id: string; title: string; description: string; image: string }[];
    products?: ProductItem[];
  };
}

export const STORE_TEMPLATES: Record<string, StoreTemplate> = {
  espetinho: {
    niche: 'espetinho',
    label: 'Espetinhos & Churrasco',
    icon: '🍢',
    description: 'Espetos na brasa, jantinhas completas, farofa, vinagrete e cerveja gelada.',
    menu_data: {
      isOpen: true,
      hasDelivery: true,
      prepTime: 25,
      deliveryFee: 5,
      title: 'Espetinho da Quebrada',
      description: 'O autêntico churrasco na brasa com tempero especial, jantinha completa e mandioca derretendo!',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800',
      niche: 'espetinho',
      slides: [
        {
          id: 'slide-esp-1',
          title: 'Espetos na Brasa',
          description: 'Carne macia, queijo coalho e linguiça toscana assados na hora!',
          image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1200'
        },
        {
          id: 'slide-esp-2',
          title: 'Jantinha Completa',
          description: 'Arroz quentinho, mandioca cozida, vinagrete fresco e farofa caseira.',
          image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=1200'
        }
      ],
      products: [
        {
          id: 'esp-alcatra',
          name: 'Espeto de Alcatra Nobre',
          description: 'Carne macia e suculenta assada na brasa com sal grosso.',
          price: 12.00,
          category: 'Espetos Tradicionais',
          available: true,
          stock: 35,
          image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&q=80&w=400'
        },
        {
          id: 'esp-frango-bacon',
          name: 'Espeto de Medalhão de Frango',
          description: 'Cubos de peito de frango envoltos em fatias crocantes de bacon.',
          price: 12.00,
          category: 'Espetos Tradicionais',
          available: true,
          stock: 25,
          image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&q=80&w=400'
        },
        {
          id: 'esp-linguica',
          name: 'Espeto de Linguiça Toscana',
          description: 'Linguiça toscana artesanal douradinha na brasa.',
          price: 10.00,
          category: 'Espetos Tradicionais',
          available: true,
          stock: 40,
          image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400'
        },
        {
          id: 'esp-queijo',
          name: 'Espeto de Queijo Coalho',
          description: 'Queijo coalho tostado com toque de melaço ou orégano.',
          price: 10.00,
          category: 'Espetos Tradicionais',
          available: true,
          stock: 20,
          image: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&q=80&w=400'
        },
        {
          id: 'esp-coracao',
          name: 'Espeto de Coração de Frango',
          description: 'Coraçãozinho marinado em ervas finas e grelhado no ponto.',
          price: 12.00,
          category: 'Espetos Tradicionais',
          available: true,
          stock: 20,
          image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400'
        },
        {
          id: 'esp-pao-alho',
          name: 'Pão de Alho Especial',
          description: 'Pão francês crocante recheado com pasta de alho e queijo derretido.',
          price: 9.00,
          category: 'Espetos Tradicionais',
          available: true,
          stock: 30,
          image: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&q=80&w=400'
        },
        {
          id: 'jantinha-master',
          name: 'Jantinha Completa (1 Espeto à escolha)',
          description: 'Acompanha: 1 Espeto, Arroz branco soltinho, Mandioca com manteiga, Vinagrete e Farofa crocante.',
          price: 24.00,
          category: 'Jantinhas & Pratos',
          available: true,
          stock: 30,
          image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400'
        },
        {
          id: 'jantinha-dupla',
          name: 'Jantinha Casal (2 Espetos à escolha)',
          description: 'Porção generosa de arroz, mandioca cozida, vinagrete especial e farofa temperada + 2 espetos.',
          price: 36.00,
          category: 'Jantinhas & Pratos',
          available: true,
          stock: 15,
          image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=400'
        },
        {
          id: 'extra-mandioca',
          name: 'Porção Extra de Mandioca na Manteiga',
          description: 'Mandioca cozida super macia com manteiga de garrafa.',
          price: 10.00,
          category: 'Acompanhamentos & Porções',
          available: true,
          stock: 25
        },
        {
          id: 'extra-vinagrete',
          name: 'Porção Extra de Vinagrete Caseiro',
          description: 'Tomate, cebola, pimentão e cheiro verde frescos.',
          price: 6.00,
          category: 'Acompanhamentos & Porções',
          available: true,
          stock: 30
        },
        {
          id: 'extra-farofa',
          name: 'Porção Extra de Farofa Crocante',
          description: 'Farofa na manteiga com bacon e cebola douradinha.',
          price: 6.00,
          category: 'Acompanhamentos & Porções',
          available: true,
          stock: 40
        }
      ],
      drinks: [
        { id: 'coca-lata', name: 'Coca-Cola 350ml', price: 6.00, available: true },
        { id: 'guarana-lata', name: 'Guaraná Antarctica 350ml', price: 5.00, available: true },
        { id: 'heineken-long', name: 'Cerveja Heineken Long Neck', price: 10.00, available: true },
        { id: 'amstel-lata', name: 'Cerveja Amstel Puro Malte 350ml', price: 7.00, available: true },
        { id: 'suco-laranja', name: 'Suco Natural de Laranja 500ml', price: 8.00, available: true }
      ]
    }
  },
  marmitaria: {
    niche: 'marmitaria',
    label: 'Marmitaria & Almoço',
    icon: '🍱',
    description: 'Marmitas com tamanhos P/M/G, carnes do dia, feijão caseiro e guarnições.',
    menu_data: {
      isOpen: true,
      hasDelivery: true,
      prepTime: 40,
      deliveryFee: 5,
      title: 'Marmitaria da Vila',
      description: 'Marmitas caseiras fresquinhas, feitas com carinho e o melhor tempero da vila.',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800',
      niche: 'marmitaria',
      prices: { p: 16, m: 20, g: 25 },
      meats: [
        { name: 'Bife Acebolado', available: true },
        { name: 'Frango Grelhado', available: true },
        { name: 'Costelinha de Porco', available: true }
      ],
      drinks: [
        { id: 'coca-lata', name: 'Coca-Cola 350ml', price: 6.00, available: true },
        { id: 'guarana-lata', name: 'Guaraná Antarctica 350ml', price: 5.00, available: true },
        { id: 'suco-laranja', name: 'Suco Natural de Laranja 500ml', price: 7.00, available: true }
      ],
      slides: []
    }
  },
  bolos_doces: {
    niche: 'bolos_doces',
    label: 'Bolos & Doces Artesanais',
    icon: '🍰',
    description: 'Bolos caseiros, fatias recheadas, tortas doces, sobremesas e cafés.',
    menu_data: {
      isOpen: true,
      hasDelivery: true,
      prepTime: 30,
      deliveryFee: 5,
      title: 'Doces & Bolos da Quebrada',
      description: 'Deliciosos bolos caseiros, fatias recheadas, tortas e doces artesanais feitos com carinho.',
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800',
      niche: 'bolos_doces',
      products: [
        {
          id: 'bolo-cenoura',
          name: 'Fatia Bolo de Cenoura c/ Brigadeiro',
          description: 'Massa fofinha com cobertura vulcão de brigadeiro belga.',
          price: 12.00,
          category: 'Fatias Especiais',
          available: true,
          image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=400'
        },
        {
          id: 'bolo-red-velvet',
          name: 'Fatia Red Velvet c/ Ninho',
          description: 'Massa aveludada vermelha recheada com mousse de leite ninho.',
          price: 15.00,
          category: 'Fatias Especiais',
          available: true,
          image: 'https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?auto=format&fit=crop&q=80&w=400'
        },
        {
          id: 'torta-limao',
          name: 'Torta de Limão no Pote',
          description: 'Base de biscoito amanteigado, creme de limão e merengue tostado.',
          price: 14.00,
          category: 'Sobremesas',
          available: true,
          image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&q=80&w=400'
        }
      ],
      drinks: [
        { id: 'cafe-expresso', name: 'Café Expresso Gourmet', price: 5.00, available: true },
        { id: 'cappuccino', name: 'Cappuccino Cremoso com Canela', price: 8.00, available: true },
        { id: 'agua-gas', name: 'Água com Gás 500ml', price: 4.00, available: true }
      ],
      slides: []
    }
  },
  hamburgueria: {
    niche: 'hamburgueria',
    label: 'Hamburgueria & Lanches',
    icon: '🍔',
    description: 'Burgers artesanais na brasa, smash burgers, batatas crocantes e combos.',
    menu_data: {
      isOpen: true,
      hasDelivery: true,
      prepTime: 35,
      deliveryFee: 6,
      title: 'Burguer da Quebrada',
      description: 'Burgers artesanais feitos na brasa com queijo derretido, bacon crocante e molho especial.',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800',
      niche: 'hamburgueria',
      products: [
        {
          id: 'burguer-classico',
          name: 'Smash Burguer Clássico',
          description: 'Pão brioche, 2x smash 90g, queijo cheddar duplo e maionese verde.',
          price: 24.00,
          category: 'Burgers Artesanais',
          available: true,
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400'
        },
        {
          id: 'burguer-bacon',
          name: 'Monster Bacon Cheddar',
          description: 'Pão brioche, burger 160g na brasa, muito bacon em fatias e barbecue.',
          price: 32.00,
          category: 'Burgers Artesanais',
          available: true,
          image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&q=80&w=400'
        },
        {
          id: 'batata-frita',
          name: 'Batata Rústica c/ Cheddar e Bacon',
          description: 'Batatas crocantes temperadas com páprica, molho cheddar e bacon bits.',
          price: 18.00,
          category: 'Acompanhamentos',
          available: true,
          image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&q=80&w=400'
        }
      ],
      drinks: [
        { id: 'coca-lata', name: 'Coca-Cola Lata 350ml', price: 6.00, available: true },
        { id: 'coca-2l', name: 'Coca-Cola 2 Litros', price: 14.00, available: true },
        { id: 'heineken-long', name: 'Heineken Long Neck', price: 10.00, available: true }
      ],
      slides: []
    }
  }
};
