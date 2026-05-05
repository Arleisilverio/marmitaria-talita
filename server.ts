import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Rota de Telegram (A única que continua no servidor Node por enquanto)
  app.post("/api/orders", async (req, res) => {
    const newOrder = req.body;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.warn("⚠️ Telegram Bot Token não configurado. Pedido recebido no banco, mas não enviado ao Telegram.");
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