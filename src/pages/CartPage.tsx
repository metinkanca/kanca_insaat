import { useCart } from '../contexts/CartContext';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { unitText } from '../units';

export default function CartPage() {
  const { items, updateQty, removeItem, total, clearCart } = useCart();
  const count = items.reduce((s, it) => s + it.qty, 0);

  // Stepping below 1 removes the item, but confirm first so it isn't lost
  // to a stray click.
  const decrement = (id: string, name: string, qty: number) => {
    if (qty <= 1) {
      if (window.confirm(`"${name}" ürününü sepetten kaldırmak istiyor musunuz?`)) {
        removeItem(id);
      }
      return;
    }
    updateQty(id, qty - 1);
  };

  return (
    <div className="cart-page">
      <div className="page-title"><p>Sepet</p></div>

      {items.length === 0 ? (
        <div className="cart-empty">
          <div className="cart-empty-icon">🛒</div>
          <p className="cart-empty-text">Sepetiniz henüz boş.</p>
          <Link to="/products" className="cart-action-btn">Ürünlere göz at</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            {items.map(it => (
              <div className="cart-item" key={it.id}>
                <div className="cart-item-image">
                  {it.image
                    ? <img src={it.image} alt={it.name} loading="lazy" />
                    : <div className="cart-item-placeholder" />}
                </div>

                <div className="cart-item-info">
                  <p className="cart-item-name">{it.name}</p>
                  <p className="cart-item-unit">{it.price.toLocaleString('tr-TR')} ₺ / {unitText(it.unit)}</p>
                </div>

                <div className="cart-item-controls">
                  <div className="cart-qty">
                    <button
                      type="button"
                      aria-label="Azalt"
                      onClick={() => decrement(it.id, it.name, it.qty)}
                    >
                      <Minus size={15} />
                    </button>
                    <input
                      type="number"
                      value={it.qty}
                      min={1}
                      onChange={e => updateQty(it.id, Math.max(1, Number(e.target.value)))}
                    />
                    <button
                      type="button"
                      aria-label="Artır"
                      onClick={() => updateQty(it.id, it.qty + 1)}
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  <p className="cart-item-subtotal">{(it.price * it.qty).toLocaleString('tr-TR')} ₺</p>

                  <button
                    className="cart-remove-btn"
                    onClick={() => removeItem(it.id)}
                    aria-label="Ürünü kaldır"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <aside className="cart-summary">
            <h2 className="cart-summary-title">Sipariş Özeti</h2>
            <div className="cart-summary-row">
              <span>Ürünler ({count})</span>
              <span>{total().toLocaleString('tr-TR')} ₺</span>
            </div>
            <div className="cart-summary-row cart-summary-total">
              <span>Toplam</span>
              <strong>{total().toLocaleString('tr-TR')} ₺</strong>
            </div>
            <Link to="/checkout" className="cart-action-btn cart-checkout-btn">Ödemeye geç</Link>
            <button className="cart-secondary-btn" onClick={() => clearCart()}>Sepeti temizle</button>
            <Link to="/products" className="cart-continue-link">← Alışverişe devam et</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
