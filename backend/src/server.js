process.on('uncaughtException', (err) => {
  console.error('CRASH uncaughtException:', err.stack || err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('CRASH unhandledRejection:', err);
  process.exit(1);
});

console.log('BOOTING SERVER...');

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const config = require('./config');
console.log("Loaded config");

const logger = require('./utils/logger');
console.log("Loaded logger");

const apiLimiter = require('./middleware/rateLimiter');
console.log("Loaded rateLimiter");

const errorHandler = require('./middleware/errorHandler');
console.log("Loaded errorHandler");

const authRoutes = require('./routes/auth');
console.log("Loaded auth route");

const userRoutes = require('./routes/users');
console.log("Loaded user route");

const roleRoutes = require('./routes/roles');
const permissionRoutes = require('./routes/permissions');
const webhooksRoutes = require('./routes/webhooks');
const licenseRoutes = require('./routes/license');
const uploadRoutes = require('./routes/uploads');
const mailRoutes = require('./routes/mailbox');
const komerzaRoutes = require('./routes/komerza');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const reviewsRoutes = require('./routes/reviews');
const affiliatesRoutes = require('./routes/affiliates');
const analyticsRoutes = require('./routes/analytics');
const partnersRoutes = require('./routes/partners');

const prisma = require('./database/prismaClient');
console.log("Loaded prisma");

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com', 'https://unpkg.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'https:', 'data:'],
      connectSrc: ["'self'", 'https:'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'self'"],
    }
  }
}));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('combined'));
app.use(apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/license-keys', licenseRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/mailbox', mailRoutes);
app.use('/api/komerza', komerzaRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/affiliates', affiliatesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/partners', partnersRoutes);

const frontendDir = path.resolve(__dirname, '..', '..');
logger.info(`Serving frontend static files from ${frontendDir}`);
console.log(`DEBUG: Frontend static files are being served from ${frontendDir}`);
app.use(express.static(frontendDir));

app.get('/_health', async (req, res) => {
  try {
    // simple db ping
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'db unreachable' });
  }
});

app.get('*', (req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api/') || req.path === '/_health') {
    return next();
  }
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// global error handler
app.use(errorHandler);

const port = config.port;
console.log('Startup debug:');
console.log('cwd:', process.cwd());
console.log('__dirname:', __dirname);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});

module.exports = app;

