import { Fragment, useEffect, useState } from 'react';
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useDealer } from './DealerContext';
import { fold } from '../searchFold.ts';
import { callOcrSpaceLines, getOcrDiagnostics, runOcrOnPdf } from '../ocr/ocrUtils';
import type { OcrDiagnostics } from '../ocr/ocrUtils';
import {
  applyDittoMarks,
  buildVocabulary,
  correctOcrLine,
  matchProductsFromOcr,
  mergeStubLines,
} from '../ocr/ocrMatch';
import type { QuoteRequest, QuoteItem } from '../types/firestore';
import type { Product } from '../types/firestore';

type QuoteWithId = QuoteRequest & { id: string };
type ProductWithId = Product & { id: string };

const OCR_KEY = import.meta.env.VITE_OCR_SPACE_KEY as string | undefined;

// One row of the OCR review table. productId === '' means the line did not
// match a catalog product; it goes in as free text and is priced by the
// admin at confirmation.
type ReviewRow = {
  key: number;
  text: string;
  qty: number;
  productId: string;
  productCode: string;
  unitPrice?: number;
  ocrLine: string;
  // Near misses for a line that did not match: shown as one-click chips so
  // the dealer fixes it without searching the whole catalog by hand.
  suggestions?: { id: string; name: string }[];
  _line?: number; // original OCR line order, for sorting
};
let rowKey = 1;

const STATUS_BADGES: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Bekliyor', cls: 'dealer-badge--warning' },
  answered: { label: 'Yanıtlandı', cls: 'dealer-badge--success' },
  confirmed: { label: 'Onaylandı', cls: 'dealer-badge--success' },
  rejected: { label: 'Reddedildi', cls: 'dealer-badge--danger' },
};

const money = (n: number) => `${n.toLocaleString('tr-TR')} ₺`;

// Strip trailing quantity notation ("... 5 adet", "... 30 mt") from free text
const stripQty = (s: string) =>
  s.replace(/\s+\d+\s*(adet(?:ler)?|adeti?|ad|mt|metre)\s*$/i, '').trim();

