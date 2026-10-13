import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

// Configuration & paths
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'products.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const ASSETS_DIR = path.join(__dirname, 'assets');

// Ensure data and upload directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Credentials
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'GantiPasswordKuat-2026!';
// Hash from config.php: $2y$12$.g905I9OJEf1TdIuhFeX6.6G0aX9Kg3WIGzwYxZTfvdDAqZtN2BGm
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2y$12$.g905I9OJEf1TdIuhFeX6.6G0aX9Kg3WIGzwYxZTfvdDAqZtN2BGm';

// Session token store (in-memory)
const activeSessions = new Set<string>();

// Middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets and uploads
app.use('/assets', express.static(ASSETS_DIR));
app.use('/uploads', express.static(UPLOAD_DIR));

// File upload setup
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const randomName = crypto.randomBytes(12).toString('hex') + ext;
    cb(null, randomName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Gunakan gambar JPG, PNG, atau WEBP.'));
    }
  },
});

// Helper for products read/write
function readProducts(): any[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    console.error('Error reading products.json:', err);
  }
  return [];
}

function writeProducts(products: any[]): boolean {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing products.json:', err);
    return false;
  }
}

// Authentication middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.kaoscustom_session || req.headers.authorization?.replace('Bearer ', '');
  if (token && activeSessions.has(token)) {
    return next();
  }
  return res.status(401).json({ error: 'Sesi tidak valid atau telah berakhir. Silakan masuk kembali.' });
}

// Auth routes
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi.' });
  }

  const isUsernameMatch = username === ADMIN_USERNAME;
  let isPasswordMatch = password === ADMIN_PASSWORD;

  if (!isPasswordMatch) {
    try {
      // Support PHP $2y$ blowfish hash by converting prefix to $2a$ if needed
      const standardHash = ADMIN_PASSWORD_HASH.replace(/^\$2y\$/, '$2a$');
      isPasswordMatch = bcrypt.compareSync(password, standardHash);
    } catch {
      isPasswordMatch = false;
    }
  }

  if (isUsernameMatch && isPasswordMatch) {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    activeSessions.add(sessionToken);

    res.cookie('kaoscustom_session', sessionToken, {
      httpOnly: true,
      secure: false, // AI studio dev environment
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true, token: sessionToken, username: ADMIN_USERNAME });
  }

  return res.status(401).json({ error: 'Username atau password salah.' });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const token = req.cookies?.kaoscustom_session;
  if (token) {
    activeSessions.delete(token);
  }
  res.clearCookie('kaoscustom_session');
  return res.json({ success: true });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const token = req.cookies?.kaoscustom_session || req.headers.authorization?.replace('Bearer ', '');
  if (token && activeSessions.has(token)) {
    return res.json({ authenticated: true, username: ADMIN_USERNAME });
  }
  return res.json({ authenticated: false });
});

// Upload route
app.post('/api/upload', requireAuth, upload.single('image_file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Tidak ada file yang diunggah.' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  return res.json({ url: fileUrl });
});

// Products routes
app.get('/api/products', (req: Request, res: Response) => {
  const q = ((req.query.q as string) || '').trim().toLowerCase();
  const cat = ((req.query.kategori as string) || '').trim();

  let products = readProducts();

  // Sort by created_at descending (latest first, like original index.php)
  products.sort((a, b) => (Number(b.created_at) || 0) - (Number(a.created_at) || 0));

  if (q || cat) {
    products = products.filter((p) => {
      const searchStr = `${p.name || ''} ${p.description || ''}`.toLowerCase();
      const matchQ = !q || searchStr.includes(q);
      const matchCat = !cat || (p.category || '') === cat;
      return matchQ && matchCat;
    });
  }

  return res.json(products);
});

app.post('/api/products', requireAuth, (req: Request, res: Response) => {
  const { name, buy_url, category, price, description, badge, image, alt } = req.body;

  if (!name || !buy_url) {
    return res.status(400).json({ error: 'Nama wajib diisi dan link pembelian harus URL yang valid.' });
  }

  const products = readProducts();
  const newProduct = {
    id: 'prod-' + crypto.randomBytes(4).toString('hex'),
    name: name.trim(),
    buy_url: buy_url.trim(),
    category: (category || 'Kaos Custom').trim(),
    price: (price || '').trim(),
    description: (description || '').trim(),
    badge: (badge || '').trim(),
    image: (image || '').trim(),
    alt: (alt || name).trim(),
    created_at: Math.floor(Date.now() / 1000),
  };

  products.unshift(newProduct);
  if (writeProducts(products)) {
    return res.json({ success: true, product: newProduct });
  }
  return res.status(500).json({ error: 'Gagal menyimpan data.' });
});

app.put('/api/products/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, buy_url, category, price, description, badge, image, alt } = req.body;

  if (!name || !buy_url) {
    return res.status(400).json({ error: 'Nama dan link pembelian wajib diisi.' });
  }

  const products = readProducts();
  const index = products.findIndex((p) => String(p.id) === String(id));

  if (index === -1) {
    return res.status(404).json({ error: 'Produk tidak ditemukan.' });
  }

  const existing = products[index];
  const updatedProduct = {
    ...existing,
    name: name.trim(),
    buy_url: buy_url.trim(),
    category: (category || existing.category || 'Kaos Custom').trim(),
    price: (price !== undefined ? price : existing.price || '').trim(),
    description: (description !== undefined ? description : existing.description || '').trim(),
    badge: (badge !== undefined ? badge : existing.badge || '').trim(),
    image: (image || existing.image || '').trim(),
    alt: (alt || existing.alt || name).trim(),
  };

  products[index] = updatedProduct;
  if (writeProducts(products)) {
    return res.json({ success: true, product: updatedProduct });
  }
  return res.status(500).json({ error: 'Gagal memperbarui data.' });
});

app.delete('/api/products/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  let products = readProducts();
  const initialLen = products.length;
  products = products.filter((p) => String(p.id) !== String(id));

  if (products.length === initialLen) {
    return res.status(404).json({ error: 'Produk tidak ditemukan.' });
  }

  if (writeProducts(products)) {
    return res.json({ success: true });
  }
  return res.status(500).json({ error: 'Gagal menghapus produk.' });
});

// Vite or static serving
async function setupServer() {
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.join(__dirname, 'dist'))) {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, HOST, () => {
    console.log(`Kaos Custom server running on http://${HOST}:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
