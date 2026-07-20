const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const config = require('./config');
const logger = require('./utils/logger');
const apiLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');
const permissionRoutes = require('./routes/permissions');
const webhooksRoutes = require('./routes/webhooks');
const licenseRoutes = require('./routes/license');
const uploadRoutes = require('./routes/uploads');
const mailRoutes = require('./routes/mailbox');
const prisma = require('./database/prismaClient');
const productsRoutes = require('./routes/products');

const app = express();

app.use(helmet());
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
app.use('/api/products', productsRoutes);

app.get('/_health', async (req, res) => {
  try {
    // simple db ping
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'db unreachable' });
  }
});

// global error handler
app.use(errorHandler);

const port = config.port;
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
  });
}

module.exports = app;