export default function DealerQuotes() {
  const { dealer } = useDealer();
  const [quotes, setQuotes] = useState<QuoteWithId[]>([]);
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [notes, setNotes] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [categories, setCategories] = useState<{ slug: string; title: string }[]>([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Combined quote items — populated either by clicking products in the grid
  // or by uploading a list (OCR), or both at once.
  const [items, setItems] = useState<ReviewRow[]>([]);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<number | null>(null);
  const [listFileName, setListFileName] = useState('');
  const [ocrDebug, setOcrDebug] = useState<OcrDiagnostics | null>(null);
  const [switchingKey, setSwitchingKey] = useState<number | null>(null);
  const [switchSearch, setSwitchSearch] = useState('');

  useEffect(() => {
    if (!dealer) return;
    Promise.all([
      getDocs(query(collection(db, 'quoteRequests'), where('dealerId', '==', dealer.uid))),
      getDocs(collection(db, 'products')),
      getDocs(collection(db, 'categories')),
    ]).then(([quotesSnap, prodsSnap, catsSnap]) => {
      const quotesArr = quotesSnap.docs.map(d => ({ id: d.id, ...d.data() } as QuoteWithId));
      quotesArr.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      setQuotes(quotesArr);
      setProducts(prodsSnap.docs
        .filter(d => d.data().isActive !== false)
        .map(d => ({ id: d.id, ...d.data() } as ProductWithId)));
      setCategories(catsSnap.docs
        .map(d => ({ slug: d.id, title: (d.data().title as string) || d.id }))
        .sort((a, b) => a.title.localeCompare(b.title, 'tr')));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [dealer]);

  // ── Manual picker ──────────────────────────────────────────────────────────

  const toggleInQuote = (product: ProductWithId) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.productId === product.id);
      if (idx >= 0) return prev.filter(i => i.productId !== product.id);
      const row: ReviewRow = {
        key: rowKey++,
        text: product.productName,
        qty: 1,
        productId: product.id,
        productCode: product.productCode,
        unitPrice: product.price > 0 ? product.price : undefined,
        ocrLine: '',
      };
      return [...prev, row];
    });
  };

  // ── OCR list upload ──────────────────────────────────────────────────────────

  const handleListFile = async (file: File) => {
    if (!OCR_KEY) { setError('Liste okuma servisi yapılandırılmamış.'); return; }
    setError('');
    setOcrBusy(true);
    setOcrProgress(null);
    setListFileName(file.name);
    try {
      let lines: string[];
      if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
        const text = await runOcrOnPdf(file, OCR_KEY, p => setOcrProgress(Math.round(p * 100)));
        lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      } else {
        lines = await callOcrSpaceLines(file, OCR_KEY);
      }
      setOcrDebug(getOcrDiagnostics());
      if (!lines.length) {
        setError('Listede okunabilir yazı bulunamadı. Daha net bir fotoğraf deneyin.');
        return;
      }

      const matchProducts = products.map(p => ({
        id: p.id, productName: p.productName, productCode: p.productCode, brand: p.brand,
      }));
      // The catalog doubles as the spellchecker for the handwriting.
      const vocabulary = buildVocabulary(matchProducts);
      const corrected = applyDittoMarks(
        mergeStubLines(lines.map(l => correctOcrLine(l, vocabulary))),
      );
      const { matched, unmatched } = matchProductsFromOcr(corrected, matchProducts);

      const priceOf = (id: string) => {
        const p = products.find(x => x.id === id);
        return p && p.price > 0 ? p.price : undefined;
      };

      const rows: ReviewRow[] = [
        ...matched.map(m => ({
          key: rowKey++,
          text: m.productName,
          qty: m.quantity,
          productId: m.productId,
          productCode: products.find(p => p.id === m.productId)?.productCode || '',
          unitPrice: priceOf(m.productId),
          ocrLine: m.ocrLine,
          _line: m.lineNumber,
        })),
        ...unmatched.map(u => ({
          key: rowKey++,
          text: stripQty(u.ocrLine),
          qty: u.quantity,
          productId: '',
          productCode: '',
          unitPrice: undefined,
          ocrLine: u.ocrLine,
          suggestions: u.candidates
            .filter(c => c.score >= 10)
            .map(c => ({ id: c.productId, name: c.productName })),
          _line: u.lineNumber,
        })),
      ].sort((a, b) => (a._line ?? 0) - (b._line ?? 0));

      if (!rows.length) {
        setError('Listede ürün satırı bulunamadı. Daha net bir fotoğraf deneyin.');
        return;
      }
      setItems(prev => [...prev, ...rows]);
    } catch (e: any) {
      setError(e.message || 'Liste okunamadı.');
    } finally {
      setOcrBusy(false);
      setOcrProgress(null);
    }
  };

  const updateRow = (key: number, patch: Partial<ReviewRow>) =>
    setItems(prev => prev.map(r => r.key === key ? { ...r, ...patch } : r));

  const removeRow = (key: number) =>
    setItems(prev => prev.filter(r => r.key !== key));

  const unmatchRow = (key: number) =>
    setItems(prev => prev.map(r => r.key === key
      ? { ...r, productId: '', productCode: '', unitPrice: undefined, text: stripQty(r.ocrLine) }
      : r));

  const selectProductForRow = (key: number, product: ProductWithId) => {
    setItems(prev => prev.map(r => r.key === key
      ? {
          ...r,
          productId: product.id,
          productCode: product.productCode,
          text: product.productName,
          unitPrice: product.price > 0 ? product.price : undefined,
        }
      : r));
    setSwitchingKey(null);
    setSwitchSearch('');
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const totalOf = (rows: { qty: number; unitPrice?: number }[]) =>
    rows.reduce((s, i) => s + (i.unitPrice ?? 0) * i.qty, 0);

  const submitQuote = async () => {
    const quoteItems: QuoteItem[] = items
      .filter(r => r.text.trim())
      .map(r => {
        const item: QuoteItem = {
          productId: r.productId,
          productName: r.text.trim(),
          productCode: r.productCode,
          qty: r.qty,
        };
        if (r.unitPrice != null) item.unitPrice = r.unitPrice;
        return item;
      });

    if (quoteItems.length === 0) { setError('En az bir ürün ekleyin.'); return; }
    setError('');
    setSaving(true);
    try {
      const data = {
        dealerId: dealer!.uid,
        dealerName: dealer!.companyName,
        items: quoteItems,
        notes: notes.trim(),
        status: 'pending' as const,
        source: items.some(r => r.ocrLine) ? 'list' as const : 'manual' as const,
        total: totalOf(quoteItems),
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, 'quoteRequests'), data);
      setQuotes(prev => [{ id: ref.id, ...data, createdAt: new Date() }, ...prev]);
      setItems([]);
      setListFileName('');
      setNotes('');
      setShowNew(false);
    } catch (e: any) {
      setError(e.message || 'Teklif gönderilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(p => {
    if (typeFilter && p.productType !== typeFilter) return false;
    if (!productSearch) return true;
    const q = fold(productSearch);
    return fold(p.productName).includes(q) ||
      fold(p.productCode).includes(q) ||
      fold(p.brand).includes(q);
  });

  if (loading) return <div className="dealer-page"><p>Yükleniyor...</p></div>;

  const total = totalOf(items);
  const unpricedCount = items.filter(i => i.unitPrice == null).length;

  return (
    <div className="dealer-page">
      <div className="dealer-page-header">
        <h2 className="dealer-page-title">Tekliflerim</h2>
        <button className="dealer-btn dealer-btn-primary" onClick={() => setShowNew(v => !v)}>
          {showNew ? 'İptal' : '+ Yeni Teklif'}
        </button>
      </div>

      {/* New quote form */}
      {showNew && (
        <div className="dealer-section">
          <h3 className="dealer-section-title">Yeni Teklif Oluştur</h3>

          <div className="dealer-products-filters" style={{ marginBottom: 0 }}>
            <input
              className="dealer-search"
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              placeholder="Ürün ara (ad, kod, marka)..."
            />
            <select
              className="dealer-select"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}
            </select>
          </div>
          <p className="dealer-quote-hint">
            Eklemek için ürüne tıklayın; tekrar tıklamak listeden çıkarır. Adetleri aşağıdan düzenleyebilirsiniz.
            İsterseniz malzeme listenizin fotoğrafını veya PDF'ini de yükleyebilirsiniz; sistem okuyup ürünlerle eşleştirir ve aynı listeye ekler.
          </p>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', margin: '0 0 14px' }}>
            <label className="dealer-btn dealer-btn-sm" style={{ cursor: 'pointer' }}>
              📷 Liste Yükleyerek Ekle (Fotoğraf / PDF)
              <input
                type="file"
                accept="image/*,.pdf"
                style={{ display: 'none' }}
                disabled={ocrBusy}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleListFile(f); e.target.value = ''; }}
              />
            </label>
            {listFileName && !ocrBusy && <span style={{ fontSize: 13, color: '#888' }}>{listFileName}</span>}
          </div>

          {ocrBusy && (
            <p style={{ fontSize: 14, color: '#555' }}>
              Liste okunuyor{ocrProgress != null ? ` (%${ocrProgress})` : ''}... Bu birkaç saniye sürebilir.
            </p>
          )}

          <div className="dealer-quote-product-grid">
            {filteredProducts.slice(0, 50).map(p => {
              const inQuote = items.find(i => i.productId === p.id);
              return (
                <div
                  key={p.id}
                  className={`dealer-quote-product-item${inQuote ? ' selected' : ''}`}
                  onClick={() => toggleInQuote(p)}
                  title={inQuote ? 'Listeden çıkar' : 'Teklife ekle'}
                >
                  {p.img && <img src={p.img} className="dealer-quote-thumb" alt="" />}
                  <span className="dealer-quote-product-name">{p.productName}</span>
                  {p.price > 0 && <span className="dealer-quote-product-price">{money(p.price)}</span>}
                  {inQuote && <span className="dealer-quote-check">✓ Seçildi</span>}
                </div>
              );
            })}
          </div>

              {items.length > 0 && (
                <div className="dealer-quote-items">
                  <h4 className="dealer-quote-items-title">Teklif Kalemleri ({items.length})</h4>
                  <p className="dealer-quote-hint" style={{ margin: '0 0 10px' }}>
                    Eşleşen ürünlerin fiyatı otomatik geldi. Eşleşmeyen satırların fiyatı onay sırasında belirlenecek.
                    Hatalı satırları düzeltin veya silin.
                  </p>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="dealer-table">
                      <thead>
                        <tr><th>Ürün</th><th>Eşleşme</th><th>Adet</th><th>Birim Fiyat</th><th>Tutar</th><th></th></tr>
                      </thead>
                      <tbody>
                        {items.map(r => (
                          <Fragment key={r.key}>
                            <tr>
                              <td style={{ minWidth: 220 }}>
                                {r.productId ? (
                                  <span>{r.text}</span>
                                ) : (
                                  <input
                                    value={r.text}
                                    onChange={e => updateRow(r.key, { text: e.target.value })}
                                    className="dealer-quote-row-input"
                                  />
                                )}
                                <div style={{ fontSize: 11, color: '#777', marginTop: 3 }}>
                                  Okunan: {r.ocrLine}
                                </div>
                              </td>
                              <td>
                                {r.productId ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                                    <span style={{ color: '#2e9c53', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>✓ Eşleşti</span>
                                    <button
                                      className="dealer-btn dealer-btn-sm"
                                      onClick={() => { setSwitchingKey(switchingKey === r.key ? null : r.key); setSwitchSearch(''); }}
                                      title="Eşleşme yanlışsa başka ürün seçin"
                                    >
                                      Ürün Değiştir
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                                    <span style={{ color: '#b45309', fontSize: 12 }}>Eşleşmedi</span>
                                    <button
                                      className="dealer-btn dealer-btn-sm"
                                      onClick={() => { setSwitchingKey(switchingKey === r.key ? null : r.key); setSwitchSearch(''); }}
                                    >
                                      Ürün Seç
                                    </button>
                                    {(r.suggestions || []).map(s => {
                                      const p = products.find(x => x.id === s.id);
                                      if (!p) return null;
                                      return (
                                        <button
                                          key={s.id}
                                          className="dealer-btn dealer-btn-sm"
                                          style={{ fontSize: 11, opacity: 0.85, textAlign: 'left', whiteSpace: 'normal' }}
                                          title="Bu ürünü seç"
                                          onClick={() => selectProductForRow(r.key, p)}
                                        >
                                          ↳ {s.name}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min={1}
                                  value={r.qty}
                                  onChange={e => updateRow(r.key, { qty: Math.max(1, parseInt(e.target.value) || 1) })}
                                  className="dealer-qty-input"
                                />
                              </td>
                              <td>{r.unitPrice != null ? money(r.unitPrice) : <span style={{ color: '#888', fontSize: 12 }}>onayda</span>}</td>
                              <td>{r.unitPrice != null ? money(r.unitPrice * r.qty) : '—'}</td>
                              <td><button className="dealer-btn dealer-btn-sm dealer-btn-danger" onClick={() => removeRow(r.key)}>Sil</button></td>
                            </tr>
                            {switchingKey === r.key && (
                              <tr>
                                <td colSpan={6} style={{ background: '#fafafa', padding: 12 }}>
                                  <input
                                    autoFocus
                                    value={switchSearch}
                                    onChange={e => setSwitchSearch(e.target.value)}
                                    placeholder="Ürün ara (ad, kod, marka)..."
                                    className="dealer-search"
                                    style={{ width: '100%', maxWidth: 320, marginBottom: 8 }}
                                  />
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
                                    {products
                                      .filter(p => {
                                        if (!switchSearch) return true;
                                        const q = fold(switchSearch);
                                        return fold(p.productName).includes(q) ||
                                          fold(p.productCode).includes(q) ||
                                          fold(p.brand).includes(q);
                                      })
                                      .slice(0, 30)
                                      .map(p => (
                                        <button
                                          key={p.id}
                                          className="dealer-btn dealer-btn-sm"
                                          style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                                          onClick={() => selectProductForRow(r.key, p)}
                                        >
                                          {p.productName}
                                        </button>
                                      ))}
                                    {products.length === 0 && (
                                      <span style={{ color: '#888', fontSize: 13 }}>Ürün bulunamadı.</span>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                    {r.productId && (
                                      <button
                                        className="dealer-btn dealer-btn-sm dealer-btn-danger"
                                        onClick={() => { unmatchRow(r.key); setSwitchingKey(null); }}
                                      >
                                        Eşleşmeyi Kaldır
                                      </button>
                                    )}
                                    <button
                                      className="dealer-btn dealer-btn-sm"
                                      onClick={() => { setSwitchingKey(null); setSwitchSearch(''); }}
                                    >
                                      Kapat
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        ))}
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700, color: '#2c2c2c' }}>
                            Toplam{unpricedCount > 0 ? ` (${unpricedCount} satır hariç)` : ''}
                          </td>
                          <td colSpan={2} style={{ fontWeight: 700, color: '#2e9c53' }}>{money(total)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {ocrDebug && (
                    <details style={{ marginTop: 10 }}>
                      <summary style={{ cursor: 'pointer', fontSize: 12, color: '#777' }}>
                        Fotoğraftan okunan ham satırlar ({ocrDebug.lines.length})
                      </summary>
                      <p style={{ fontSize: 11, color: '#888', margin: '6px 0 4px' }}>
                        Motor {ocrDebug.engine} · denemeler:{' '}
                        {ocrDebug.attempts.map(a => `${a.engine}→${a.error ? 'hata' : `${a.lines} satır`}`).join(', ')}
                      </p>
                      <pre style={{
                        fontSize: 11, background: '#f4f4f4', padding: 8, borderRadius: 4,
                        maxHeight: 260, overflow: 'auto', whiteSpace: 'pre-wrap', margin: 0,
                      }}>{ocrDebug.lines.join('\n')}</pre>
                      {ocrDebug.fragments.length > 0 && (
                        <>
                          <p style={{ fontSize: 11, color: '#888', margin: '8px 0 4px' }}>
                            Birleştirme öncesi parçalar ({ocrDebug.fragments.length})
                          </p>
                          <pre style={{
                            fontSize: 10, background: '#f4f4f4', padding: 8, borderRadius: 4,
                            maxHeight: 200, overflow: 'auto', whiteSpace: 'pre-wrap', margin: 0,
                          }}>{ocrDebug.fragments.join('\n')}</pre>
                        </>
                      )}
                    </details>
                  )}
                </div>
              )}

          <label className="dealer-field-label" style={{ display: 'block', marginTop: 16 }}>
            Notlar
            <textarea
              className="dealer-textarea"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Eklemek istediğiniz notlar..."
              rows={3}
            />
          </label>

          {error && <p className="dealer-error">{error}</p>}
          <button
            className="dealer-btn dealer-btn-primary"
            onClick={submitQuote}
            disabled={saving || ocrBusy}
            style={{ marginTop: 12 }}
          >
            {saving ? 'Gönderiliyor...' : 'Teklif Gönder'}
          </button>
        </div>
      )}

      {/* Quote history */}
      <div className="dealer-section">
        <h3 className="dealer-section-title">Teklif Geçmişi</h3>
        {quotes.length === 0 ? (
          <p className="dealer-empty">Henüz teklif talebiniz bulunmuyor.</p>
        ) : (
          <div className="dealer-orders-list">
            {quotes.map(q => {
              const badge = STATUS_BADGES[q.status] || STATUS_BADGES.pending;
              const showPrices = q.items.some(i => i.unitPrice != null);
              const qTotal = q.total ?? totalOf(q.items);
              return (
                <div key={q.id} className="dealer-order-card">
                  <div className="dealer-order-header" onClick={() => setExpanded(expanded === q.id ? null : q.id)}>
                    <div className="dealer-order-meta">
                      <span className="dealer-order-id">#{q.id.slice(-6).toUpperCase()}</span>
                      <span className="dealer-order-date">
                        {q.createdAt?.toDate?.().toLocaleDateString('tr-TR') ?? '—'}
                      </span>
                      <span style={{ color: '#888', fontSize: 13 }}>{q.items.length} kalem</span>
                      {qTotal > 0 && <span style={{ color: '#555', fontSize: 13, fontWeight: 600 }}>{money(qTotal)}</span>}
                    </div>
                    <div className="dealer-order-summary">
                      <span className={`dealer-badge ${badge.cls}`}>{badge.label}</span>
                      <span className="dealer-order-toggle">{expanded === q.id ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {expanded === q.id && (
                    <div className="dealer-order-items">
                      {q.notes && <p style={{ color: '#666', marginBottom: 12, fontSize: 13 }}>Not: {q.notes}</p>}
                      <table className="dealer-table">
                        <thead>
                          <tr>
                            <th>Ürün</th>
                            <th>Adet</th>
                            {showPrices && <th>Birim Fiyat</th>}
                            {showPrices && <th>Tutar</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {q.items.map((item, i) => (
                            <tr key={i}>
                              <td>{item.productName}</td>
                              <td>{item.qty}</td>
                              {showPrices && (
                                <td>{item.unitPrice != null ? money(item.unitPrice) : '—'}</td>
                              )}
                              {showPrices && (
                                <td>{item.unitPrice != null ? money(item.unitPrice * item.qty) : '—'}</td>
                              )}
                            </tr>
                          ))}
                          {showPrices && qTotal > 0 && (
                            <tr>
                              <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700, color: '#2c2c2c' }}>Toplam</td>
                              <td style={{ fontWeight: 700, color: '#2e9c53' }}>{money(qTotal)}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
