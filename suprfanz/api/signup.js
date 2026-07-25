import { createClient } from '@vercel/kv';
import CryptoJS from 'crypto-js';

const kv = createClient({
  url: process.env.KV_REST_API_URL || process.env.VERCEL_KV_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.VERCEL_KV_TOKEN
});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end(null, CORS_HEADERS);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' }, CORS_HEADERS);
  }

  try {
    const {
      name,
      email,
      eventUrl,
      targetLocation,
      eventDate,
      fbEmail,
      fbPassword,
      consentLogin,
      consentAccess
    } = req.body || {};

    // Validation
    if (!name || !email || !eventUrl || !targetLocation || !eventDate || !fbEmail || !fbPassword) {
      return res.status(400).json({ error: 'All fields are required.' }, CORS_HEADERS);
    }

    if (!consentLogin || !consentAccess) {
      return res.status(400).json({ error: 'Both consent checkboxes are required.' }, CORS_HEADERS);
    }

    // Simple email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' }, CORS_HEADERS);
    }

    // Facebook event URL validation (basic)
    if (!eventUrl.includes('facebook.com/events/')) {
      return res.status(400).json({ error: 'Please provide a valid Facebook event URL.' }, CORS_HEADERS);
    }

    const signupId = `signup:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const timestamp = new Date().toISOString();

    // Encrypt password
    const encryptionKey = process.env.SUPRFANZ_ENCRYPTION_KEY;
    if (!encryptionKey) {
      return res.status(500).json({ error: 'Encryption key not configured.' }, CORS_HEADERS);
    }
    const encryptedPassword = CryptoJS.AES.encrypt(fbPassword, encryptionKey).toString();

    const record = {
      signupId,
      timestamp,
      name,
      email,
      eventUrl,
      targetLocation,
      eventDate,
      fbEmail,
      fbPasswordEncrypted: encryptedPassword,
      consentLogin,
      consentAccess,
      status: 'pending'
    };

    // Store in Vercel KV
    await kv.set(signupId, JSON.stringify(record));

    return res.status(200).json(
      {
        success: true,
        message: 'Signup received. Check your email for confirmation.',
        signupId
      },
      CORS_HEADERS
    );
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' }, CORS_HEADERS);
  }
}
