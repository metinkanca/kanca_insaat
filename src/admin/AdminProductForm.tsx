import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import type { OcrExtractResult } from './ocrExtract';
import AdminImageUpload from './AdminImageUpload';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import type { Product } from '../types/firestore';

type SpecGroup = { title: string; values: string[] };

function rowsToGroups(listTitle: string[], listValue: string[]): SpecGroup[] {
  const groups: SpecGroup[] = [];
  listTitle.forEach((t, i) => {
    const v = listValue[i] ?? '';
    if (t.trim() || groups.length === 0) {
      groups.push({ title: t, values: [v] });
    } else {
      groups[groups.length - 1].values.push(v);
    }
  });
  return groups;
}

function groupsToRows(groups: SpecGroup[]): { listTitle: string[]; listValue: string[] } {
  const listTitle: string[] = [];
  const listValue: string[] = [];
  groups
    .filter(g => g.title.trim() || g.values.some(v => v.trim()))
    .forEach(g => {
      g.values.forEach((v, i) => {
        listTitle.push(i === 0 ? g.title.trim() : '');
        listValue.push(v.trim());
      });
    });
  return { listTitle, listValue };
}

const EMPTY: Omit<Product, 'isActive'> = {
  productType: '',
  productCode: '',
  productName: '',
  brand: '',
  depth: '',
  width: '',
  height: '',
  listTitle: [],
  listValue: [],
  img: '',
  price: 0,
  logo: '',
  dealerLink: '',
  listeAdi: '',
};

function makeId(productType: string, brand: string, productCode: string) {
  return `${productType}__${brand}__${productCode}`.replace(/\s+/g, '_');
}

