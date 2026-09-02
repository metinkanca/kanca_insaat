import { useLocation, Link } from 'react-router-dom';

export default function CheckoutSuccess() {
  const q = new URLSearchParams(useLocation().search);
  const orderId = q.get('orderId') || 'mock';
  return (
    <div className="cart-page">
      <div className="page-title">
        <p>Sipariş alındı</p>
      </div>
      <div className="cart-shell cart-success-shell">
        <p>Teşekkürler. Sipariş numaranız:</p>
        <h2>{orderId}</h2>
        <p>Bu ekran yalnızca arayüz testi için mock akışla çalışır.</p>
        <Link to="/" className="cart-link">Alışverişe dön</Link>
      </div>
    </div>
  );
}
