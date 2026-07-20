const logger = require('../utils/logger');

// In test environment use an in-memory store so tests can assert messages
const _store = [];

function _isTest() {
  return process.env.NODE_ENV === 'test';
}

async function _sendViaStub({ to, subject, text, html }) {
  const msg = { to, subject, text, html, ts: new Date().toISOString() };
  _store.push(msg);
  logger.info(`(stub) queued email to ${to} subject=${subject}`);
  return msg;
}

async function _createTransport() {
  // Lazy require nodemailer to avoid failing when package not installed for some environments
  const nodemailer = require('nodemailer');
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) {
    logger.warn('SMTP not fully configured; nodemailer will attempt default transport');
  }
  const transporter = nodemailer.createTransport({ host, port, auth: { user, pass }, secure: port === 465 });
  return transporter;
}

async function sendMail({ to, subject, text, html, from }) {
  if (_isTest()) return _sendViaStub({ to, subject, text, html });
  const transporter = await _createTransport();
  const fromAddr = from || process.env.MAIL_FROM || `no-reply@${process.env.DOMAIN || 'example.local'}`;
  const info = await transporter.sendMail({ from: fromAddr, to, subject, text, html });
  logger.info(`Sent mail to ${to} messageId=${info.messageId || '<unknown>'}`);
  return info;
}

async function sendVerificationEmail(user, token) {
  const verifyUrl = `${process.env.FRONTEND_URL || ''}/verify?token=${encodeURIComponent(token)}`;
  const subject = 'Verify your account';
  const text = `Please verify your account by visiting ${verifyUrl}`;
  const html = `<p>Please verify your account by visiting <a href="${verifyUrl}">${verifyUrl}</a></p>`;
  return sendMail({ to: user.email, subject, text, html });
}

async function sendPasswordResetEmail(user, token) {
  const resetUrl = `${process.env.FRONTEND_URL || ''}/reset-password?token=${encodeURIComponent(token)}`;
  const subject = 'Password reset';
  const text = `Reset your password: ${resetUrl}`;
  const html = `<p>Reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`;
  return sendMail({ to: user.email, subject, text, html });
}

// test helpers
function _getSent() { return _store.slice(); }
function _clearSent() { _store.length = 0; }

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendMail, _getSent, _clearSent };
