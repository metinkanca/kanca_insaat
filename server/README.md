Payments mock server
====================

Quick start (UI testing):

1. Install dependencies and run the server

```bash
cd server
npm init -y
npm i express uuid dotenv
node index.js
```

2. Start the frontend Vite dev server in the project root (e.g. `npm run dev`).

3. Use the app: add items to cart, go to `/cart`, proceed to `/checkout`. The checkout will POST to the mock server, which serves a mock PSP page at `/mock-checkout` and returns to `/checkout-success` on completion.

Notes:
- This is a mock server for UI testing only. Replace `server/routes/payments.js` contents with real iyzico integration when you have sandbox keys.
- Keep merchant secrets out of the frontend. Use environment variables on the server for real keys.
