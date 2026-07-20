const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  refreshSecret: process.env.REFRESH_SECRET,
  accessExpiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN || 900),
  refreshExpiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN || 2592000),
  komerzaApiKey: process.env.KOMERZA_API_KEY,
  komerzaWebhookSecret: process.env.KOMERZA_WEBHOOK_SECRET,
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackUrl: process.env.DISCORD_CALLBACK_URL
  }
};
