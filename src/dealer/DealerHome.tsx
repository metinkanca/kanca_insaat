import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useDealer } from './DealerContext';

export default function DealerHome() {
  const { dealer } = useDealer();
  const [pendingQuotes, setPendingQuotes] = useState(0);
  const [openOrders, setOpenOrders] = useState(0);

  useEffect(() => {
    if (!dealer) return;
    getDocs(query(collection(db, 'quoteRequests'), where('dealerId', '==', dealer.uid), where('status', '==', 'pending')))
      .then(s => setPendingQuotes(s.size));
    getDocs(query(collection(db, 'orders'), where('dealerId', '==', dealer.uid), where('status', '==', 'pending')))
      .then(s => setOpenOrders(s.size));
  }, [dealer]);

  return (
    <div className="dealer-page">
      <div className="dealer-page-header">
        <h2 className="dealer-page-title">Hoş Geldiniz</h2>
        <p className="dealer-page-subtitle">{dealer?.companyName}</p>
      </div>

      <div className="dealer-stats">
        <div className="dealer-stat-card">
          <span className="dealer-stat-value">{openOrders}</span>
          <span className="dealer-stat-label">Bekleyen Sipariş</span>
        </div>
        <div className="dealer-stat-card">
          <span className="dealer-stat-value">{pendingQuotes}</span>
          <span className="dealer-stat-label">Bekleyen Teklif</span>
        </div>
      </div>

      <div className="dealer-quick-links">
        <Link to="/products" className="dealer-quick-card">
          <span className="dealer-quick-icon">📦</span>
          <span className="dealer-quick-label">Ürünler</span>
          <span className="dealer-quick-desc">Tüm ürünleri inceleyin</span>
        </Link>
        <Link to="/bayi/teklifler" className="dealer-quick-card">
          <span className="dealer-quick-icon">📋</span>
          <span className="dealer-quick-label">Tekliflerim</span>
          <span className="dealer-quick-desc">Teklif oluşturun veya takip edin</span>
        </Link>
        <Link to="/bayi/siparisler" className="dealer-quick-card">
          <span className="dealer-quick-icon">🛒</span>
          <span className="dealer-quick-label">Siparişlerim</span>
          <span className="dealer-quick-desc">Sipariş geçmişiniz</span>
        </Link>
        <Link to="/bayi/cari" className="dealer-quick-card">
          <span className="dealer-quick-icon">💳</span>
          <span className="dealer-quick-label">Cari Hesabım</span>
          <span className="dealer-quick-desc">Bakiye ve hareketler</span>
        </Link>
      </div>
    </div>
  );
}
