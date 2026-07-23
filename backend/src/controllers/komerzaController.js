const config = require('../config');
const logger = require('../utils/logger');

const fetchImpl = typeof fetch === 'function' ? fetch : require('node-fetch');

function buildHeaders(req) {
  const headers = {
    'User-Agent': 'H4xStore/1.0',
    'Accept': 'application/json'
  };

  if (config.komerzaApiKey) {
    headers.Authorization = `Bearer ${config.komerzaApiKey}`;
  }

  if (req.headers['content-type']) {
    headers['Content-Type'] = req.headers['content-type'];
  }

  return headers;
}

async function proxyRequest(req, res, next) {
  try {
    if (!config.komerzaApiKey) {
      return res.status(503).json({ success: false, error: 'Komerza API key is not configured' });
    }

    const targetPath = req.originalUrl.replace(/^\/api\/komerza/, '');
    const url = `${config.komerzaBase || 'https://api.komerza.com'}${targetPath}`;

    const options = {
      method: req.method,
      headers: buildHeaders(req)
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body && Object.keys(req.body).length > 0) {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetchImpl(url, options);
    const text = await response.text();
    let body = text;
    try { body = JSON.parse(text); } catch (e) { /* ignore non-json response */ }

    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: body?.error || body?.message || 'Komerza proxy request failed', detail: body });
    }

    if (body && typeof body === 'object') {
      return res.json(body);
    }

    res.set('Content-Type', response.headers.get('content-type') || 'text/plain');
    return res.send(text);
  } catch (err) {
    logger.error('Komerza proxy error', err);
    next(err);
  }
}

module.exports = { proxyRequest };
