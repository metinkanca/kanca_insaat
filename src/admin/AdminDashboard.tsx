import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { seedDatabase } from './seedData';

export default function AdminDashboard() {
  const [productCount, setProductCount] = useState<number | null>(null);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [seedLog, setSeedLog] = useState<string[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [seedDone, setSeedDone] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [products, orders] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'orders')),
      ]);
      setProductCount(products.size);
      setOrderCount(orders.size);
      setIsEmpty(products.empty);
    };
    load();
  }, [seedDone]);

  const runSeed = async () => {
    setSeeding(true);
    setSeedLog([]);
    try {
      await seedDatabase(msg => setSeedLog(prev => [...prev, msg]));
      setSeedDone(true);
    } catch (err: any) {
      setSeedLog(prev => [...prev, 'Hata: ' + err.message]);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="admin-page">
      <h2 className="admin-page-title">Genel Bakış</h2>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <p className="admin-stat-label">Toplam Ürün</p>
          <p className="admin-stat-value">{productCount ?? '...'}</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">Toplam Sipariş</p>
          <p className="admin-stat-value">{orderCount ?? '...'}</p>
        </div>
      </div>

      {isEmpty && !seedDone && (
        <div className="admin-seed-box">
          <h3>Veritabanı Boş</h3>
          <p>Firebase'e ilk veri yüklemesi yapılmamış. Mevcut ürün kataloğunu Firestore'a aktarmak için aşağıdaki butona tıklayın.</p>
          <button className="admin-btn admin-btn-primary" onClick={runSeed} disabled={seeding}>
            {seeding ? 'Yükleniyor...' : 'Veritabanını Başlat'}
          </button>
          {seedLog.length > 0 && (
            <div className="admin-seed-log">
              {seedLog.map((line, i) => <p key={i}>{line}</p>)}
            </div>
          )}
        </div>
      )}

      {seedDone && (
        <div className="admin-seed-box admin-seed-success">
          <p>Seed tamamlandı! Ürünler Firestore'a aktarıldı.</p>
        </div>
      )}
    </div>
  );
}
