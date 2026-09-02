export async function createPayment(payload: any) {
  // Mock payment flow (no backend required for UI testing)
  // To use a real backend, set VITE_API_URL env var
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (apiUrl) {
    // Real backend mode
    const res = await fetch(`${apiUrl}/api/payments/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('createPayment failed');
    return res.json();
  }
  
  // Mock mode: return a local order ID
  await new Promise(r => setTimeout(r, 800)); // simulate network latency
  const orderId = 'ORD-' + Date.now();
  return {
    orderId,
    checkoutUrl: null,
  };
}
