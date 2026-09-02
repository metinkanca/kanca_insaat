import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../contexts/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { useDealer } from '../dealer/DealerContext';

const money = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { dealer } = useDealer();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState({ name: '', phone: '' });

  useEffect(() => {
    if (dealer) {
      setCustomer({ name: dealer.companyName, phone: dealer.phone });
    }
  }, [dealer?.uid]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);
    try {
      const orderData: Record<string, any> = {
        customerName: customer.name,
        // No longer asked for at checkout, but the orders security rule
        // requires the key — a signed-in dealer's address still comes through.
        email: dealer?.email ?? '',
        phone: customer.phone,
        total: total(),
        currency: 'TRY',
        status: 'pending',
        createdAt: serverTimestamp(),
        items: items.map(i => ({
          id: i.id,
          name: i.name,
          price: i.price,
          qty: i.qty,
          image: i.image ?? '',
        })),
      };
      if (dealer) {
        orderData.dealerId = dealer.uid;
        orderData.dealerName = dealer.companyName;
      }
      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      clearCart();
      navigate('/checkout-success?orderId=' + orderRef.id);
    } catch (err) {
      console.error(err);
      alert('Sipariş oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="page-title"><p>Ödeme</p></div>
        <div className="cart-empty">
          <div className="cart-empty-icon">🛒</div>
          <p className="cart-empty-text">Sepetiniz boş olduğu için ödeme adımına geçilemiyor.</p>
          <Link to="/products" className="cart-action-btn">Ürünlere göz at</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="page-title"><p>Ödeme</p></div>

      <form className="checkout-layout" onSubmit={submit}>
        <section className="checkout-panel">
          <h2 className="checkout-panel-title">İletişim Bilgileri</h2>
          <p className="checkout-panel-hint">
            Siparişinizi onaylamak ve teslimat detaylarını netleştirmek için sizi telefonla arayacağız.
          </p>

          <div className="checkout-grid">
            <label className="checkout-field">
              <span className="checkout-field-label">Ad Soyad</span>
              <input
                required
                value={customer.name}
                onChange={e => setCustomer({ ...customer, name: e.target.value })}
                placeholder="Adınız ve soyadınız"
                autoComplete="name"
              />
            </label>
            <label className="checkout-field">
              <span className="checkout-field-label">Telefon</span>
              <input
                required
                type="tel"
                value={customer.phone}
                onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                placeholder="0532 000 00 00"
                autoComplete="tel"
              />
            </label>
          </div>

          {dealer && (
            <p className="checkout-dealer-note">
              <strong>{dealer.companyName}</strong> bayi hesabıyla sipariş veriyorsunuz.
            </p>
          )}
        </section>

        <aside className="cart-summary checkout-summary">
          <h2 className="cart-summary-title">Sipariş Özeti</h2>

          <div className="checkout-items">
            {items.map(it => (
              <div className="checkout-item" key={it.id}>
                <div className="checkout-item-image">
                  {it.image
                    ? <img src={it.image} alt={it.name} loading="lazy" />
                    : <div className="cart-item-placeholder" />}
                </div>
                <div className="checkout-item-info">
                  <span className="checkout-item-name">{it.name}</span>
                  <span className="checkout-item-qty">{it.qty} × {money(it.price)} ₺</span>
                </div>
                <span className="checkout-item-total">{money(it.price * it.qty)} ₺</span>
              </div>
            ))}
          </div>

          <div className="cart-summary-row cart-summary-total">
            <span>Toplam</span>
            <strong>{money(total())} ₺</strong>
          </div>

          <button className="cart-action-btn cart-checkout-btn" type="submit" disabled={loading}>
            {loading ? 'İşleniyor...' : 'Siparişi Tamamla'}
          </button>
          <Link to="/cart" className="cart-secondary-btn">Sepete Dön</Link>
        </aside>
      </form>
    </div>
  );
}
