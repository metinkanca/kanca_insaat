require('dotenv').config();
const express = require('express');
const path = require('path');
const payments = require('./routes/payments');

const app = express();
app.use(express.json());
app.use('/api/payments', payments);

// Serve a minimal mock checkout page for UI testing
app.get('/mock-checkout', (req, res) => {
  const orderId = req.query.orderId || 'mock';
  res.send(`
    <html>
      <body style="font-family: sans-serif; padding: 40px;">
        <h1>Mock Payment Page</h1>
        <p>Order ID: ${orderId}</p>
        <p>This simulates a PSP page. Click below to "complete" payment.</p>
        <form method="GET" action="${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout-success">
          <input type="hidden" name="orderId" value="${orderId}" />
          <button type="submit">Complete Payment (mock)</button>
        </form>
      </body>
    </html>
  `);
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Payments mock server listening on ${port}`));
