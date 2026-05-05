import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8791437029:AAFIHtfz1gMDStGYJVlBMRmqGWWCYwgtwaE";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "-1002264660946";

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

  // Aumentado o limite para 50mb para suportar fotos tiradas pela câmera do celular
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- API Routes ---
  
  app.get("/api/menu", (req, res) => res.json(db.menu));
  app.put("/api/menu", (req, res) => {
    db.menu = { ...db.menu, ...req.body };
    res.json(db.menu);
  });

  app.get("/api/orders", (req, res) => res.json(db.orders.sort((a, b) => b.createdAt - a.createdAt)));

  app.post("/api/orders", async (req, res) => {
    const orderData = req.body;
    const newOrder = {
      ...orderData,
      createdAt: orderData.created_at ? new Date(orderData.created_at).getTime() : Date.now()
    };
    db.orders.push(newOrder);

    // Enviar para o Telegram
    try {
      const itemsList = newOrder.itens?.map((item: any) =>
        `• ${item.name}${item.size ? ` (${item.size})` : ''} x${item.quantity}`
      ).join('\n') || 'Nenhum item';

      const message = `
🛍️ *NOVO PEDIDO: #${newOrder.id.substring(0, 8).toUpperCase()}*

👤 *Cliente:* ${newOrder.customer_name}
📞 *Telefone:* ${newOrder.customer_phone}
📍 *Endereço:* ${newOrder.delivery_address}
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

    res.status(201).json(newOrder);
  });

  app.put("/api/orders/:id/status", (req, res) => {
    const order = db.orders.find(o => o.id === req.params.id);
    if (order) order.status = req.body.status;
    res.json(order || { error: "Order not found" });
  });

  // --- Vite ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
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