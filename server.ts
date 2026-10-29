import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Endpoint 1: Smart Import from SMS/Email/Statement text or screenshot
app.post('/api/gemini/smart-import', async (req, res) => {
  try {
    const { text, image } = req.body;
    if (!text && !image) {
      return res.status(400).json({ error: 'Text or image is required.' });
    }

    if (!ai) {
      return res.status(503).json({ error: 'Gemini API key not configured on server.' });
    }

    const contents: any[] = [];

    if (image) {
      contents.push({
        inlineData: {
          mimeType: 'image/png',
          data: image,
        },
      });
    }

    const promptText = `
You are a financial receipt parser for SubTrack. Analyze this subscription receipt, SMS, statement line, or screenshot:
"""
${text || ''}
"""
Extract the subscription details in JSON according to this schema:
- name: string (e.g. "Netflix", "Spotify", "Amazon Prime")
- category: one of ["Entertainment", "Music", "Productivity", "Education", "Shopping", "Fitness", "Software", "Other"]
- price: number (numerical amount only, e.g. 649, 119)
- currency: ISO 4217 code (e.g. "INR", "USD", "EUR", "GBP", "JPY")
- billingCycle: one of ["Weekly", "Monthly", "Quarterly", "Yearly"]
- nextRenewalDate: optional ISO YYYY-MM-DD string if identifiable
- isFreeTrial: boolean (true if free trial mentioned)
- notes: optional short note summarizing provider details or debit card mentioned
`;

    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            category: { type: Type.STRING },
            price: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            billingCycle: { type: Type.STRING },
            nextRenewalDate: { type: Type.STRING },
            isFreeTrial: { type: Type.BOOLEAN },
            notes: { type: Type.STRING },
          },
          required: ['name', 'category', 'price', 'currency', 'billingCycle'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ data: parsed });
  } catch (err: any) {
    console.error('Error in /api/gemini/smart-import:', err);
    return res.status(500).json({ error: err?.message || 'Failed to process receipt.' });
  }
});

// Endpoint 2: Specific cancellation guide generator
app.post('/api/gemini/cancellation-guide', async (req, res) => {
  try {
    const { providerName, cancellationUrl } = req.body;
    if (!providerName) {
      return res.status(400).json({ error: 'Provider name is required.' });
    }

    if (!ai) {
      return res.status(503).json({ error: 'Gemini API key not configured on server.' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Generate a practical, step-by-step cancellation guide for "${providerName}".
URL if available: "${cancellationUrl || ''}".
Include:
1. Exact steps to reach Account/Billing and confirm cancellation.
2. Common retention tricks the merchant uses (e.g. discount offers, "pause instead").
3. What proof to capture (screenshot, confirmation email).
4. Tip on checking and revoking recurring UPI AutoPay / bank e-mandates if applicable.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            providerId: { type: Type.STRING },
            providerName: { type: Type.STRING },
            directUrl: { type: Type.STRING },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            retentionTricks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            proofTip: { type: Type.STRING },
            upiAutoPayTip: { type: Type.STRING },
          },
          required: ['providerName', 'steps', 'retentionTricks', 'proofTip'],
        },
      },
    });

    const guide = JSON.parse(response.text || '{}');
    return res.json({ guide });
  } catch (err: any) {
    console.error('Error in /api/gemini/cancellation-guide:', err);
    return res.status(500).json({ error: err?.message || 'Failed to generate guide.' });
  }
});

// Mount Vite or serve static files
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
    app.listen(port, '0.0.0.0', () => {
      console.log(`SubTrack server running on http://0.0.0.0:${port}`);
    });
  } else {
    const http = await import('http');
    const httpServer = http.createServer(app);

    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    httpServer.listen(port, '0.0.0.0', () => {
      console.log(`SubTrack server running on http://0.0.0.0:${port}`);
    });
  }
}

startServer();
