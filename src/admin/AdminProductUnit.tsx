import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { fold } from '../searchFold.ts';
import type { Product } from '../types/firestore';
import { mergeUnits, unitLabel, unitSlug, canDeleteUnit, type UnitOption } from '../units';

type ProductWithId = Product & { id: string };

export default function AdminProductUnit() {
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [categories, setCategories] = useState<{ slug: string; title: string }[]>([]);
  const [units, setUnits] = useState<UnitOption[]>(mergeUnits([]));
  const [loading, setLoading] = useState(true);

  const [productType, setProductType] = useState('');
  const [targetUnit, setTargetUnit] = useState('metre');

  const [showAddUnit, setShowAddUnit] = useState(false);
  const [newUnit, setNewUnit] = useState('');
  const [unitError, setUnitError] = useState('');
  const [savingUnit, setSavingUnit] = useState(false);

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState('');

  const load = async () => {
    setLoading(true);
    const [prodSnap, catSnap, unitSnap] = await Promise.all([
      getDocs(collection(db, 'products')),
      getDocs(collection(db, 'categories')),
      getDocs(collection(db, 'units')),
    ]);
    setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProductWithId)));
    setCategories(catSnap.docs
      .map(d => ({ slug: d.id, title: (d.data().title as string) || d.id }))
      .sort((a, b) => a.title.localeCompare(b.title, 'tr')));
    setUnits(mergeUnits(unitSnap.docs.map(d => ({ slug: d.id, label: (d.data().label as string) || d.id }))));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const typeProducts = useMemo(
    () => products.filter(p => p.productType === productType),
    [products, productType]
  );

  const filtered = useMemo(() => {
    const q = fold(search);
    if (!q) return typeProducts;
    return typeProducts.filter(p => fold(p.productName).includes(q) || fold(p.productCode).includes(q));
  }, [typeProducts, search]);

  // Reset the picker whenever the category changes.
  useEffect(() => {
    setSelected(new Set());
    setSearch('');
    setResult('');
  }, [productType]);

  const toggle = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const addUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnitError('');
    const label = newUnit.trim();
    if (!label) { setUnitError('Birim adı zorunludur.'); return; }
    const slug = unitSlug(label);
    if (units.some(u => u.slug === slug)) { setUnitError(`"${label}" birimi zaten var.`); return; }

    setSavingUnit(true);
    try {
      await setDoc(doc(db, 'units', slug), { slug, label });
      setUnits(prev => mergeUnits([...prev, { slug, label }]));
      setTargetUnit(slug);
      setNewUnit('');
      setShowAddUnit(false);
    } catch (err: any) {
      setUnitError(err.message);
    } finally {
      setSavingUnit(false);
    }
  };

  // Only admin-added units can be removed, and only once no product uses them —
  // otherwise those products would be left pointing at a unit that's gone.
  const deleteUnit = async (slug: string) => {
    const label = unitLabel(units, slug);
    const inUse = products.filter(p => p.unit === slug).length;
    if (inUse > 0) {
      alert(`"${label}" birimi ${inUse} üründe kullanılıyor. Önce o ürünlere başka bir birim atayın.`);
      return;
    }
    if (!confirm(`"${label}" birimi silinsin mi?`)) return;
    await deleteDoc(doc(db, 'units', slug));
    setUnits(prev => prev.filter(u => u.slug !== slug));
    setTargetUnit('adet');
  };

  const applyUnit = async () => {
    if (selected.size === 0) return;
    const label = unitLabel(units, targetUnit);
    if (!confirm(`Seçili ${selected.size} ürünün birimi "${label}" olarak ayarlanacak. Devam edilsin mi?`)) return;

    const ids = [...selected];
    setBusy(true);
    setProgress(0);
    setResult('');
    let ok = 0, fail = 0;
    for (let i = 0; i < ids.length; i++) {
      try {
        await updateDoc(doc(db, 'products', ids[i]), { unit: targetUnit });
        ok++;
      } catch { fail++; }
      setProgress(Math.round(((i + 1) / ids.length) * 100));
    }
    setProducts(prev => prev.map(p => ids.includes(p.id) ? { ...p, unit: targetUnit } : p));
    setSelected(new Set());
    setBusy(false);
    setResult(`${ok} ürünün birimi "${label}" olarak ayarlandı${fail ? `, ${fail} başarısız` : ''}.`);
  };

  if (loading) return <div className="admin-page"><p>Yükleniyor...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Birim Ayarla</h2>
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => { setShowAddUnit(!showAddUnit); setUnitError(''); }}
        >
          {showAddUnit ? 'İptal' : '+ Yeni Birim'}
        </button>
      </div>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: '#666' }}>
        Bir kategori seçin, o kategorideki ürünlerden seçtiğiniz birimle satılacakları işaretleyip onaylayın.
        Listede olmayan bir birim için "+ Yeni Birim" ile kendi biriminizi ekleyebilirsiniz.
      </p>

      {showAddUnit && (
        <form onSubmit={addUnit} className="admin-inline-form">
          <div className="admin-inline-form-grid">
            <label>
              Birim Adı
              <input
                autoFocus
                value={newUnit}
                onChange={e => setNewUnit(e.target.value)}
                placeholder="Kutu, Paket, Kilogram..."
                required
              />
            </label>
          </div>
          {unitError && <p className="admin-error" style={{ marginBottom: 8 }}>{unitError}</p>}
          <button type="submit" className="admin-btn admin-btn-primary" disabled={savingUnit}>
            {savingUnit ? 'Kaydediliyor...' : 'Ekle'}
          </button>
        </form>
      )}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 20 }}>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: 13, color: '#444', gap: 4 }}>
          Kategori
          <select
            value={productType}
            onChange={e => setProductType(e.target.value)}
            style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14, minWidth: 220 }}
          >
            <option value="">Seçin...</option>
            {categories.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', fontSize: 13, color: '#444', gap: 4 }}>
          Hedef Birim
          <select
            value={targetUnit}
            onChange={e => setTargetUnit(e.target.value)}
            style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14, minWidth: 220 }}
          >
            {units.map(u => <option key={u.slug} value={u.slug}>{u.label}</option>)}
          </select>
        </label>

        {canDeleteUnit(targetUnit) && (
          <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => deleteUnit(targetUnit)}>
            Bu birimi sil
          </button>
        )}
      </div>

      {productType && (
        <>
          {(busy || result) && (
            <div style={{ marginBottom: 16 }}>
              {busy && (
                <div style={{ height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: 'rgb(255,82,82)', transition: 'width 0.2s' }} />
                </div>
              )}
              {busy
                ? <p style={{ fontSize: 13, color: '#555', margin: 0 }}>Uygulanıyor... {progress}%</p>
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
                <button className="admin-btn admin-btn-primary admin-btn-sm" disabled={busy} onClick={applyUnit}>
                  Birimi "{unitLabel(units, targetUnit)}" yap ({selected.size})
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
                  <th>Mevcut Birim</th>
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
                      <td style={{ fontSize: 12 }}>{p.unit ? unitLabel(units, p.unit) : <span style={{ color: '#bbb' }}>—</span>}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>Bu kategoride bu filtreyle eşleşen ürün yok.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
