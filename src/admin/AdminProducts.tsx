import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Link, useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { fold } from '../searchFold.ts';
import type { Product } from '../types/firestore';

type ProductWithId = Product & { id: string };

export default function AdminProducts() {
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [categoryTitles, setCategoryTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  // Deep-link filters coming from the Markalar page (brand / category badge click)
  const brandFilter = searchParams.get('brand') || '';
  const typeFilter = searchParams.get('type') || '';

  const clearFilters = () => setSearchParams({});

  // Merge into whichever filter is already in the URL instead of replacing it
  // outright, so brand + category filters can be combined (badge clicks and
  // the dropdowns below both go through this).
  const setFilter = (key: 'brand' | 'type', value: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value); else next.delete(key);
      return next;
    });
  };
  const filterByBrand = (brand: string) => setFilter('brand', brand);
  const filterByType = (type: string) => setFilter('type', type || '(kategorisiz)');

  const load = async () => {
    setLoading(true);
    const [productsSnap, catsSnap] = await Promise.all([
      getDocs(collection(db, 'products')),
      getDocs(collection(db, 'categories')),
    ]);
    const data = productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProductWithId));
    data.sort((a, b) => a.productType.localeCompare(b.productType) || a.productCode.localeCompare(b.productCode));
    setProducts(data);
    const titles: Record<string, string> = {};
    catsSnap.docs.forEach(d => { titles[d.id] = (d.data().title as string) || d.id; });
    setCategoryTitles(titles);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (id: string, current: boolean) => {
    await updateDoc(doc(db, 'products', id), { isActive: !current });
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isActive: !current } : p));
  };

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`"${name}" ürününü silmek istediğinizden emin misiniz?`)) return;
    await deleteDoc(doc(db, 'products', id));
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const allBrands = useMemo(
    () => [...new Set(products.map(p => p.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr')),
    [products]
  );
  const hasUncategorized = useMemo(() => products.some(p => !p.productType), [products]);
  const allCategoryOptions = useMemo(() => {
    const opts = Object.entries(categoryTitles)
      .map(([slug, title]) => ({ slug, title }))
      .sort((a, b) => a.title.localeCompare(b.title, 'tr'));
    if (hasUncategorized) opts.push({ slug: '(kategorisiz)', title: 'Kategorisiz' });
    return opts;
  }, [categoryTitles, hasUncategorized]);

  const filtered = products.filter(p => {
    if (brandFilter && fold(p.brand) !== fold(brandFilter)) return false;
    if (typeFilter) {
      if (typeFilter === '(kategorisiz)') {
        if (p.productType) return false;
      } else if (p.productType !== typeFilter) {
        return false;
      }
    }
    if (!search) return true;
    return (
      fold(p.productName).includes(fold(search)) ||
      fold(p.productCode).includes(fold(search)) ||
      fold(p.brand).includes(fold(search))
    );
  });

  if (loading) return <div className="admin-page"><p>Yükleniyor...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Ürünler</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/admin/products/ocr-import" className="admin-btn">📷 Görsel ile Ürün Ekle</Link>
          <Link to="/admin/products/import" className="admin-btn">📊 Excel İçe Aktar</Link>
          <Link to="/admin/products/code-fix" className="admin-btn">🔧 Kod Düzelt</Link>
          <Link to="/admin/products/new" className="admin-btn admin-btn-primary">+ Yeni Ürün</Link>
        </div>
      </div>

      {(brandFilter || typeFilter) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: '#666' }}>Filtre:</span>
          <span
            style={{
              background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
              borderRadius: 999, padding: '2px 10px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            {brandFilter}
            {typeFilter && ` · ${categoryTitles[typeFilter] || (typeFilter === '(kategorisiz)' ? 'Kategorisiz' : typeFilter)}`}
            <button
              onClick={clearFilters}
              title="Filtreyi kaldır"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1d4ed8', fontWeight: 700, lineHeight: 1, padding: 0 }}
            >
              ×
            </button>
          </span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <input
          type="text"
          className="admin-search"
          placeholder="Ürün adı, kod veya marka ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 2, minWidth: 220, marginBottom: 0 }}
        />
        <select
          value={brandFilter}
          onChange={e => filterByBrand(e.target.value)}
          className="admin-search"
          style={{ flex: 1, minWidth: 160, marginBottom: 0 }}
        >
          <option value="">Tüm Markalar</option>
          {allBrands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select
          value={typeFilter}
          onChange={e => setFilter('type', e.target.value)}
          className="admin-search"
          style={{ flex: 1, minWidth: 160, marginBottom: 0 }}
        >
          <option value="">Tüm Kategoriler</option>
          {allCategoryOptions.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}
        </select>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Görsel</th>
              <th>Kod</th>
              <th>Ürün Adı</th>
              <th>Marka</th>
              <th>Kategori</th>
              <th>Fiyat (TRY)</th>
              <th>Aktif</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(product => (
              <tr key={product.id} className={product.isActive ? '' : 'admin-row-inactive'}>
                <td>
                  <img src={product.img} alt={product.productCode} className="admin-product-thumb" />
                </td>
                <td className="admin-mono">{product.productCode}</td>
                <td>{product.productName}</td>
                <td>
                  <button
                    onClick={() => filterByBrand(product.brand)}
                    title={`"${product.brand}" markasına göre filtrele`}
                    style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', textAlign: 'left' }}
                  >
                    {product.brand}
                  </button>
                </td>
                <td>
                  <button
                    onClick={() => filterByType(product.productType)}
                    title={`"${categoryTitles[product.productType] || product.productType}" kategorisine göre filtrele`}
                    style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', textAlign: 'left' }}
                  >
                    {categoryTitles[product.productType] || product.productType}
                  </button>
                </td>
                <td>
                  <PriceCell productId={product.id} price={product.price} onSaved={newPrice =>
                    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, price: newPrice } : p))
                  } />
                </td>
                <td>
                  <button
                    className={`admin-toggle ${product.isActive ? 'admin-toggle-on' : 'admin-toggle-off'}`}
                    onClick={() => toggleActive(product.id, product.isActive)}
                    title={product.isActive ? 'Gizle' : 'Göster'}
                  >
                    {product.isActive ? 'Aktif' : 'Pasif'}
                  </button>
                </td>
                <td>
                  <div className="admin-actions">
                    <Link to={`/admin/products/${product.id}/edit`} className="admin-btn admin-btn-sm">Düzenle</Link>
                    <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => deleteProduct(product.id, product.productName)}>Sil</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PriceCell({ productId, price, onSaved }: { productId: string; price: number; onSaved: (p: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(price));

  const save = async () => {
    const n = parseFloat(val);
    if (isNaN(n)) return;
    await updateDoc(doc(db, 'products', productId), { price: n });
    onSaved(n);
    setEditing(false);
  };

  if (!editing) {
    return (
      <button className="admin-price-display" onClick={() => { setVal(String(price)); setEditing(true); }}>
        {price === 0 ? <span className="admin-price-zero">Fiyat yok</span> : `${price.toLocaleString('tr-TR')} ₺`}
      </button>
    );
  }

  return (
    <div className="admin-price-edit">
      <input type="number" value={val} onChange={e => setVal(e.target.value)} className="admin-price-input" autoFocus onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }} />
      <button className="admin-btn admin-btn-sm" onClick={save}>Kaydet</button>
    </div>
  );
}
