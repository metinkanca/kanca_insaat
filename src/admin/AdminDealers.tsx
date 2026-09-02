import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import type { Dealer } from '../types/firestore';

type DealerWithId = Dealer & { id: string };
type Tab = 'all' | 'pending' | 'approved' | 'rejected';

const STATUS_LABELS: Record<string, string> = { pending: 'Bekliyor', approved: 'Onaylı', rejected: 'Reddedildi' };
const STATUS_CLASSES: Record<string, string> = {
  pending: 'admin-badge admin-badge--warning',
  approved: 'admin-badge admin-badge--success',
  rejected: 'admin-badge admin-badge--danger',
};

export default function AdminDealers() {
  const [dealers, setDealers] = useState<DealerWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');

  const load = () => {
    setLoading(true);
    getDocs(query(collection(db, 'dealers'), orderBy('createdAt', 'desc')))
      .then(snap => {
        setDealers(snap.docs.map(d => ({ id: d.id, ...d.data() } as DealerWithId)));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: Dealer['status']) => {
    await updateDoc(doc(db, 'dealers', id), { status });
    setDealers(prev => prev.map(d => d.id === id ? { ...d, status } : d));
  };

  const filtered = tab === 'all' ? dealers : dealers.filter(d => d.status === tab);
  const counts = {
    all: dealers.length,
    pending: dealers.filter(d => d.status === 'pending').length,
    approved: dealers.filter(d => d.status === 'approved').length,
    rejected: dealers.filter(d => d.status === 'rejected').length,
  };

  if (loading) return <div className="admin-page"><p>Yükleniyor...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Bayiler</h2>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {(['all', 'pending', 'approved', 'rejected'] as Tab[]).map(t => (
          <button
            key={t}
            className={`admin-tab${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >
            {{ all: 'Tümü', pending: 'Bekleyenler', approved: 'Onaylılar', rejected: 'Reddedilenler' }[t]}
            {counts[t] > 0 && <span className="admin-tab-count">{counts[t]}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: '#888', padding: '24px 0' }}>Bayi bulunamadı.</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Firma</th>
                <th>E-posta</th>
                <th>Telefon</th>
                <th>Vergi No</th>
                <th>Başvuru Tarihi</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600 }}>
                    {d.companyName}
                    {d.source === 'manual' && <span className="ledger-tag">Manuel</span>}
                  </td>
                  <td>{d.email}</td>
                  <td>{d.phone}</td>
                  <td className="admin-mono">{d.taxNumber || '—'}</td>
                  <td>{d.createdAt?.toDate?.().toLocaleDateString('tr-TR') ?? '—'}</td>
                  <td><span className={STATUS_CLASSES[d.status]}>{STATUS_LABELS[d.status]}</span></td>
                  <td>
                    <div className="admin-actions">
                      {d.status !== 'approved' && (
                        <button className="admin-btn admin-btn-sm" style={{ borderColor: '#2e7d32', color: '#4caf50' }} onClick={() => setStatus(d.id, 'approved')}>
                          Onayla
                        </button>
                      )}
                      {d.status !== 'rejected' && (
                        <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => setStatus(d.id, 'rejected')}>
                          Reddet
                        </button>
                      )}
                    </div>
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
