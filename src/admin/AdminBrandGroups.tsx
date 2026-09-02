import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import type { BrandGroup, Product } from '../types/firestore';

type BrandGroupWithId = BrandGroup & { id: string };

// Live overview derived from the products collection
type BrandSummary = {
  brand: string;
  total: number;
  inactive: number;
  types: { slug: string; title: string; count: number }[];
};

const EMPTY_FORM = { productType: '', brand: '', productName: '', img: '' };

function makeId(productType: string, brand: string) {
  return `${productType}__${brand}`.replace(/\s+/g, '_');
}

export default function AdminBrandGroups() {
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [groups, setGroups] = useState<BrandGroupWithId[]>([]);
  const [categories, setCategories] = useState<{ slug: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showLegacy, setShowLegacy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    const [prodSnap, groupsSnap, catsSnap] = await Promise.all([
      getDocs(collection(db, 'products')),
      getDocs(collection(db, 'brandGroups')),
      getDocs(collection(db, 'categories')),
    ]);

    const cats = catsSnap.docs
      .map(d => ({ slug: d.id, title: (d.data().title as string) || d.id }))
      .sort((a, b) => a.title.localeCompare(b.title, 'tr'));
    const catTitle = new Map(cats.map(c => [c.slug, c.title]));

    // Aggregate live counts: brand -> productType -> count
    const byBrand = new Map<string, { total: number; inactive: number; types: Map<string, number> }>();
    prodSnap.docs.forEach(d => {
      const p = d.data() as Product;
      const brand = (p.brand || '').trim() || '(Markasız)';
      if (!byBrand.has(brand)) byBrand.set(brand, { total: 0, inactive: 0, types: new Map() });
      const entry = byBrand.get(brand)!;
      entry.total++;
      if (p.isActive === false) entry.inactive++;
      const t = p.productType || '(kategorisiz)';
      entry.types.set(t, (entry.types.get(t) || 0) + 1);
    });

    const summaries: BrandSummary[] = [...byBrand.entries()]
      .map(([brand, v]) => ({
        brand,
        total: v.total,
        inactive: v.inactive,
        types: [...v.types.entries()]
          .map(([slug, count]) => ({ slug, title: catTitle.get(slug) || slug, count }))
          .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, 'tr')),
      }))
      .sort((a, b) => b.total - a.total || a.brand.localeCompare(b.brand, 'tr'));

    const gs = groupsSnap.docs.map(d => ({ id: d.id, ...d.data() } as BrandGroupWithId));
    gs.sort((a, b) => a.productType.localeCompare(b.productType) || a.brand.localeCompare(b.brand));

    setBrands(summaries);
    setGroups(gs);
    setCategories(cats);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr');
    if (!q) return brands;
    return brands.filter(b => b.brand.toLocaleLowerCase('tr').includes(q));
  }, [brands, search]);

  const setAdd = (field: string, value: string) => setAddForm(prev => ({ ...prev, [field]: value }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!addForm.productType || !addForm.brand.trim()) {
      setError('Ürün tipi ve marka zorunludur.');
      return;
    }
    setSaving(true);
    try {
      const id = makeId(addForm.productType, addForm.brand.trim());
      await setDoc(doc(db, 'brandGroups', id), {
        productType: addForm.productType,
        brand: addForm.brand.trim(),
        productName: addForm.productName.trim(),
        img: addForm.img.trim(),
        productCode: [],
      });
      setAddForm(EMPTY_FORM);
      setShowAdd(false);
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, brand: string) => {
    if (!confirm(`"${brand}" vitrin kartını silmek istediğinizden emin misiniz?`)) return;
    await deleteDoc(doc(db, 'brandGroups', id));
    setGroups(prev => prev.filter(g => g.id !== id));
  };

  if (loading) return <div className="admin-page"><p>Yükleniyor...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Markalar</h2>
        <span style={{ fontSize: 13, color: '#888' }}>
          {brands.length} marka · {brands.reduce((s, b) => s + b.total, 0)} ürün
        </span>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Marka ara..."
        style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14, width: 280, marginBottom: 16 }}
      />

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Marka</th>
              <th style={{ width: 110 }}>Toplam Ürün</th>
              <th>Kategorilere Dağılım</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(b => (
              <tr key={b.brand}>
                <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                  <Link
                    to={`/admin/products?brand=${encodeURIComponent(b.brand)}`}
                    title={`${b.brand} ürünlerini Ürünler sayfasında göster`}
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    {b.brand}
                  </Link>
                </td>
                <td>
                  {b.total}
                  {b.inactive > 0 && (
                    <span style={{ color: '#b45309', fontSize: 12 }}> ({b.inactive} pasif)</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {b.types.map(t => (
                      <Link
                        key={t.slug}
                        to={`/admin/products?brand=${encodeURIComponent(b.brand)}&type=${encodeURIComponent(t.slug)}`}
                        title={`${b.brand} · ${t.title} ürünlerini Ürünler sayfasında göster`}
                        style={{
                          background: t.slug === '(kategorisiz)' ? '#fef2f2' : '#f1f5f9',
                          color: t.slug === '(kategorisiz)' ? '#b91c1c' : '#334155',
                          border: '1px solid ' + (t.slug === '(kategorisiz)' ? '#fecaca' : '#e2e8f0'),
                          borderRadius: 999, padding: '2px 10px', fontSize: 12, whiteSpace: 'nowrap',
                          textDecoration: 'none', cursor: 'pointer',
                        }}
                      >
                        {t.title} · <strong>{t.count}</strong>
                      </Link>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={3} style={{ textAlign: 'center', color: '#888' }}>Marka bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Legacy brandGroups: these docs supply the cover image/title of the
          brand cards on the public category pages — kept editable here. */}
      <div style={{ marginTop: 28 }}>
        <button className="admin-btn admin-btn-sm" onClick={() => setShowLegacy(v => !v)}>
          {showLegacy ? 'Vitrin Kartlarını Gizle ▲' : `Vitrin Kartları (${groups.length}) ▼`}
        </button>
      </div>

      {showLegacy && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px' }}>
            Bu kartlar sitedeki kategori sayfalarında marka kutusunun görselini ve başlığını belirler.
            Kartı olmayan markalar için site, ürünlerden otomatik kart üretir.
          </p>
          <button className="admin-btn admin-btn-primary" onClick={() => { setShowAdd(!showAdd); setError(''); }}>
            {showAdd ? 'İptal' : '+ Yeni Vitrin Kartı'}
          </button>

          {showAdd && (
            <form onSubmit={handleAdd} className="admin-inline-form" style={{ marginTop: 12 }}>
              <div className="admin-inline-form-grid">
                <label>
                  Ürün Tipi (Kategori)
                  <select value={addForm.productType} onChange={e => setAdd('productType', e.target.value)} required>
                    <option value="">Seçin...</option>
                    {categories.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}
                  </select>
                </label>
                <label>
                  Marka Adı
                  <input value={addForm.brand} onChange={e => setAdd('brand', e.target.value)} placeholder="Daiwa" required />
                </label>
                <label>
                  Ürün Adı (genel)
                  <input value={addForm.productName} onChange={e => setAdd('productName', e.target.value)} placeholder="Isı Pompası" />
                </label>
                <label>
                  Görsel URL
                  <input value={addForm.img} onChange={e => setAdd('img', e.target.value)} placeholder="/images/..." />
                </label>
              </div>
              {error && <p className="admin-error" style={{ marginBottom: 8 }}>{error}</p>}
              <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                {saving ? 'Kaydediliyor...' : 'Ekle'}
              </button>
            </form>
          )}

          <div className="admin-table-wrapper" style={{ marginTop: 12 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ürün Tipi</th>
                  <th>Marka</th>
                  <th>Ürün Adı</th>
                  <th>Görsel</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(g => (
                  <tr key={g.id}>
                    <td className="admin-mono">{g.productType}</td>
                    <td>{g.brand}</td>
                    <td>{g.productName}</td>
                    <td>
                      {g.img?.[0]
                        ? <img src={g.img[0]} alt={g.brand} className="admin-product-thumb" />
                        : <span style={{ color: '#bbb' }}>—</span>
                      }
                    </td>
                    <td>
                      <button
                        className="admin-btn admin-btn-sm admin-btn-danger"
                        onClick={() => handleDelete(g.id, g.brand)}
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
