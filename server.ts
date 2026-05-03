import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8791437029:AAFIHtfz1gMDStGYJVlBMRmqGWWCYwgtwaE";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "-1002264660946";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// In-memory Database
let db = {
  menu: {
    title: "Feijoada Completa da Chef",
    description: "Feijoada preparada com carnes nobres, acompanhada de arroz soltinho, couve refogada no alho, farofa crocante e fatias de laranja fresca.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDio-CUjwbSHdtOpW2bJC5EbmkzcWYUVNO7tDX8q2xdFGzHiRYmvEnoV_asFWu0ZXviDJExABlfSUHh1wKJUrmbuPooLzVml6_Hixxmv4ug27sUwUiKYkpe2UkL8fI_hw6bD3m75gnDUpv67q461h1Q0KAQlm80t0LUSbhMWVvxiW6ow4FlyMzfcAzYz5UIhwRG4AvHhm6LuOBLB4TSYjcUwy3oW_ypBdhpZROCLCem9V_24gSB1z6gFGWIh5N_kszEH5kvFt0c81Y",
    prices: { p: 18.90, m: 24.90, g: 32.90 },
    meats: [
      { id: "m1", name: "Frango Grelhado", available: true },
      { id: "m2", name: "Bife Acebolado", available: true },
      { id: "m3", name: "Costelinha Suína", available: false },
      { id: "m4", name: "Ovo Frito", available: true },
      { id: "m5", name: "Filé de Peixe", available: false },
      { id: "m6", name: "Lombo Assado", available: true },
    ],
    drinks: [
      { id: "d1", name: "Coca-Cola Lata 350ml", price: 6.00 },
      { id: "d2", name: "Suco de Laranja 500ml", price: 9.00 },
      { id: "d3", name: "Guaraná Antarctica 600ml", price: 8.00 },
    ]
  },
  orders: [] as any[]
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---
  
  // 1. Get current menu
  app.get("/api/menu", (req, res) => {
    res.json(db.menu);
  });

  // 2. Update menu (Admin)
  app.put("/api/menu", (req, res) => {
    db.menu = { ...db.menu, ...req.body };
    res.json(db.menu);
  });

  // 3. Get all orders (Admin)
  app.get("/api/orders", (req, res) => {
    res.json(db.orders.sort((a, b) => b.createdAt - a.createdAt));
  });

  // 4. Create new order (Client or Telegram Bot)
  app.post("/api/orders", async (req, res) => {
    const newOrder = {
      id: Math.random().toString(36).substr(2, 9),
      ...req.body,
      status: "pendente",
      createdAt: Date.now()
    };
    db.orders.push(newOrder);

    // Enviar para o Telegram
    try {
      const itemsList = newOrder.itens.map((item: any) =>
        `• ${item.name}${item.size ? ` (${item.size})` : ''} x${item.quantity} - R$ ${(item.price * item.quantity).toFixed(2)}`
      ).join('\n');

      const message = `
🛍️ *NOVO PEDIDO: #${newOrder.id}*

👤 *Cliente:* ${newOrder.cliente_nome}
📞 *Telefone:* ${newOrder.telefone}
📍 *Endereço:* ${newOrder.endereco}
💳 *Pagamento:* ${newOrder.pagamento.toUpperCase()}${newOrder.trocoPara ? ` (Troco para ${newOrder.trocoPara})` : ''}

📋 *Itens:*
${itemsList}

🚚 *Taxa de Entrega:* R$ 5,00
💰 *TOTAL: R$ ${newOrder.total.toFixed(2)}*

---
_Pedido recebido via App Marmitaria_
      `;

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID.startsWith('@') || !isNaN(Number(TELEGRAM_CHAT_ID)) ? TELEGRAM_CHAT_ID : `@${TELEGRAM_CHAT_ID}`,
          text: message,
          parse_mode: 'Markdown'
        })
      });
      console.log("Notificação enviada ao Telegram");
    } catch (err) {
      console.error("Erro ao enviar notificação para o Telegram:", err);
    }

    // Optional: Simulate webhook to n8n
    if (process.env.N8N_WEBHOOK_URL) {
      try {
        await fetch(process.env.N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newOrder)
        });
      } catch (err) {
        console.error("Failed to trigger webhook", err);
      }
    }

    res.status(201).json(newOrder);
  });

  // 5. Update order status (Admin)
  app.put("/api/orders/:id/status", (req, res) => {
    const order = db.orders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    
    order.status = req.body.status;
    // Logica de notificar cliente via bot poderia ir aqui tbm, 
    // disparando webhook pro bot do telegram
    res.json(order);
  });

  // --- Vite / Frontend Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
