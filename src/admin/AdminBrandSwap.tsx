import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { fold } from '../searchFold.ts';
import type { Product } from '../types/firestore';

type ProductWithId = Product & { id: string };

export default function AdminBrandSwap() {
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [categories, setCategories] = useState<{ slug: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [fromBrand, setFromBrand] = useState('');
  const [toBrand, setToBrand] = useState('');
  const [toMode, setToMode] = useState<'existing' | 'new'>('existing');

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState('');

  const load = async () => {
    setLoading(true);
    const [prodSnap, catSnap] = await Promise.all([
      getDocs(collection(db, 'products')),
      getDocs(collection(db, 'categories')),
    ]);
    setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProductWithId)));
    setCategories(catSnap.docs
      .map(d => ({ slug: d.id, title: (d.data().title as string) || d.id }))
      .sort((a, b) => a.title.localeCompare(b.title, 'tr')));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const brands = useMemo(
    () => [...new Set(products.map(p => p.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr')),
    [products]
  );

  // Known logo per brand, so the swapped products pick up the target brand's logo.
  const brandLogos = useMemo(() => {
    const logos: Record<string, string> = {};
    products.forEach(p => { if (p.brand && p.logo && !logos[p.brand]) logos[p.brand] = p.logo; });
    return logos;
  }, [products]);

  const catTitle = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach(c => m.set(c.slug, c.title));
    return m;
  }, [categories]);

  const fromProducts = useMemo(
    () => products.filter(p => p.brand === fromBrand),
    [products, fromBrand]
  );

  const filtered = useMemo(() => {
    const q = fold(search);
    return fromProducts.filter(p => {
      if (typeFilter && p.productType !== typeFilter) return false;
      if (q && !fold(p.productName).includes(q) && !fold(p.productCode).includes(q)) return false;
      return true;
    });
  }, [fromProducts, search, typeFilter]);

  // Reset the picker whenever the brand pair changes.
  useEffect(() => {
    setSelected(new Set());
    setSearch('');
    setTypeFilter('');
    setResult('');
  }, [fromBrand, toBrand]);

  const toggle = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const confirmSwap = async () => {
    const targetBrand = toBrand.trim();
    if (!targetBrand || selected.size === 0) return;
    if (!confirm(`Seçili ${selected.size} ürün "${fromBrand}" markasından "${targetBrand}" markasına taşınacak. Devam edilsin mi?`)) return;

    const ids = [...selected];
    const targetLogo = brandLogos[targetBrand];

    setBusy(true);
    setProgress(0);
    setResult('');
    let ok = 0, fail = 0;
    for (let i = 0; i < ids.length; i++) {
      try {
        const patch: Partial<Product> = { brand: targetBrand };
        if (targetLogo) patch.logo = targetLogo;
        await updateDoc(doc(db, 'products', ids[i]), patch as any);
        ok++;
      } catch { fail++; }
      setProgress(Math.round(((i + 1) / ids.length) * 100));
    }
    setProducts(prev => prev.map(p => ids.includes(p.id) ? { ...p, brand: targetBrand, logo: targetLogo || p.logo } : p));
    setSelected(new Set());
    setBusy(false);
    setResult(`${ok} ürün "${targetBrand}" markasına taşındı${fail ? `, ${fail} başarısız` : ''}.`);
  };

  if (loading) return <div className="admin-page"><p>Yükleniyor...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Marka Değiştir</h2>
      </div>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: '#666' }}>
        İki marka seçin, "kaynak" markadaki ürünlerden taşınacakları işaretleyin ve onaylayın.
      </p>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 20 }}>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: 13, color: '#444', gap: 4 }}>
          Kaynak Marka (nereden)
          <select
            value={fromBrand}
            onChange={e => setFromBrand(e.target.value)}
            style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14, minWidth: 220 }}
          >
            <option value="">Seçin...</option>
            {brands.map(b => <option key={b} value={b} disabled={b === toBrand}>{b}</option>)}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', fontSize: 13, color: '#444', gap: 4 }}>
          Hedef Marka (nereye)
          <select
            value={toMode === 'new' ? '__new__' : toBrand}
            onChange={e => {
              if (e.target.value === '__new__') { setToMode('new'); setToBrand(''); }
              else { setToMode('existing'); setToBrand(e.target.value); }
            }}
            style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14, minWidth: 220 }}
          >
            <option value="">Seçin...</option>
            {brands.map(b => <option key={b} value={b} disabled={b === fromBrand}>{b}</option>)}
            <option value="__new__">+ Yeni marka ekle...</option>
          </select>
          {toMode === 'new' && (
            <input
              autoFocus
              value={toBrand}
              onChange={e => setToBrand(e.target.value)}
              placeholder="Yeni marka adı"
              style={{ marginTop: 6, padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
            />
          )}
        </label>
      </div>

      {fromBrand && toBrand.trim() && (
        <>
          {(busy || result) && (
            <div style={{ marginBottom: 16 }}>
              {busy && (
                <div style={{ height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: 'rgb(255,82,82)', transition: 'width 0.2s' }} />
                </div>
              )}
              {busy
                ? <p style={{ fontSize: 13, color: '#555', margin: 0 }}>Taşınıyor... {progress}%</p>
                : <p style={{ fontSize: 13, color: '#15803d', margin: 0 }}>✓ {result}</p>}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Ürün adı veya kod ara..."
              style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13, width: 220 }}
            />
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }}>
              <option value="">Tüm Kategoriler</option>
              {categories.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: '#555', minWidth: 110 }}>
              {selected.size > 0 ? `${selected.size} ürün seçili` : `${filtered.length} ürün listelendi`}
            </span>
            <button className="admin-btn admin-btn-sm" onClick={() => setSelected(new Set(filtered.map(p => p.id)))}>
              Tümünü Seç ({filtered.length})
            </button>
            {selected.size > 0 && (
              <>
                <button className="admin-btn admin-btn-sm" onClick={() => setSelected(new Set())}>
                  Seçimi Temizle
                </button>
                <button className="admin-btn admin-btn-primary admin-btn-sm" disabled={busy} onClick={confirmSwap}>
                  {fromBrand} → {toBrand.trim()} olarak taşı ({selected.size})
                </button>
              </>
            )}
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}></th>
                  <th style={{ width: 60 }}>Görsel</th>
                  <th>Kod</th>
                  <th>Ürün Adı</th>
                  <th>Kategori</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const isSel = selected.has(p.id);
                  return (
                    <tr
                      key={p.id}
                      className={isSel ? 'admin-row-selected' : ''}
                      onClick={() => toggle(p.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={isSel} onChange={() => toggle(p.id)} />
                      </td>
                      <td>
                        {p.img
                          ? <img src={p.img} alt="" className="admin-product-thumb" />
                          : <span style={{ color: '#ccc' }}>—</span>}
                      </td>
                      <td className="admin-mono">{p.productCode || '—'}</td>
                      <td>{p.productName}</td>
                      <td style={{ fontSize: 12 }}>{catTitle.get(p.productType) || p.productType}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>"{fromBrand}" markasında bu filtreyle eşleşen ürün yok.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
