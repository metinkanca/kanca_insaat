import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useDealer } from './DealerContext';
import type { DealerPayment } from '../types/firestore';

type PaymentWithId = DealerPayment & { id: string };

export default function DealerLedger() {
  const { dealer } = useDealer();
  const [payments, setPayments] = useState<PaymentWithId[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dealer) return;
    getDocs(query(
      collection(db, 'dealerPayments'),
      where('dealerId', '==', dealer.uid)
    )).then(snap => {
      const arr = snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentWithId));
      arr.sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0));
      setPayments(arr);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [dealer]);

  // Running balance
  let balance = 0;
  const rows = payments.map(p => {
    balance += (p.credit || 0) - (p.debt || 0);
    return { ...p, balance };
  });

  const totalDebt = payments.reduce((s, p) => s + (p.debt || 0), 0);
  const totalCredit = payments.reduce((s, p) => s + (p.credit || 0), 0);

  if (loading) return <div className="dealer-page"><p>Yükleniyor...</p></div>;

  return (
    <div className="dealer-page">
      <div className="dealer-page-header">
        <h2 className="dealer-page-title">Cari Hesabım</h2>
        <p className="dealer-page-subtitle">{dealer?.companyName}</p>
      </div>

      <div className="dealer-stats">
        <div className="dealer-stat-card">
          <span className="dealer-stat-value">{totalDebt.toLocaleString('tr-TR')} ₺</span>
          <span className="dealer-stat-label">Toplam Borç</span>
        </div>
        <div className="dealer-stat-card">
          <span className="dealer-stat-value">{totalCredit.toLocaleString('tr-TR')} ₺</span>
          <span className="dealer-stat-label">Toplam Alacak</span>
        </div>
        <div className={`dealer-stat-card ${balance >= 0 ? 'dealer-stat-card--positive' : 'dealer-stat-card--negative'}`}>
          <span className="dealer-stat-value">{balance.toLocaleString('tr-TR')} ₺</span>
          <span className="dealer-stat-label">Bakiye</span>
        </div>
      </div>

      {payments.length === 0 ? (
        <p className="dealer-empty">Henüz hesap hareketi bulunmuyor.</p>
      ) : (
        <div className="dealer-table-wrapper">
          <table className="dealer-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Açıklama</th>
                <th>Ödeme Tipi</th>
                <th>Borç</th>
                <th>Alacak</th>
                <th>Bakiye</th>
                <th>Belge</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(p => (
                <tr key={p.id}>
                  <td>{p.createdAt?.toDate?.().toLocaleDateString('tr-TR') ?? '—'}</td>
                  <td>{p.description}</td>
                  <td><span className="dealer-badge dealer-badge--neutral">{p.paymentType}</span></td>
                  <td className={p.debt ? 'dealer-ledger-debt' : ''}>{p.debt ? `${p.debt.toLocaleString('tr-TR')} ₺` : '—'}</td>
                  <td className={p.credit ? 'dealer-ledger-credit' : ''}>{p.credit ? `${p.credit.toLocaleString('tr-TR')} ₺` : '—'}</td>
                  <td className={p.balance >= 0 ? 'dealer-ledger-credit' : 'dealer-ledger-debt'}>
                    {p.balance.toLocaleString('tr-TR')} ₺
                  </td>
                  <td>
                    {p.pdfData && (
                      <a
                        href={p.pdfData}
                        download={p.pdfFileName || 'belge.pdf'}
                        className="dealer-btn dealer-btn-sm"
                      >
                        PDF
                      </a>
                    )}
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
