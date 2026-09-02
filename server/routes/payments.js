const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const orders = {}; // in-memory store for UI testing

router.post('/create', (req, res) => {
  const { customer, items, total, currency } = req.body;
  if (!customer || !items) return res.status(400).json({ error: 'missing fields' });

  const orderId = uuidv4();
  orders[orderId] = { id: orderId, customer, items, total, currency: currency || 'TRY', status: 'created', createdAt: Date.now() };

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const checkoutUrl = `${process.env.SERVER_URL || 'http://localhost:5000'}/mock-checkout?orderId=${orderId}`;

  res.json({ orderId, checkoutUrl, frontendRedirect: `${frontendUrl}/checkout-success?orderId=${orderId}` });
});

module.exports = router;
