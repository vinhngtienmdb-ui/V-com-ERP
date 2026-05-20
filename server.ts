
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON
  app.use(express.json());

  // API Route: SePay Webhooks
  app.post('/api/sepay-webhook', (req, res) => {
    const signature = req.headers['x-sepay-signature'];
    const payload = req.body;

    console.log('Received SePay Webhook:', payload);

    // TODO: Verify signature using SEPAY_WEBHOOK_SECRET
    // For now, we'll log and acknowledge receipt
    
    // Logic for updating order status in Firestore (would require firebase-admin)
    // Or providing a signal to the client via WebSockets/Long Polling
    
    res.status(200).json({ status: 'success', message: 'Webhook received' });
  });

  // API Route: Proxy for SePay APIs to protect keys
  app.get('/api/sepay/transactions', async (req, res) => {
    try {
      const response = await fetch('https://api.sepay.vn/v1/bank/transactions', {
        headers: {
          'Authorization': `Bearer ${process.env.SEPAY_API_TOKEN}`,
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
