import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { Order } from '../types/firestore';

type OrderWithId = Order & { id: string };

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderWithId[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
    setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as OrderWithId)));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, newStatus: Order['status']) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    await updateDoc(doc(db, 'orders', id), { status: newStatus });

    // When a dealer order is confirmed for the first time, create a debt ledger entry
    if (newStatus === 'confirmed' && order.status !== 'confirmed' && order.dealerId) {
      await addDoc(collection(db, 'dealerPayments'), {
        dealerId: order.dealerId,
        dealerName: order.dealerName ?? '',
        description: `Sipariş #${id.slice(-6).toUpperCase()}`,
        debt: order.total,
        credit: 0,
        paymentType: 'Sipariş',
        orderId: id,
        createdAt: serverTimestamp(),
      });
    }

    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  if (loading) return <div className="admin-page"><p>Yükleniyor...</p></div>;

  return (
    <div className="admin-page">
      <h2 className="admin-page-title">Siparişler</h2>
      {orders.length === 0 ? (
        <p className="admin-empty">Henüz sipariş yok.</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sipariş ID</th>
                <th>Müşteri</th>
                <th>E-posta</th>
                <th>Telefon</th>
                <th>Toplam</th>
                <th>Ürünler</th>
                <th>Durum</th>
                <th>Tarih</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td className="admin-mono">
                    {order.id.slice(0, 8)}...
                    {order.dealerId && (
                      <span className="admin-badge admin-badge--warning" style={{ marginLeft: 6 }}>Bayi</span>
                    )}
                  </td>
                  <td>{order.dealerName ? `${order.dealerName}` : order.customerName}</td>
                  <td>{order.email}</td>
                  <td>{order.phone}</td>
                  <td>{order.total.toFixed(2)} TRY</td>
                  <td>
                    <ul className="admin-order-items">
                      {order.items?.map((item, i) => (
                        <li key={i}>{item.name} ×{item.qty}</li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    <select
                      value={order.status}
                      onChange={e => setStatus(order.id, e.target.value as Order['status'])}
                      className={`admin-status-select admin-status-${order.status}`}
                    >
                      <option value="pending">Bekliyor</option>
                      <option value="confirmed">Onaylandı</option>
                      <option value="cancelled">İptal</option>
                    </select>
                  </td>
                  <td className="admin-mono">
                    {order.createdAt?.toDate?.()
                      ? order.createdAt.toDate().toLocaleDateString('tr-TR')
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
