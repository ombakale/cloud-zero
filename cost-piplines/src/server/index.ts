import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.ts';
import awsRoutes from './routes/aws.ts';
import azureRoutes from './routes/azure.ts';
import connectRoutes from './routes/connect.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root and cost-dashboard
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../cost-dashboard/.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Mount routers
app.use('/api/connect', connectRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/aws', awsRoutes);
app.use('/api/azure', azureRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Talk to an Expert / Consultation Request endpoint
app.post('/api/expert-request', (req, res) => {
  try {
    const { name, email, company, spend, provider, message } = req.body;
    console.log('📬 [EXPERT CONSULTATION REQUEST RECEIVED]:', {
      name,
      email,
      company,
      spend,
      provider,
      message,
      submittedAt: new Date().toISOString(),
    });

    // Optionally record to data/consultations.json if needed
    const dataDir = path.resolve(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const consultationsFile = path.join(dataDir, 'consultations.json');
    let list = [];
    if (fs.existsSync(consultationsFile)) {
      try {
        list = JSON.parse(fs.readFileSync(consultationsFile, 'utf8'));
      } catch {}
    }
    list.push({
      id: `req-${Date.now()}`,
      name,
      email,
      company,
      spend,
      provider,
      message,
      createdAt: new Date().toISOString(),
    });
    fs.writeFileSync(consultationsFile, JSON.stringify(list, null, 2), 'utf8');

    res.json({
      success: true,
      message: 'Consultation request received successfully. Our FinOps expert will reach out within 24 hours.',
    });
  } catch (err: any) {
    console.error('Error recording expert request:', err);
    res.status(500).json({ success: false, message: 'Failed to submit request.' });
  }
});

// Serve frontend static build if dist exists (Production VM deployment)
const distPath = path.resolve(__dirname, '../../cost-dashboard/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // Client-side SPA routing fallback for non-API GET requests (Express 5 compatible)
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// Helper to resolve certificate path safely
function resolveCertPath(certPath: string): string | null {
  if (!certPath) return null;
  if (path.isAbsolute(certPath) && fs.existsSync(certPath)) return certPath;
  const fromCwd = path.resolve(process.cwd(), certPath);
  if (fs.existsSync(fromCwd)) return fromCwd;
  const fromRoot = path.resolve(__dirname, '../../', certPath);
  if (fs.existsSync(fromRoot)) return fromRoot;
  const fromDir = path.resolve(__dirname, certPath);
  if (fs.existsSync(fromDir)) return fromDir;
  return null;
}

// Server startup: HTTPS (if SSL_PFX_PATH is configured) + HTTP fallback
const SSL_PFX_PATH = process.env.SSL_PFX_PATH;
const SSL_PASSPHRASE = process.env.SSL_PASSPHRASE;
const HTTPS_PORT = Number(process.env.HTTPS_PORT || 443);

const resolvedPfx = SSL_PFX_PATH ? resolveCertPath(SSL_PFX_PATH) : null;

if (resolvedPfx) {
  try {
    const pfxBuffer = fs.readFileSync(resolvedPfx);
    const httpsOptions: https.ServerOptions = {
      pfx: pfxBuffer,
      passphrase: SSL_PASSPHRASE || undefined,
    };

    https.createServer(httpsOptions, app).listen(HTTPS_PORT, () => {
      console.log(`🔒 [HTTPS] Cost Intelligence Dashboard listening on https://localhost:${HTTPS_PORT}`);
    });

    http.createServer(app).listen(PORT, () => {
      console.log(`🚀 [HTTP] Cost Intelligence API listening on http://localhost:${PORT}`);
    });
  } catch (sslErr: any) {
    console.error('❌ [HTTPS] Failed to initialize SSL PFX certificate:', sslErr.message);
    console.warn('⚠️ Falling back to standard HTTP on port', PORT);
    app.listen(PORT, () => {
      console.log(`🚀 Cost Intelligence API listening on http://localhost:${PORT}`);
    });
  }
} else {
  if (SSL_PFX_PATH) {
    console.warn(`⚠️ [HTTPS] SSL_PFX_PATH specified (${SSL_PFX_PATH}) but certificate file was not found.`);
  }
  app.listen(PORT, () => {
    console.log(`🚀 Cost Intelligence API listening on http://localhost:${PORT}`);
  });
}

export default app;
