import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const CONFIG_FILE = path.join(__dirname, 'supabase-config.json');

app.use(express.json());

// In-memory / file-based Supabase config cache
function readServerSupabaseConfig() {
  const envUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const envKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  let fileUrl = '';
  let fileKey = '';

  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      fileUrl = parsed.url || '';
      fileKey = parsed.anonKey || '';
    }
  } catch (err) {
    console.error('Error reading supabase-config.json:', err);
  }

  const url = (envUrl || fileUrl || '').trim();
  const anonKey = (envKey || fileKey || '').trim();

  return {
    url,
    anonKey,
    isConfigured: !!(url && anonKey),
  };
}

function writeServerSupabaseConfig(url: string, anonKey: string) {
  const data = {
    url: (url || '').trim(),
    anonKey: (anonKey || '').trim(),
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf-8');
  process.env.VITE_SUPABASE_URL = data.url;
  process.env.VITE_SUPABASE_ANON_KEY = data.anonKey;
  return data;
}

// API Routes
app.get('/api/supabase-config', (_req, res) => {
  const config = readServerSupabaseConfig();
  res.json(config);
});

app.post('/api/supabase-config', (req, res) => {
  const { url, anonKey } = req.body || {};
  const saved = writeServerSupabaseConfig(url || '', anonKey || '');
  res.json({
    success: true,
    url: saved.url,
    anonKey: saved.anonKey,
    isConfigured: !!(saved.url && saved.anonKey),
    message: 'Supabase configuration saved and broadcast to all connected devices.',
  });
});

app.get('/api/health', (_req, res) => {
  const config = readServerSupabaseConfig();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    supabaseConfigured: config.isConfigured,
  });
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Cortexx Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Cortexx Server] failed to start:', err);
  process.exit(1);
});
