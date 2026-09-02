import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { quoteNo, totalOf, invoiceQuote } from './quoteLedger';
import type { QuoteRequest, QuoteItem } from '../types/firestore';

type QuoteWithId = QuoteRequest & { id: string };
type Tab = 'all' | 'pending' | 'confirmed' | 'rejected';

const STATUS_BADGES: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Bekliyor', cls: 'admin-badge--warning' },
  answered: { label: 'Yanıtlandı (eski)', cls: 'admin-badge--success' },
  confirmed: { label: 'Onaylandı', cls: 'admin-badge--success' },
  rejected: { label: 'Reddedildi', cls: 'admin-badge--danger' },
};

const money = (n: number) => `${n.toLocaleString('tr-TR')} ₺`;

// Firestore rejects `undefined` field values — omit unitPrice when unset.
const sanitizeItems = (items: QuoteItem[]): QuoteItem[] =>
  items.map(({ unitPrice, ...rest }) =>
    unitPrice != null && !isNaN(unitPrice) ? { ...rest, unitPrice } : rest);

export default function AdminQuotes() {
  const [quotes, setQuotes] = useState<QuoteWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  // Editable line items per pending quote, seeded on expand
  const [edits, setEdits] = useState<Record<string, QuoteItem[]>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    getDocs(query(collection(db, 'quoteRequests'), orderBy('createdAt', 'desc')))
      .then(snap => {
        setQuotes(snap.docs.map(d => ({ id: d.id, ...d.data() } as QuoteWithId)));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleExpand = (q: QuoteWithId) => {
    const next = expanded === q.id ? null : q.id;
    setExpanded(next);
    if (next && q.status === 'pending' && !edits[q.id]) {
      setEdits(prev => ({ ...prev, [q.id]: q.items.map(i => ({ ...i })) }));
    }
  };

  const patchItem = (quoteId: string, idx: number, patch: Partial<QuoteItem>) =>
    setEdits(prev => ({
      ...prev,
      [quoteId]: prev[quoteId].map((it, i) => i === idx ? { ...it, ...patch } : it),
    }));

  const removeItem = (quoteId: string, idx: number) =>
    setEdits(prev => ({ ...prev, [quoteId]: prev[quoteId].filter((_, i) => i !== idx) }));

  const savePrices = async (q: QuoteWithId) => {
    const items = sanitizeItems(edits[q.id] || q.items);
    if (!items.length) { alert('En az bir satır kalmalı.'); return; }
    setBusy(q.id);
    try {
      const total = totalOf(items);
      await updateDoc(doc(db, 'quoteRequests', q.id), { items, total });
      setQuotes(prev => prev.map(x => x.id === q.id ? { ...x, items, total } : x));
    } finally {
      setBusy(null);
    }
  };

  const rejectQuote = async (q: QuoteWithId) => {
    if (!confirm(`${quoteNo(q.id)} — ${q.dealerName} teklifi reddedilsin mi?`)) return;
    setBusy(q.id);
    try {
      await updateDoc(doc(db, 'quoteRequests', q.id), { status: 'rejected' });
      setQuotes(prev => prev.map(x => x.id === q.id ? { ...x, status: 'rejected' } : x));
    } finally {
      setBusy(null);
    }
  };

  const confirmQuote = async (q: QuoteWithId) => {
    const items = sanitizeItems(edits[q.id] || q.items);
    if (!items.length) { alert('En az bir satır kalmalı.'); return; }
    const total = totalOf(items);
    const unpriced = items.filter(i => i.unitPrice == null).length;
    const msg =
      `${quoteNo(q.id)} — ${q.dealerName}\n` +
      `Toplam: ${money(total)}\n` +
      (unpriced > 0 ? `DİKKAT: ${unpriced} satırın fiyatı girilmemiş (0 ₺ olarak işlenecek).\n` : '') +
      `\nOnaylandığında bu sipariş bayinin bekleyen siparişlerine eklenecek (cari hesap henüz etkilenmeyecek). Devam edilsin mi?`;
    if (!confirm(msg)) return;

    setBusy(q.id);
    try {
      await updateDoc(doc(db, 'quoteRequests', q.id), {
        items, total, status: 'confirmed', confirmedAt: serverTimestamp(),
      });
      setQuotes(prev => prev.map(x => x.id === q.id
        ? { ...x, items, total, status: 'confirmed' }
        : x));
    } catch (e: any) {
      alert('Onaylama başarısız: ' + (e.message || e));
    } finally {
      setBusy(null);
    }
  };

  const doInvoice = async (q: QuoteWithId) => {
    if (!confirm(`${quoteNo(q.id)} — ${q.dealerName}\n${money(q.total ?? totalOf(q.items))} tutarı bayinin cari hesabına BORÇ olarak işlensin mi?`)) return;
    setBusy(q.id);
    try {
      await invoiceQuote(q);
      setQuotes(prev => prev.map(x => x.id === q.id ? { ...x, invoiced: true } : x));
    } catch (e: any) {
      alert('Faturalandırma başarısız: ' + (e.message || e));
    } finally {
      setBusy(null);
    }
  };

  const filtered = tab === 'all' ? quotes : quotes.filter(q => q.status === tab);
  const counts = {
    all: quotes.length,
    pending: quotes.filter(q => q.status === 'pending').length,
    confirmed: quotes.filter(q => q.status === 'confirmed').length,
    rejected: quotes.filter(q => q.status === 'rejected').length,
  };

  if (loading) return <div className="admin-page"><p>Yükleniyor...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Teklifler</h2>
      </div>

      <div className="admin-tabs">
        {(['all', 'pending', 'confirmed', 'rejected'] as Tab[]).map(t => (
          <button key={t} className={`admin-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {{ all: 'Tümü', pending: 'Bekleyenler', confirmed: 'Onaylananlar', rejected: 'Reddedilenler' }[t]}
            {counts[t] > 0 && <span className="admin-tab-count">{counts[t]}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: '#888', padding: '24px 0' }}>Teklif bulunamadı.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(q => {
            const isPending = q.status === 'pending';
            const items = isPending ? (edits[q.id] || q.items) : q.items;
            const total = isPending ? totalOf(items) : (q.total ?? totalOf(q.items));
            const badge = STATUS_BADGES[q.status] || STATUS_BADGES.pending;
            return (
              <div key={q.id} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, overflow: 'hidden' }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer', flexWrap: 'wrap', gap: 12 }}
                  onClick={() => toggleExpand(q)}
                >
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontFamily: 'monospace', color: '#ddd' }}>{quoteNo(q.id)}</span>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{q.dealerName}</span>
                    {q.source === 'list' && <span className="admin-badge">📷 Liste</span>}
                    <span style={{ color: '#888', fontSize: 13 }}>{q.items.length} kalem</span>
                    {total > 0 && <span style={{ color: '#ccc', fontSize: 13, fontWeight: 700 }}>{money(total)}</span>}
                    <span style={{ color: '#888', fontSize: 12 }}>{q.createdAt?.toDate?.().toLocaleDateString('tr-TR') ?? '—'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className={`admin-badge ${badge.cls}`}>{badge.label}</span>
                    <span style={{ color: '#555', fontSize: 12 }}>{expanded === q.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {expanded === q.id && (
                  <div style={{ borderTop: '1px solid #2a2a2a', padding: '16px 18px' }}>
                    {q.notes && <p style={{ color: '#aaa', fontSize: 13, marginBottom: 14 }}>Not: {q.notes}</p>}

                    <div className="admin-table-wrapper">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Ürün</th><th>Kod</th><th>Adet</th><th>Birim Fiyat (₺)</th><th>Tutar</th>
                            {isPending && <th></th>}
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, i) => (
                            <tr key={i}>
                              <td style={{ minWidth: 220 }}>
                                {isPending ? (
                                  <input
                                    value={item.productName}
                                    onChange={e => patchItem(q.id, i, { productName: e.target.value })}
                                    style={{ width: '100%', minWidth: 200, padding: '5px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, boxSizing: 'border-box' }}
                                  />
                                ) : item.productName}
                                {!item.productId && <span style={{ marginLeft: 6, fontSize: 11, color: '#b45309' }}>(listeden)</span>}
                              </td>
                              <td className="admin-mono">{item.productCode || '—'}</td>
                              <td>
                                {isPending ? (
                                  <input
                                    type="number" min={1}
                                    value={item.qty}
                                    onChange={e => patchItem(q.id, i, { qty: Math.max(1, parseInt(e.target.value) || 1) })}
                                    style={{ width: 64, padding: '5px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }}
                                  />
                                ) : item.qty}
                              </td>
                              <td>
                                {isPending ? (
                                  <input
                                    type="number" min={0} step={0.01}
                                    value={item.unitPrice ?? ''}
                                    onChange={e => patchItem(q.id, i, { unitPrice: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                                    placeholder="Fiyat"
                                    style={{ width: 100, padding: '5px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }}
                                  />
                                ) : (item.unitPrice != null ? money(item.unitPrice) : '—')}
                              </td>
                              <td style={{ fontWeight: 600 }}>
                                {item.unitPrice != null ? money(item.unitPrice * item.qty) : '—'}
                              </td>
                              {isPending && (
                                <td>
                                  <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => removeItem(q.id, i)}>Sil</button>
                                </td>
                              )}
                            </tr>
                          ))}
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700 }}>Toplam</td>
                            <td colSpan={isPending ? 2 : 1} style={{ fontWeight: 700, color: '#15803d' }}>{money(total)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {isPending && (
                      <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                        <button
                          className="admin-btn admin-btn-primary"
                          onClick={() => confirmQuote(q)}
                          disabled={busy === q.id}
                        >
                          {busy === q.id ? 'İşleniyor...' : '✓ Onayla ve Cariye İşle'}
                        </button>
                        <button className="admin-btn" onClick={() => savePrices(q)} disabled={busy === q.id}>
                          Değişiklikleri Kaydet
                        </button>
                        <button className="admin-btn admin-btn-danger" onClick={() => rejectQuote(q)} disabled={busy === q.id}>
                          Reddet
                        </button>
                      </div>
                    )}

                    {q.status === 'confirmed' && (
                      q.invoiced ? (
                        <p style={{ marginTop: 12, marginBottom: 0, fontSize: 13, color: '#15803d' }}>
                          ✓ {money(total)} bayinin cari hesabına borç olarak işlendi
                          {q.invoicedAt?.toDate ? ` (${q.invoicedAt.toDate().toLocaleDateString('tr-TR')})` : ''}.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', gap: 10, marginTop: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                          <button
                            className="admin-btn admin-btn-primary"
                            onClick={() => doInvoice(q)}
                            disabled={busy === q.id}
                          >
                            {busy === q.id ? 'İşleniyor...' : '💳 Faturalandır'}
                          </button>
                          <span style={{ fontSize: 13, color: '#888' }}>Onaylandı, henüz cari hesaba işlenmedi.</span>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
