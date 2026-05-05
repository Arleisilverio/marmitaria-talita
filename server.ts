import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// 🚨 CORREÇÃO DE SEGURANÇA 1: Token removido do código.
// O token agora VEM APENAS do ambiente seguro. Se não tiver no .env, ele quebra, mas não vaza.
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// 🚨 CORREÇÃO DE SEGURANÇA 2: Senha para a API.
const ADMIN_SECRET = process.env.ADMIN_SECRET || "talita_admin_secreto_2024";

// Menu continua aqui por enquanto
let db = {
  menu: {
    isOpen: true,
    isDeliveryOpen: true,
    prepTime: 40,
    deliveryFee: 5.00,
    title: "Feijoada Completa da Chef",
    description: "Feijoada preparada com carnes nobres, acompanhada de arroz soltinho, couve refogada no alho, farofa crocante e fatias de laranja fresca.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDio-CUjwbSHdtOpW2bJC5EbmkzcWYUVNO7tDX8q2xdFGzHiRYmvEnoV_asFWu0ZXviDJExABlfSUHh1wKJUrmbuPooLzVml6_Hixxmv4ug27sUwUiKYkpe2UkL8fI_hw6bD3m75gnDUpv67q461h1Q0KAQlm80t0LUSbhMWVvxiW6ow4FlyMzfcAzYz5UIhwRG4AvHhm6LuOBLB4TSYjcUwy3oW_ypBdhpZROCLCem9V_24gSB1z6gFGWIh5N_kszEH5kvFt0c81Y",
    prices: { p: 18.90, m: 24.90, g: 32.90 },
    meats: [
      { id: "m1", name: "Frango Grelhado", available: true },
      { id: "m2", name: "Bife Acebolado", available: true },
      { id: "m3", name: "Costelinha Suína", available: false },
    ],
    drinks: [
      { id: "d1", name: "Coca-Cola Lata 350ml", price: 6.00 },
    ]
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.get("/api/menu", (req, res) => res.json(db.menu));
  
  app.put("/api/menu", (req, res) => {
    // 🚨 CORREÇÃO DE SEGURANÇA 3: Barreira contra intrusos
    const clientSecret = req.headers['x-admin-secret'];
    if (clientSecret !== ADMIN_SECRET) {
      console.warn("⚠️ Tentativa de alteração de cardápio bloqueada!");
      return res.status(401).json({ error: "Acesso Negado. Credenciais inválidas." });
    }

    db.menu = { ...db.menu, ...req.body };
    res.json(db.menu);
  });

  app.post("/api/orders", async (req, res) => {
    const newOrder = req.body;

    // Se o token não existir (ambiente local sem .env), apenas loga e não quebra a API
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.warn("⚠️ Telegram Bot Token não configurado. Pedido recebido, mas não enviado ao Telegram.");
      return res.status(200).json({ success: true, warning: "Telegram not configured" });
    }

    try {
      const itemsList = newOrder.items_json?.map((item: any) =>
        `• ${item.name}${item.size ? ` (${item.size})` : ''} x${item.quantity}`
      ).join('\n') || 'Nenhum item';

      const message = `
🛍️ *NOVO PEDIDO: #${newOrder.id.substring(0, 8).toUpperCase()}*

👤 *Cliente:* ${newOrder.customer_name}
📞 *Telefone:* ${newOrder.customer_phone}
📍 *Endereço/Retirada:* ${newOrder.delivery_address}
💳 *Pagamento:* ${newOrder.payment_method?.toUpperCase()}${newOrder.change_for ? ` (Troco para ${newOrder.change_for})` : ''}

📋 *Itens:*
${itemsList}

💰 *TOTAL: R$ ${newOrder.total_amount?.toFixed(2)}*

---
_Pedido recebido via App Marmitaria_
      `;

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'Markdown'
        })
      });
    } catch (err) {
      console.error("Erro ao enviar Telegram:", err);
    }

    res.status(200).json({ success: true });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();