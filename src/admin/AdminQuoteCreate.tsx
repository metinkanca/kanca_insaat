import { Fragment, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { fold } from '../searchFold.ts';
import type { OcrDiagnostics } from '../ocr/ocrUtils';
import { readQuoteRowsFromFile, rowFromProduct, stripQty } from '../ocr/quoteRows';
import type { ProductWithId, ReviewRow } from '../ocr/quoteRows';
import { totalOf } from './quoteLedger';
import type { Dealer, QuoteItem } from '../types/firestore';

type DealerWithId = Dealer & { id: string };

const OCR_KEY = import.meta.env.VITE_OCR_SPACE_KEY as string | undefined;

const money = (n: number) => `${n.toLocaleString('tr-TR')} ₺`;

// Admin-side counterpart of the dealer portal's "Yeni Teklif" screen: the same
// OCR list reader and product picker, but the admin picks which dealer the
// quote belongs to and can price the lines on the spot. The quote is saved as
// 'pending' so it still goes through the normal Teklifler → Onayla →
// Faturalandır flow rather than skipping straight onto the cari hesap.
export default function AdminQuoteCreate() {
  const navigate = useNavigate();
  const [dealers, setDealers] = useState<DealerWithId[]>([]);
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [categories, setCategories] = useState<{ slug: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [dealerId, setDealerId] = useState('');
  // Used when no registered dealer is picked — the quote is then just a named
  // (or anonymous) draft that is not tied to any cari hesap.
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [items, setItems] = useState<ReviewRow[]>([]);

  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<number | null>(null);
  const [listFileName, setListFileName] = useState('');
  const [ocrDebug, setOcrDebug] = useState<OcrDiagnostics | null>(null);
  const [switchingKey, setSwitchingKey] = useState<number | null>(null);
  const [switchSearch, setSwitchSearch] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    Promise.all([
      getDocs(query(collection(db, 'dealers'), orderBy('createdAt', 'desc'))),
      getDocs(collection(db, 'products')),
      getDocs(collection(db, 'categories')),
    ]).then(([dealersSnap, prodsSnap, catsSnap]) => {
      setDealers(dealersSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as DealerWithId))
        .filter(d => d.status === 'approved')
        .sort((a, b) => (a.companyName || '').localeCompare(b.companyName || '', 'tr')));
      setProducts(prodsSnap.docs
        .filter(d => d.data().isActive !== false)
        .map(d => ({ id: d.id, ...d.data() } as ProductWithId)));
      setCategories(catsSnap.docs
        .map(d => ({ slug: d.id, title: (d.data().title as string) || d.id }))
        .sort((a, b) => a.title.localeCompare(b.title, 'tr')));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // ── Manual picker ──────────────────────────────────────────────────────────

  const toggleInQuote = (product: ProductWithId) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.productId === product.id);
      if (idx >= 0) return prev.filter(i => i.productId !== product.id);
      return [...prev, rowFromProduct(product)];
    });
  };

  // ── OCR list upload ────────────────────────────────────────────────────────

  const handleListFile = async (file: File) => {
    if (!OCR_KEY) { setError('VITE_OCR_SPACE_KEY eksik — liste okuma servisi yapılandırılmamış.'); return; }
    setError('');
    setSaved('');
    setOcrBusy(true);
    setOcrProgress(null);
    setListFileName(file.name);
    try {
      const { rows, diagnostics, error: ocrError } = await readQuoteRowsFromFile(
        file, OCR_KEY, products, p => setOcrProgress(p),
      );
      setOcrDebug(diagnostics);
      if (ocrError) { setError(ocrError); return; }
      setItems(prev => [...prev, ...rows]);
    } catch (e: any) {
      setError(e.message || 'Liste okunamadı.');
    } finally {
      setOcrBusy(false);
      setOcrProgress(null);
    }
  };

  // ── Row editing ────────────────────────────────────────────────────────────

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

  // ── Save ───────────────────────────────────────────────────────────────────

  const saveQuote = async () => {
    // The dealer is optional. Without one the quote carries an empty dealerId,
    // which matches no cari hesap — it stays a standalone draft in Teklifler
    // and cannot be invoiced (see AdminQuotes).
    const dealer = dealers.find(d => d.id === dealerId);
    const name = dealer ? dealer.companyName : customerName.trim();

    // Firestore rejects `undefined` field values — omit unitPrice when unset.
    const quoteItems: QuoteItem[] = items
      .filter(r => r.text.trim())
      .map(r => {
        const item: QuoteItem = {
          productId: r.productId,
          productName: r.text.trim(),
          productCode: r.productCode,
          qty: r.qty,
        };
        if (r.unitPrice != null && !isNaN(r.unitPrice)) item.unitPrice = r.unitPrice;
        return item;
      });

    if (quoteItems.length === 0) { setError('En az bir ürün ekleyin.'); return; }
    setError('');
    setSaving(true);
    try {
      const ref = await addDoc(collection(db, 'quoteRequests'), {
        dealerId: dealer ? dealer.id : '',
        dealerName: name,
        items: quoteItems,
        notes: notes.trim(),
        status: 'pending' as const,
        source: items.some(r => r.ocrLine) ? 'list' as const : 'manual' as const,
        total: totalOf(quoteItems),
        createdAt: serverTimestamp(),
      });
      setItems([]);
      setNotes('');
      setCustomerName('');
      setListFileName('');
      setOcrDebug(null);
      setSaved(`#${ref.id.slice(-6).toUpperCase()} numaralı teklif ${name ? `${name} adına ` : ''}oluşturuldu.`);
    } catch (e: any) {
      setError('Teklif kaydedilemedi: ' + (e.message || e));
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

  if (loading) return <div className="admin-page"><p>Yükleniyor...</p></div>;

  const total = items.reduce((s, i) => s + (i.unitPrice ?? 0) * i.qty, 0);
  const unpricedCount = items.filter(i => i.unitPrice == null).length;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Teklif Ekle</h2>
        <button className="admin-btn" onClick={() => navigate('/admin/quotes')}>Tekliflere Git</button>
      </div>

      <div className="admin-home-section">
        <h3 className="admin-home-section-title">1. Bayi / Müşteri <span style={{ fontWeight: 400, color: '#888' }}>(isteğe bağlı)</span></h3>
        <select
          className="admin-quote-select"
          value={dealerId}
          onChange={e => { setDealerId(e.target.value); setSaved(''); }}
          style={{ minWidth: 280 }}
        >
          <option value="">Bayi seçilmedi</option>
          {dealers.map(d => (
            <option key={d.id} value={d.id}>{d.companyName}{d.email ? ` — ${d.email}` : ''}</option>
          ))}
        </select>

        {!dealerId && (
          <input
            className="admin-quote-select"
            value={customerName}
            onChange={e => { setCustomerName(e.target.value); setSaved(''); }}
            placeholder="Müşteri / firma adı yazın (boş bırakabilirsiniz)"
            style={{ minWidth: 280, marginLeft: 10 }}
          />
        )}

        <p className="admin-quote-hint" style={{ marginBottom: 0 }}>
          {dealerId
            ? 'Teklif bu bayinin hesabına bağlanır; onaylandıktan sonra cari hesabına faturalandırılabilir.'
            : 'Bayi seçmeden de teklif oluşturabilirsiniz. Bu durumda teklif bir cari hesaba bağlanmaz ve faturalandırılamaz — sadece Teklifler listesinde durur.'}
        </p>
        {dealers.length === 0 && (
          <p className="admin-quote-hint" style={{ marginBottom: 0 }}>
            Onaylı bayi bulunmuyor — bayiye bağlamak isterseniz önce Bayiler sayfasından onaylayın.
          </p>
        )}
      </div>

      <div className="admin-home-section">
        <h3 className="admin-home-section-title">2. Ürünler</h3>

        <div className="admin-quote-filters">
          <input
            className="admin-search"
            value={productSearch}
            onChange={e => setProductSearch(e.target.value)}
            placeholder="Ürün ara (ad, kod, marka)..."
          />
          <select
            className="admin-quote-select"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}
          </select>
        </div>

        <p className="admin-quote-hint">
          Eklemek için ürüne tıklayın; tekrar tıklamak listeden çıkarır.
          Bayiden gelen malzeme listesinin fotoğrafını veya PDF'ini yükleyerek de ekleyebilirsiniz —
          bayi portalıyla aynı okuyucu çalışır, satırlar ürünlerle eşleştirilir.
        </p>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', margin: '0 0 14px' }}>
          <label className="admin-btn admin-btn-sm" style={{ cursor: 'pointer' }}>
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

        <div className="admin-quote-product-grid">
          {filteredProducts.slice(0, 50).map(p => {
            const inQuote = items.find(i => i.productId === p.id);
            return (
              <div
                key={p.id}
                className={`admin-quote-product-item${inQuote ? ' selected' : ''}`}
                onClick={() => toggleInQuote(p)}
                title={inQuote ? 'Listeden çıkar' : 'Teklife ekle'}
              >
                {p.img && <img src={p.img} className="admin-quote-thumb" alt="" />}
                <span className="admin-quote-product-name">{p.productName}</span>
                {p.price > 0 && <span className="admin-quote-product-price">{money(p.price)}</span>}
                {inQuote && <span className="admin-quote-check">✓ Seçildi</span>}
              </div>
            );
          })}
          {filteredProducts.length === 0 && (
            <span style={{ color: '#888', fontSize: 13 }}>Ürün bulunamadı.</span>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <div className="admin-home-section">
          <h3 className="admin-home-section-title">3. Teklif Kalemleri ({items.length})</h3>
          <p className="admin-quote-hint" style={{ marginTop: 0 }}>
            Eşleşen ürünlerin fiyatı katalogdan geldi; hepsini burada değiştirebilirsiniz.
            Boş bıraktığınız fiyatlar teklif onayında girilir.
          </p>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr><th>Ürün</th><th>Eşleşme</th><th>Adet</th><th>Birim Fiyat (₺)</th><th>Tutar</th><th></th></tr>
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
                            className="admin-quote-row-input"
                          />
                        )}
                        {r.ocrLine && <div className="admin-quote-ocr-line">Okunan: {r.ocrLine}</div>}
                      </td>
                      <td>
                        <div className="admin-quote-match-cell">
                          {r.productId ? (
                            <>
                              <span style={{ color: '#15803d', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>✓ Eşleşti</span>
                              <button
                                className="admin-btn admin-btn-sm"
                                onClick={() => { setSwitchingKey(switchingKey === r.key ? null : r.key); setSwitchSearch(''); }}
                                title="Eşleşme yanlışsa başka ürün seçin"
                              >
                                Ürün Değiştir
                              </button>
                            </>
                          ) : (
                            <>
                              <span style={{ color: '#b45309', fontSize: 12 }}>Eşleşmedi</span>
                              <button
                                className="admin-btn admin-btn-sm"
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
                                    className="admin-btn admin-btn-sm admin-quote-suggestion"
                                    title="Bu ürünü seç"
                                    onClick={() => selectProductForRow(r.key, p)}
                                  >
                                    ↳ {s.name}
                                  </button>
                                );
                              })}
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <input
                          type="number"
                          min={1}
                          value={r.qty}
                          onChange={e => updateRow(r.key, { qty: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="admin-quote-qty-input"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={r.unitPrice ?? ''}
                          onChange={e => updateRow(r.key, {
                            unitPrice: e.target.value === '' ? undefined : parseFloat(e.target.value),
                          })}
                          placeholder="Fiyat"
                          className="admin-quote-price-input"
                        />
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {r.unitPrice != null ? money(r.unitPrice * r.qty) : '—'}
                      </td>
                      <td>
                        <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => removeRow(r.key)}>Sil</button>
                      </td>
                    </tr>
                    {switchingKey === r.key && (
                      <tr>
                        <td colSpan={6} className="admin-quote-picker">
                          <input
                            autoFocus
                            value={switchSearch}
                            onChange={e => setSwitchSearch(e.target.value)}
                            placeholder="Ürün ara (ad, kod, marka)..."
                            className="admin-search"
                            style={{ maxWidth: 320, marginBottom: 8 }}
                          />
                          <div className="admin-quote-picker-list">
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
                                  className="admin-btn admin-btn-sm"
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
                                className="admin-btn admin-btn-sm admin-btn-danger"
                                onClick={() => { unmatchRow(r.key); setSwitchingKey(null); }}
                              >
                                Eşleşmeyi Kaldır
                              </button>
                            )}
                            <button
                              className="admin-btn admin-btn-sm"
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
                  <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700 }}>
                    Toplam{unpricedCount > 0 ? ` (${unpricedCount} satır fiyatsız)` : ''}
                  </td>
                  <td colSpan={2} style={{ fontWeight: 700, color: '#15803d' }}>{money(total)}</td>
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

      <div className="admin-home-section">
        <h3 className="admin-home-section-title">4. Notlar ve Kayıt</h3>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Teklife eklenecek notlar..."
          rows={3}
          style={{
            width: '100%', maxWidth: 560, padding: '10px 14px', border: '1px solid #ddd',
            borderRadius: 6, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit',
          }}
        />
        <p className="admin-quote-hint">
          Teklif "Bekliyor" durumunda oluşturulur; Teklifler sayfasından
          {dealerId ? ' onaylanıp faturalandırılır.' : ' onaylanır (bayi bağlı olmadığı için faturalandırılamaz).'}
        </p>
        {error && <p className="admin-error">{error}</p>}
        {saved && (
          <p style={{ color: '#15803d', fontSize: 13, margin: '0 0 10px' }}>
            ✓ {saved}{' '}
            <button className="admin-btn admin-btn-sm" onClick={() => navigate('/admin/quotes')}>Tekliflere git</button>
          </p>
        )}
        <button
          className="admin-btn admin-btn-primary"
          onClick={saveQuote}
          disabled={saving || ocrBusy || items.length === 0}
        >
          {saving ? 'Kaydediliyor...' : 'Teklifi Oluştur'}
        </button>
      </div>
    </div>
  );
}
