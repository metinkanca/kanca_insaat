import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { compressImage } from './imageUtils';
import { fold, slugify } from '../searchFold.ts';
import type { Product } from '../types/firestore';

type ProductWithId = Product & { id: string };
type FileMatch = { file: File; base: string; matches: ProductWithId[] };

const PAGE_SIZE = 100;

// Loose code comparison: "102 126 747" should match file "102126747.jpg"
const codeKey = (s: string) => fold(s).replace(/[\s._-]/g, '');

export default function AdminBulkImages() {
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [categories, setCategories] = useState<{ slug: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Section A: select & assign one image
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [onlyMissing, setOnlyMissing] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<'img' | 'brand' | 'code' | 'name' | 'category'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const assignInputRef = useRef<HTMLInputElement>(null);

  // Drag-select / keyboard traversal (mirrors the Excel import's category step)
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const rowsRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const didDragRef = useRef(false);
  const dragStartRef = useRef<number | null>(null);
  const dragStartIdRef = useRef<string | null>(null);
  const dragBaseRef = useRef<Set<string>>(new Set());

  // Section B: filename matching
  const [fileMatches, setFileMatches] = useState<FileMatch[]>([]);

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

  const catTitle = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach(c => m.set(c.slug, c.title));
    return m;
  }, [categories]);

  const filtered = useMemo(() => {
    const q = fold(search);
    const list = products.filter(p => {
      if (onlyMissing && p.img) return false;
      if (typeFilter && p.productType !== typeFilter) return false;
      if (brandFilter && p.brand !== brandFilter) return false;
      if (q && !fold(p.productName).includes(q) && !fold(p.productCode).includes(q)) return false;
      return true;
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    const key = (p: ProductWithId) => {
      switch (sortKey) {
        case 'img': return p.img ? 1 : 0;
        case 'brand': return p.brand || '';
        case 'code': return p.productCode || '';
        case 'category': return catTitle.get(p.productType) || p.productType || '';
        default: return p.productName || '';
      }
    };
    return [...list].sort((a, b) => {
      const ka = key(a), kb = key(b);
      if (typeof ka === 'number' && typeof kb === 'number') return (ka - kb) * dir;
      return String(ka).localeCompare(String(kb), 'tr') * dir;
    });
  }, [products, search, typeFilter, brandFilter, onlyMissing, sortKey, sortDir, catTitle]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  // Fixed-width slot so the arrow appearing/disappearing never reflows the header row.
  const sortArrow = (key: typeof sortKey) => (
    <span style={{ display: 'inline-block', width: 14, opacity: sortKey === key ? 1 : 0 }}>
      {sortKey === key && sortDir === 'desc' ? '▼' : '▲'}
    </span>
  );

  useEffect(() => { setPage(0); }, [search, typeFilter, brandFilter, onlyMissing, sortKey, sortDir]);
  useEffect(() => { setActiveIdx(null); }, [page]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Global mouseup ends a drag; a press with no drag is a plain click → toggle.
  useEffect(() => {
    const up = () => {
      if (!isDraggingRef.current) return;
      if (!didDragRef.current && dragStartIdRef.current) {
        const id = dragStartIdRef.current;
        setSelected(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id); else next.add(id);
          return next;
        });
      }
      isDraggingRef.current = false;
    };
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  const onRowMouseDown = (i: number, e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    didDragRef.current = false;
    dragStartRef.current = i;
    dragStartIdRef.current = pageRows[i].id;
    dragBaseRef.current = new Set(selected);
    setActiveIdx(i);
    // preventScroll: focusing must NOT scroll the table into view — that scroll
    // would slide rows under a stationary cursor and fire spurious mouseenter
    // events, turning a plain click into a range-select.
    rowsRef.current?.focus({ preventScroll: true });
  };

  const onRowMouseEnter = (i: number) => {
    // Only extend while the primary button is genuinely held down.
    if (!isDraggingRef.current || dragStartRef.current === null) return;
    didDragRef.current = true;
    const start = dragStartRef.current;
    const min = Math.min(start, i), max = Math.max(start, i);
    const next = new Set(dragBaseRef.current);
    for (let k = min; k <= max; k++) next.add(pageRows[k].id);
    setSelected(next);
    setActiveIdx(i);
  };

  // Click a row, then Shift+↑/↓ extends the selection across a range.
  const onRowsKeyDown = (e: React.KeyboardEvent) => {
    if (activeIdx === null || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
    e.preventDefault();
    const dir = e.key === 'ArrowDown' ? 1 : -1;
    const next = Math.min(pageRows.length - 1, Math.max(0, activeIdx + dir));
    if (e.shiftKey) {
      setSelected(prev => {
        const s = new Set(prev);
        for (let k = Math.min(activeIdx, next); k <= Math.max(activeIdx, next); k++) s.add(pageRows[k].id);
        return s;
      });
    }
    setActiveIdx(next);
    rowsRef.current?.querySelector(`[data-idx="${next}"]`)?.scrollIntoView({ block: 'nearest' });
  };

  const writeImage = async (ids: string[], base64: string, doneMsgPrefix: string) => {
    setBusy(true);
    setProgress(0);
    setResult('');
    let ok = 0, fail = 0;
    for (let i = 0; i < ids.length; i++) {
      try {
        await updateDoc(doc(db, 'products', ids[i]), { img: base64 });
        ok++;
      } catch { fail++; }
      setProgress(Math.round(((i + 1) / ids.length) * 100));
    }
    setProducts(prev => prev.map(p => ids.includes(p.id) ? { ...p, img: base64 } : p));
    setBusy(false);
    setResult(`${doneMsgPrefix}: ${ok} ürün güncellendi${fail ? `, ${fail} başarısız` : ''}.`);
    return ok;
  };

  const assignToSelected = async (file: File) => {
    if (selected.size === 0) return;
    let base64: string;
    try {
      base64 = await compressImage(file);
    } catch (e: any) { alert(e.message); return; }
    if (!confirm(`Bu görsel seçili ${selected.size} ürüne uygulanacak. Devam edilsin mi?`)) return;
    await writeImage([...selected], base64, 'Toplu atama');
    setSelected(new Set());
  };

  // Ctrl+Shift+S (Windows Snipping Tool) puts the screenshot on the clipboard;
  // pasting here (Ctrl+V) assigns it straight to the selected rows, no file dialog needed.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (busy || selected.size === 0) return;
      const item = Array.from(e.clipboardData?.items || []).find(it => it.type.startsWith('image/'));
      if (!item) return;
      e.preventDefault();
      const file = item.getAsFile();
      if (file) assignToSelected(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [busy, selected]);

  // ── Filename matching ──────────────────────────────────────────────────────

  const matchFiles = (files: FileList) => {
    setResult('');
    const list: FileMatch[] = [];
    for (const file of Array.from(files)) {
      const base = file.name.replace(/\.[^.]+$/, '').trim();
      const ck = codeKey(base);
      const ns = slugify(base);
      let matches = products.filter(p => p.productCode && codeKey(p.productCode) === ck);
      if (!matches.length && ns) {
        matches = products.filter(p => slugify(p.productName) === ns);
      }
      list.push({ file, base, matches });
    }
    list.sort((a, b) => (b.matches.length ? 1 : 0) - (a.matches.length ? 1 : 0));
    setFileMatches(list);
  };

  const uploadMatched = async () => {
    const usable = fileMatches.filter(m => m.matches.length > 0);
    if (!usable.length) return;
    const totalProducts = usable.reduce((s, m) => s + m.matches.length, 0);
    if (!confirm(`${usable.length} dosya, ${totalProducts} ürüne eşleşti. Yüklensin mi?`)) return;

    setBusy(true);
    setProgress(0);
    setResult('');
    let ok = 0, fail = 0;
    for (let i = 0; i < usable.length; i++) {
      try {
        const base64 = await compressImage(usable[i].file);
        for (const p of usable[i].matches) {
          try {
            await updateDoc(doc(db, 'products', p.id), { img: base64 });
            ok++;
          } catch { fail++; }
        }
        const ids = usable[i].matches.map(p => p.id);
        setProducts(prev => prev.map(p => ids.includes(p.id) ? { ...p, img: base64 } : p));
      } catch { fail += usable[i].matches.length; }
      setProgress(Math.round(((i + 1) / usable.length) * 100));
    }
    setBusy(false);
    setFileMatches([]);
    setResult(`Dosya eşleştirme: ${ok} ürün güncellendi${fail ? `, ${fail} başarısız` : ''}.`);
  };

  if (loading) return <div className="admin-page"><p>Yükleniyor...</p></div>;

  const missingCount = products.filter(p => !p.img).length;
  const unmatchedCount = fileMatches.filter(m => !m.matches.length).length;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Toplu Görsel</h2>
        <span style={{ fontSize: 13, color: '#888' }}>
          {missingCount} ürünün görseli yok ({products.length} üründen)
        </span>
      </div>

      {(busy || result) && (
        <div style={{ marginBottom: 16 }}>
          {busy && (
            <div style={{ height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'rgb(255,82,82)', transition: 'width 0.2s' }} />
            </div>
          )}
          {busy
            ? <p style={{ fontSize: 13, color: '#555', margin: 0 }}>Yükleniyor... {progress}%</p>
            : <p style={{ fontSize: 13, color: '#15803d', margin: 0 }}>✓ {result}</p>}
        </div>
      )}

      {/* ── Section A: one image to many products ─────────────────────────── */}
      <div className="admin-form" style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 6px' }}>Seçerek Ata</h3>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#666' }}>
          Aynı görseli paylaşacak ürünleri seçin (örn. bir ürünün tüm ölçüleri), sonra tek görsel yükleyin.
          Satıra tıklayarak seçin; birden fazla satır için sürükleyin veya bir satıra tıklayıp <kbd>Shift</kbd> + <kbd>↑</kbd>/<kbd>↓</kbd> ile aralık seçin.
        </p>

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
          <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }}>
            <option value="">Tüm Markalar</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <label style={{ fontSize: 13, color: '#555', display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={onlyMissing} onChange={e => setOnlyMissing(e.target.checked)} />
            Sadece görselsizler
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: '#555', minWidth: 110 }}>
            {selected.size > 0 ? `${selected.size} ürün seçili` : `${filtered.length} ürün listelendi`}
          </span>
          <button className="admin-btn admin-btn-sm"
            onClick={() => setSelected(new Set(filtered.map(p => p.id)))}>
            Tümünü Seç ({filtered.length})
          </button>
          {selected.size > 0 && (
            <>
              <button className="admin-btn admin-btn-sm" onClick={() => setSelected(new Set())}>
                Seçimi Temizle
              </button>
              <button className="admin-btn admin-btn-primary admin-btn-sm"
                disabled={busy}
                onClick={() => assignInputRef.current?.click()}>
                📁 Seçilenlere Görsel Yükle
              </button>
              <span style={{ fontSize: 12, color: '#888' }}>
                veya ekran görüntüsü alıp <kbd>Ctrl</kbd>+<kbd>V</kbd> yapıştırın
              </span>
            </>
          )}
          <input
            ref={assignInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) assignToSelected(f); e.target.value = ''; }}
          />
        </div>

        {pageCount > 1 && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
            <button className="admin-btn admin-btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹ Önceki</button>
            <span style={{ fontSize: 13, color: '#555' }}>Sayfa {page + 1} / {pageCount}</span>
            <button className="admin-btn admin-btn-sm" disabled={page >= pageCount - 1} onClick={() => setPage(p => p + 1)}>Sonraki ›</button>
          </div>
        )}

        <div
          className="admin-table-wrapper"
          style={{ userSelect: 'none', outline: 'none' }}
          ref={rowsRef}
          tabIndex={0}
          onKeyDown={onRowsKeyDown}
        >
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 60, cursor: 'pointer' }} onClick={() => toggleSort('img')}>
                  Görsel{sortArrow('img')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('brand')}>
                  Marka{sortArrow('brand')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('code')}>
                  Kod{sortArrow('code')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('name')}>
                  Ürün Adı{sortArrow('name')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('category')}>
                  Kategori{sortArrow('category')}
                </th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((p, i) => {
                const isSel = selected.has(p.id);
                return (
                  <tr
                    key={p.id}
                    data-idx={i}
                    className={isSel ? 'admin-row-selected' : ''}
                    onMouseDown={e => onRowMouseDown(i, e)}
                    onMouseEnter={() => onRowMouseEnter(i)}
                    style={{
                      cursor: 'pointer',
                      outline: isSel ? '2px solid #3b82f6' : i === activeIdx ? '2px dashed #93c5fd' : undefined,
                      outlineOffset: '-2px',
                    }}
                  >
                    <td>
                      {p.img
                        ? <img src={p.img} alt="" className="admin-product-thumb" />
                        : <span style={{ color: '#ccc' }}>—</span>}
                    </td>
                    <td>{p.brand}</td>
                    <td className="admin-mono">{p.productCode || '—'}</td>
                    <td>{p.productName}</td>
                    <td style={{ fontSize: 12 }}>{catTitle.get(p.productType) || p.productType}</td>
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>Filtreye uyan ürün yok.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section B: filename matching ──────────────────────────────────── */}
      <div className="admin-form">
        <h3 style={{ margin: '0 0 6px' }}>Dosya Adıyla Eşleştir</h3>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#666' }}>
          Görselleri ürün koduna göre adlandırın (örn. <code>7011050045.jpg</code>) veya ürün adını kullanın,
          sonra hepsini birden seçin. Kod boşlukları ve tire/nokta farkları önemsenmez.
        </p>

        <input
          type="file"
          accept="image/*"
          multiple
          disabled={busy}
          onChange={e => { if (e.target.files?.length) matchFiles(e.target.files); e.target.value = ''; }}
        />

        {fileMatches.length > 0 && (
          <>
            <p style={{ fontSize: 13, margin: '14px 0 8px' }}>
              <strong>{fileMatches.length - unmatchedCount}</strong> dosya eşleşti
              {unmatchedCount > 0 && <span style={{ color: '#b91c1c' }}>, {unmatchedCount} dosya eşleşmedi</span>}.
            </p>
            <div className="admin-table-wrapper" style={{ marginBottom: 14, maxHeight: 320, overflowY: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr><th>Dosya</th><th>Eşleşen Ürün</th><th>Durum</th></tr>
                </thead>
                <tbody>
                  {fileMatches.map((m, i) => (
                    <tr key={i}>
                      <td className="admin-mono" style={{ fontSize: 12 }}>{m.file.name}</td>
                      <td>
                        {m.matches.length
                          ? m.matches.map(p => `${p.productName} (${p.brand})`).join(', ')
                          : <span style={{ color: '#bbb' }}>—</span>}
                      </td>
                      <td>
                        {m.matches.length
                          ? <span style={{ color: '#15803d', fontSize: 13 }}>✓ {m.matches.length} ürün</span>
                          : <span style={{ color: '#b91c1c', fontSize: 13 }}>Eşleşmedi</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              className="admin-btn admin-btn-primary"
              disabled={busy || fileMatches.length === unmatchedCount}
              onClick={uploadMatched}
            >
              Eşleşen {fileMatches.length - unmatchedCount} Dosyayı Yükle
            </button>
          </>
        )}
      </div>
    </div>
  );
}