export default function AdminProductForm() {
  const { productId } = useParams();
  const isEdit = !!productId;
  const navigate = useNavigate();
  const location = useLocation();
  const ocrData = (location.state as any)?.ocrData as OcrExtractResult | undefined;

  const [form, setForm] = useState<Omit<Product, 'isActive'> & { isActive: boolean }>({
    ...EMPTY,
    ...(ocrData ? {
      productCode: ocrData.productCode || '',
      productName: ocrData.productName || '',
      brand: ocrData.brand || '',
      price: ocrData.price || 0,
      depth: ocrData.depth || '',
      width: ocrData.width || '',
      height: ocrData.height || '',
    } : {}),
    isActive: true,
  });
  const [specGroups, setSpecGroups] = useState<SpecGroup[]>(
    ocrData?.specRows
      ? ocrData.specRows.map(r => ({ title: r.title, values: [r.value] }))
      : []
  );
  const [categories, setCategories] = useState<{ slug: string; title: string }[]>([]);
  const [allBrands, setAllBrands] = useState<string[]>([]);
  const [brandLogos, setBrandLogos] = useState<Record<string, string>>({});
  const [brandMode, setBrandMode] = useState<'existing' | 'new'>('existing');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetches: Promise<any>[] = [
      getDocs(collection(db, 'categories')),
      getDocs(collection(db, 'brandGroups')),
    ];
    if (isEdit) fetches.push(getDoc(doc(db, 'products', productId!)));

    Promise.all(fetches).then(([catsSnap, brandsSnap, productSnap]) => {
      const cats = catsSnap.docs.map((d: any) => ({ slug: d.id, title: (d.data().title as string) || d.id }));
      cats.sort((a: any, b: any) => a.title.localeCompare(b.title, 'tr'));
      setCategories(cats);

      // brandGroups only holds a handful of legacy cover-image docs, so it misses
      // most real brands — show it merged with the brands the products actually use.
      const groupBrands = (brandsSnap.docs.map((d: any) => (d.data().brand as string || '').trim())
        .filter(Boolean)) as string[];
      setAllBrands([...new Set(groupBrands)].sort((a, b) => a.localeCompare(b, 'tr')));

      let editBrand = '';
      if (isEdit && productSnap?.exists()) {
        const data = productSnap.data() as Product;
        setForm({ ...data, isActive: data.isActive ?? true });
        setSpecGroups(rowsToGroups(data.listTitle || [], data.listValue || []));
        editBrand = (data.brand || '').trim();
      }
      setLoading(false);

      // Product brands + brand→logo map. Loaded separately so the form renders
      // before the (large) products collection finishes downloading.
      getDocs(collection(db, 'products')).then(prodSnap => {
        const logos: Record<string, string> = {};
        const all = new Set(groupBrands);
        prodSnap.docs.forEach(d => {
          const b = ((d.data().brand as string) || '').trim();
          const l = d.data().logo as string;
          if (b) all.add(b);
          if (b && l && !logos[b]) logos[b] = l;
        });
        setBrandLogos(logos);
        setAllBrands([...all].sort((a, b) => a.localeCompare(b, 'tr')));
        if (editBrand && !all.has(editBrand)) setBrandMode('new');
      });
    });
  }, [productId]);

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const updateGroupTitle = (gi: number, title: string) =>
    setSpecGroups(prev => prev.map((g, i) => i === gi ? { ...g, title } : g));

  const updateGroupValue = (gi: number, vi: number, value: string) =>
    setSpecGroups(prev => prev.map((g, i) => i === gi
      ? { ...g, values: g.values.map((v, j) => j === vi ? value : v) }
      : g));

  const addGroupValue = (gi: number) =>
    setSpecGroups(prev => prev.map((g, i) => i === gi ? { ...g, values: [...g.values, ''] } : g));

  const removeGroupValue = (gi: number, vi: number) =>
    setSpecGroups(prev => prev.map((g, i) => i === gi
      ? { ...g, values: g.values.filter((_, j) => j !== vi) }
      : g).filter(g => g.values.length > 0));

  const removeGroup = (gi: number) =>
    setSpecGroups(prev => prev.filter((_, i) => i !== gi));

  const addGroup = () =>
    setSpecGroups(prev => [...prev, { title: '', values: [''] }]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { listTitle, listValue } = groupsToRows(specGroups);

      const data: Product = { ...form, listTitle, listValue };

      if (isEdit) {
        await updateDoc(doc(db, 'products', productId!), data as any);
      } else {
        const id = makeId(data.productType, data.brand, data.productCode);
        await setDoc(doc(db, 'products', id), { ...data, isActive: true });
      }
      navigate('/admin/products');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-page"><p>Yükleniyor...</p></div>;

  return (
    <div className="admin-page">
      <h2 className="admin-page-title">{isEdit ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</h2>

      <form onSubmit={submit} className="admin-form">
        <div className="admin-form-grid">
          <label>
            Kategori (Ürün Tipi)
            <select value={form.productType} onChange={e => set('productType', e.target.value)} required>
              <option value="">Seçin...</option>
              {categories.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}
            </select>
          </label>
          <label>
            Marka
            <select
              value={brandMode === 'new' ? '__new__' : form.brand}
              onChange={e => {
                if (e.target.value === '__new__') {
                  setBrandMode('new');
                  set('brand', '');
                } else {
                  setBrandMode('existing');
                  set('brand', e.target.value);
                  // Auto-fill logo from existing products of this brand
                  const knownLogo = brandLogos[e.target.value];
                  if (knownLogo) set('logo', knownLogo);
                }
              }}
              required={brandMode === 'existing'}
            >
              <option value="">Seçin...</option>
              {allBrands.map(b => <option key={b} value={b}>{b}</option>)}
              <option value="__new__">+ Yeni marka ekle...</option>
            </select>
            {brandMode === 'new' && (
              <input
                autoFocus
                value={form.brand}
                onChange={e => set('brand', e.target.value)}
                placeholder="Yeni marka adı"
                required
                style={{ marginTop: 6 }}
              />
            )}
          </label>
          <label>
            Ürün Kodu
            <input value={form.productCode} onChange={e => set('productCode', e.target.value)} required placeholder="DW-10" />
          </label>
          <label>
            Ürün Adı
            <input value={form.productName} onChange={e => set('productName', e.target.value)} required placeholder="DW-10 Isı Pompası" />
          </label>
          <label>
            Fiyat (TRY)
            <input type="number" value={form.price} onChange={e => set('price', parseFloat(e.target.value) || 0)} min={0} step={0.01} />
          </label>
          <label>
            Görsel URL
            <input value={form.img} onChange={e => set('img', e.target.value)} placeholder="/images/brands_page_images/..." />
            <AdminImageUpload folder="products" onUploaded={url => set('img', url)} label="Görsel Yükle" />
          </label>
          <label>
            Dealer Link
            <input value={form.dealerLink ?? ''} onChange={e => set('dealerLink', e.target.value)} placeholder="https://..." />
          </label>
          <label>
            Liste Adı
            <input value={form.listeAdi ?? ''} onChange={e => set('listeAdi', e.target.value)} placeholder="Fiyat listesi adı (ör: Fiyat Listesi 2024-A)" />
          </label>
          <label>
            Derinlik (mm)
            <input value={form.depth} onChange={e => set('depth', e.target.value)} placeholder="590" />
          </label>
          <label>
            Genişlik (mm)
            <input value={form.width} onChange={e => set('width', e.target.value)} placeholder="550" />
          </label>
          <label>
            Yükseklik (mm)
            <input value={form.height} onChange={e => set('height', e.target.value)} placeholder="1210" />
          </label>
        </div>

        <div className="admin-form-full">
          <span style={{ fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 8, display: 'block' }}>
            Özellikler
          </span>
          {specGroups.map((group, gi) => (
            <div key={gi} className="admin-spec-group">
              <div className="admin-spec-group-header">
                <input
                  className="admin-spec-group-title"
                  placeholder="Başlık (ör: Isı Gücü)"
                  value={group.title}
                  onChange={e => updateGroupTitle(gi, e.target.value)}
                />
                <button
                  type="button"
                  className="admin-btn admin-btn-sm admin-btn-danger"
                  onClick={() => removeGroup(gi)}
                >
                  Grubu Sil
                </button>
              </div>
              <div className="admin-spec-values">
                {group.values.map((val, vi) => (
                  <div key={vi} className="admin-spec-value-row">
                    <input
                      placeholder="Değer (ör: 25 kW)"
                      value={val}
                      onChange={e => updateGroupValue(gi, vi, e.target.value)}
                    />
                    {group.values.length > 1 && (
                      <button
                        type="button"
                        className="admin-btn admin-btn-sm admin-btn-danger"
                        onClick={() => removeGroupValue(gi, vi)}
                      >
                        −
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="admin-btn admin-btn-sm"
                  onClick={() => addGroupValue(gi)}
                  style={{ alignSelf: 'flex-start', marginTop: 4 }}
                >
                  + Alt Değer
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="admin-btn admin-btn-sm admin-specs-add-btn"
            onClick={addGroup}
          >
            + Özellik Ekle
          </button>
        </div>

        {isEdit && (
          <label className="admin-form-checkbox">
            <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
            Aktif (sitede görünsün)
          </label>
        )}

        {error && <p className="admin-error">{error}</p>}

        <div className="admin-form-actions">
          <button type="button" className="admin-btn" onClick={() => navigate('/admin/products')}>İptal</button>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
            {saving ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Ekle'}
          </button>
        </div>
      </form>
    </div>
  );
}
