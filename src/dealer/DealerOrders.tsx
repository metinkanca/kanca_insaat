import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useDealer } from './DealerContext';
import type { Order } from '../types/firestore';

type OrderWithId = Order & { id: string };

const STATUS_LABELS: Record<string, string> = {
  pending: 'Bekliyor',
  confirmed: 'Onaylandı',
  cancelled: 'İptal',
};

const STATUS_CLASSES: Record<string, string> = {
  pending: 'dealer-badge--warning',
  confirmed: 'dealer-badge--success',
  cancelled: 'dealer-badge--danger',
};

export default function DealerOrders() {
  const { dealer } = useDealer();
  const [orders, setOrders] = useState<OrderWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!dealer) return;
    getDocs(query(
      collection(db, 'orders'),
      where('dealerId', '==', dealer.uid)
    )).then(snap => {
      const result = snap.docs.map(d => ({ id: d.id, ...d.data() } as OrderWithId));
      result.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      setOrders(result);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [dealer]);

  if (loading) return <div className="dealer-page"><p>Yükleniyor...</p></div>;

  return (
    <div className="dealer-page">
      <div className="dealer-page-header">
        <h2 className="dealer-page-title">Siparişlerim</h2>
      </div>

      {orders.length === 0 ? (
        <p className="dealer-empty">Henüz siparişiniz bulunmuyor.</p>
      ) : (
        <div className="dealer-orders-list">
          {orders.map(order => (
            <div key={order.id} className="dealer-order-card">
              <div className="dealer-order-header" onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                <div className="dealer-order-meta">
                  <span className="dealer-order-id">#{order.id.slice(-6).toUpperCase()}</span>
                  <span className="dealer-order-date">
                    {order.createdAt?.toDate?.().toLocaleDateString('tr-TR') ?? '—'}
                  </span>
                </div>
                <div className="dealer-order-summary">
                  <span className={`dealer-badge ${STATUS_CLASSES[order.status] ?? ''}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  <span className="dealer-order-total">
                    {order.total.toLocaleString('tr-TR')} {order.currency}
                  </span>
                  <span className="dealer-order-toggle">{expanded === order.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {expanded === order.id && (
                <div className="dealer-order-items">
                  <table className="dealer-table">
                    <thead>
                      <tr><th>Ürün</th><th>Adet</th><th>Birim Fiyat</th><th>Toplam</th></tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, i) => (
                        <tr key={i}>
                          <td>{item.name}</td>
                          <td>{item.qty}</td>
                          <td>{item.price.toLocaleString('tr-TR')} ₺</td>
                          <td>{(item.price * item.qty).toLocaleString('tr-TR')} ₺</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
