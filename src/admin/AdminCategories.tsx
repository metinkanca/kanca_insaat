import { useEffect, useState } from 'react';
import { collection, getDocs, setDoc, deleteDoc, updateDoc, doc, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { mergeUnits, unitLabel, type UnitOption } from '../units';

type Category = { id: string; slug: string; title: string; img: string; order: number };

const EMPTY_FORM = { title: '', img: '', order: 0 };

// Per-category rollup of the unit assigned to its products on the Birim Ayarla
// page — informational only, not editable from here. A unit slug, or 'karışık'
// when the category's products don't agree on one.
type UnitInfo = string | null;

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<UnitOption[]>(mergeUnits([]));
  const [unitByCategory, setUnitByCategory] = useState<Map<string, UnitInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    const [catSnap, prodSnap, unitSnap] = await Promise.all([
      getDocs(query(collection(db, 'categories'), orderBy('order'))),
      getDocs(collection(db, 'products')),
      getDocs(collection(db, 'units')),
    ]);
    setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    setUnits(mergeUnits(unitSnap.docs.map(d => ({ slug: d.id, label: (d.data().label as string) || d.id }))));

    const unitsByType = new Map<string, Set<string>>();
    prodSnap.docs.forEach(d => {
      const data = d.data();
      const unit = data.unit as string | undefined;
      if (!unit) return;
      const set = unitsByType.get(data.productType) || new Set<string>();
      set.add(unit);
      unitsByType.set(data.productType, set);
    });
    const rollup = new Map<string, UnitInfo>();
    unitsByType.forEach((units, type) => {
      rollup.set(type, units.size > 1 ? 'karışık' : ([...units][0] as UnitInfo));
    });
    setUnitByCategory(rollup);

    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setAdd = (field: string, value: any) => setAddForm(prev => ({ ...prev, [field]: value }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!addForm.title.trim()) { setError('Başlık zorunludur.'); return; }
    setSaving(true);
    try {
      const slug = addForm.title.trim().toLowerCase().replace(/\s+/g, '_');
      await setDoc(doc(db, 'categories', slug), {
        slug,
        title: addForm.title.trim(),
        img: addForm.img.trim(),
        order: Number(addForm.order) || 0,
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

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" kategorisini silmek istediğinizden emin misiniz?`)) return;
    await deleteDoc(doc(db, 'categories', id));
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleUpdate = async (id: string, field: string, value: any) => {
    await updateDoc(doc(db, 'categories', id), { [field]: value });
    setCategories(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  if (loading) return <div className="admin-page"><p>Yükleniyor...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Kategoriler</h2>
        <button className="admin-btn admin-btn-primary" onClick={() => { setShowAdd(!showAdd); setError(''); }}>
          {showAdd ? 'İptal' : '+ Yeni Kategori'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="admin-inline-form">
          <div className="admin-inline-form-grid">
            <label>
              Başlık
              <input value={addForm.title} onChange={e => setAdd('title', e.target.value)} placeholder="Isı Pompaları" required />
            </label>
            <label>
              Görsel URL
              <input value={addForm.img} onChange={e => setAdd('img', e.target.value)} placeholder="/images/..." />
            </label>
            <label>
              Sıra
              <input type="number" value={addForm.order} onChange={e => setAdd('order', e.target.value)} min={0} />
            </label>
          </div>
          {error && <p className="admin-error" style={{ marginBottom: 8 }}>{error}</p>}
          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
            {saving ? 'Kaydediliyor...' : 'Ekle'}
          </button>
        </form>
      )}

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Sıra</th>
              <th>Başlık</th>
              <th>Görsel</th>
              <th>Birim</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id}>
                <td>
                  <EditableCell value={String(cat.order)} onSave={v => handleUpdate(cat.id, 'order', Number(v))} />
                </td>
                <td>
                  <EditableCell value={cat.title} onSave={v => handleUpdate(cat.id, 'title', v)} />
                </td>
                <td>
                  <EditableCell value={cat.img} onSave={v => handleUpdate(cat.id, 'img', v)} />
                </td>
                <td style={{ fontSize: 12, color: '#666' }}>
                  {(() => {
                    const info = unitByCategory.get(cat.id);
                    if (!info) return <span style={{ color: '#bbb' }}>—</span>;
                    if (info === 'karışık') return <span title="Bu kategorideki ürünler farklı birimlere sahip">Karışık</span>;
                    return unitLabel(units, info);
                  })()}
                </td>
                <td>
                  <button
                    className="admin-btn admin-btn-sm admin-btn-danger"
                    onClick={() => handleDelete(cat.id, cat.title)}
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
  );
}

function EditableCell({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  if (!editing) {
    return (
      <span
        style={{ cursor: 'pointer', borderBottom: '1px dashed #ccc', paddingBottom: 1 }}
        title="Düzenlemek için tıklayın"
        onClick={() => { setVal(value); setEditing(true); }}
      >
        {value || <span style={{ color: '#bbb' }}>—</span>}
      </span>
    );
  }

  return (
    <input
      autoFocus
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={() => { onSave(val); setEditing(false); }}
      onKeyDown={e => {
        if (e.key === 'Enter') { onSave(val); setEditing(false); }
        if (e.key === 'Escape') setEditing(false);
      }}
      style={{ padding: '3px 6px', border: '1px solid rgb(255,82,82)', borderRadius: 4, fontSize: 13, outline: 'none', width: '100%', minWidth: 80 }}
    />
  );
}
