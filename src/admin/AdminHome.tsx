import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import AdminImageUpload from './AdminImageUpload';
import AdminShowcaseEditor, {
  KIND_LABELS, brandOptionsFrom, brandNameOptionsFrom, tileProblem,
  type CategoryOption, type ProductOption,
} from './AdminShowcaseEditor';
import type { HomeShowcaseTile } from '../types/firestore';

interface HomeConfig {
  sliderImages: string[];
  popularProductIds: string[];
  showcaseTiles: HomeShowcaseTile[];
}

const EMPTY_TILE: HomeShowcaseTile = { kind: 'category', refId: '' };

// Firestore caps a document at 1 MiB and uploaded pictures are stored inline
// as base64, so warn well before the save would be rejected.
const DOC_WARN_BYTES = 900 * 1024;

const FALLBACK_POPULAR_IDS = [
  'kaloriferli_pelet_sobasi__Daiwa__DP-30F',
  'kaloriferli_pelet_sobasi__Daiwa__DP-22F',
];

const IMAGE_GROUPS: { label: string; images: string[] }[] = [
  {
    label: 'Slider Görselleri',
    images: [
      '/images/main_page_slider_images/eca_kombi.png',
      '/images/main_page_slider_images/pelet_kazani.png',
      '/images/main_page_slider_images/kalorifer_sobasi.png',
      '/images/main_page_slider_images/kas_rubini_botti.png',
    ],
  },
  {
    label: 'Ürün Görselleri',
    images: [
      '/images/products_page_images/eca_kombi.png',
      '/images/products_page_images/daiwa_kaloriferli_pelet_sobasi.png',
      '/images/products_page_images/daiwa_kati_yakitli_kalorifer_sobasi.png',
      '/images/products_page_images/daiwa_kati_yakitli_kazan.png',
      '/images/products_page_images/daiwa_kati_yakitli_soba.png',
      '/images/products_page_images/daiwa_pelet_kazani.png',
      '/images/products_page_images/daiwa_uflemeli_pelet_sobasi.png',
      '/images/products_page_images/daiwa_isi_pompasi.webp',
      '/images/products_page_images/baymak_boyler.png',
      '/images/products_page_images/baymak_buffer_tank.png',
      '/images/products_page_images/baymak_elektrikli_termosifon.png',
      '/images/products_page_images/baymak_isi_pompasi.jpg',
      '/images/products_page_images/baymak_sirkulasyon_pompasi.png',
      '/images/products_page_images/baymak_termoboyler.png',
      '/images/products_page_images/kentas_hidrofor.png',
    ],
  },
];

function basename(url: string) {
  return url.split('/').pop() ?? url;
}

export default function AdminHome() {
  const [config, setConfig] = useState<HomeConfig>({ sliderImages: [], popularProductIds: [], showcaseTiles: [] });
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<HomeShowcaseTile>(EMPTY_TILE);
  const [draftError, setDraftError] = useState('');
  const [editingTile, setEditingTile] = useState<number | null>(null);
  const [quickTab, setQuickTab] = useState<'category' | 'brandAll' | 'product'>('category');
  const [quickSearch, setQuickSearch] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    // Fetch homeConfig independently — if the collection has no rules yet this
    // throws a permissions error, but products should still load.
    getDoc(doc(db, 'homeConfig', 'main'))
      .then(snap => {
        if (snap.exists()) {
          const data = snap.data() as Partial<HomeConfig>;
          // Older documents predate the showcase, so fill in every array.
          setConfig({
            sliderImages: data.sliderImages ?? [],
            popularProductIds: data.popularProductIds ?? [],
            showcaseTiles: data.showcaseTiles ?? [],
          });
        } else {
          setConfig(c => ({ ...c, popularProductIds: FALLBACK_POPULAR_IDS }));
        }
      })
      .catch(() => {
        setConfig(c => ({ ...c, popularProductIds: FALLBACK_POPULAR_IDS }));
      });

    getDocs(collection(db, 'products'))
      .then(snap => {
        const prods = snap.docs.map(d => ({
          id: d.id,
          productName: d.data().productName || '',
          img: d.data().img || '',
          brand: d.data().brand || '',
          productType: d.data().productType || '',
          productCode: d.data().productCode || '',
        }));
        prods.sort((a, b) => a.productName.localeCompare(b.productName, 'tr'));
        setProducts(prods);
        setLoadingProducts(false);
      })
      .catch(() => setLoadingProducts(false));

    getDocs(query(collection(db, 'categories'), orderBy('order')))
      .then(snap => setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as CategoryOption))))
      .catch(() => setCategories([]));
  }, []);

  const save = async () => {
    const broken = config.showcaseTiles.findIndex(t => tileProblem(t));
    if (broken !== -1) {
      setSaveError(`Vitrin butonu ${broken + 1}: ${tileProblem(config.showcaseTiles[broken])}`);
      setEditingTile(broken);
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      await setDoc(doc(db, 'homeConfig', 'main'), config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setSaveError(e.message || 'Kayıt başarısız. Firestore kurallarını kontrol edin.');
    } finally {
      setSaving(false);
    }
  };

  // Slider actions
  const addImage = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed || config.sliderImages.includes(trimmed)) return;
    setConfig(c => ({ ...c, sliderImages: [...c.sliderImages, trimmed] }));
    setNewImageUrl('');
  };

  const removeImage = (i: number) =>
    setConfig(c => ({ ...c, sliderImages: c.sliderImages.filter((_, j) => j !== i) }));

  const moveImage = (i: number, dir: -1 | 1) => {
    const arr = [...config.sliderImages];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setConfig(c => ({ ...c, sliderImages: arr }));
  };

  // Showcase tile actions
  const hasTile = (kind: HomeShowcaseTile['kind'], refId: string) =>
    config.showcaseTiles.some(t => t.kind === kind && t.refId === refId);

  // Quick picks toggle a plain button (no custom name/picture) for a target.
  const toggleTile = (kind: HomeShowcaseTile['kind'], refId: string) => {
    setConfig(c => ({
      ...c,
      showcaseTiles: c.showcaseTiles.some(t => t.kind === kind && t.refId === refId)
        ? c.showcaseTiles.filter(t => !(t.kind === kind && t.refId === refId))
        : [...c.showcaseTiles, { kind, refId }],
    }));
    setEditingTile(null);
  };

  const addTile = () => {
    const problem = tileProblem(draft);
    if (problem) { setDraftError(problem); return; }
    setConfig(c => ({ ...c, showcaseTiles: [...c.showcaseTiles, { ...draft, refId: draft.refId.trim() }] }));
    setDraft({ kind: draft.kind, refId: '' });
    setDraftError('');
  };

  const removeTile = (i: number) => {
    setConfig(c => ({ ...c, showcaseTiles: c.showcaseTiles.filter((_, j) => j !== i) }));
    setEditingTile(null);
  };

  const moveTile = (i: number, dir: -1 | 1) => {
    const arr = [...config.showcaseTiles];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setConfig(c => ({ ...c, showcaseTiles: arr }));
    if (editingTile === i) setEditingTile(j);
    else if (editingTile === j) setEditingTile(i);
  };

  const replaceTile = (i: number, next: HomeShowcaseTile) =>
    setConfig(c => ({ ...c, showcaseTiles: c.showcaseTiles.map((t, j) => (j === i ? next : t)) }));

  // Popular product actions
  const toggleProduct = (id: string) =>
    setConfig(c => ({
      ...c,
      popularProductIds: c.popularProductIds.includes(id)
        ? c.popularProductIds.filter(x => x !== id)
        : [...c.popularProductIds, id],
    }));

  const removePopular = (id: string) =>
    setConfig(c => ({ ...c, popularProductIds: c.popularProductIds.filter(x => x !== id) }));

  const movePopular = (i: number, dir: -1 | 1) => {
    const arr = [...config.popularProductIds];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setConfig(c => ({ ...c, popularProductIds: arr }));
  };

  const filtered = search
    ? products.filter(p =>
        p.productName.toLowerCase().includes(search.toLowerCase()) ||
        p.brand.toLowerCase().includes(search.toLowerCase()) ||
        p.productCode.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  const brands = useMemo(() => brandOptionsFrom(products), [products]);
  const brandNames = useMemo(() => brandNameOptionsFrom(products), [products]);

  const quickQuery = quickSearch.toLowerCase();
  const quickItems: { refId: string; name: string; img: string; meta: string }[] =
    quickTab === 'category'
      ? categories
          .filter(c => !quickQuery || (c.title || '').toLowerCase().includes(quickQuery))
          .map(c => ({ refId: c.id, name: c.title || c.id, img: c.img?.[0] || '', meta: 'Kategori' }))
      : quickTab === 'brandAll'
      ? brandNames
          .filter(b => !quickQuery || b.brand.toLowerCase().includes(quickQuery))
          .map(b => ({ refId: b.brand, name: b.brand, img: b.img, meta: `Marka · ${b.count} ürün` }))
      : products
          .filter(p => !quickQuery ||
            p.productName.toLowerCase().includes(quickQuery) ||
            p.brand.toLowerCase().includes(quickQuery) ||
            p.productCode.toLowerCase().includes(quickQuery))
          .slice(0, 60)
          .map(p => ({ refId: p.id, name: p.productName || p.productCode, img: p.img, meta: p.brand }));
  const categoryTitle = (slug: string) =>
    categories.find(c => c.id === slug || c.slug === slug)?.title || slug;

  // Resolve each button to the default label/image the public grid falls back
  // to, plus a one-line description of where it leads.
  const tilePreview = (t: HomeShowcaseTile) => {
    if (!t.refId) return { title: '', img: '', meta: KIND_LABELS[t.kind], missing: false };
    if (t.kind === 'category') {
      const c = categories.find(x => x.id === t.refId || x.slug === t.refId);
      return {
        title: c?.title || t.refId,
        img: c?.img?.[0] || '',
        meta: `Kategori · /products/${c?.slug || t.refId}`,
        missing: categories.length > 0 && !c,
      };
    }
    if (t.kind === 'brandAll') {
      const b = brandNames.find(x => x.brand === t.refId);
      return {
        title: t.refId,
        img: b?.img || '',
        meta: `Marka · tüm ürünleri (/products?marka=${t.refId})`,
        missing: !loadingProducts && !b,
      };
    }
    if (t.kind === 'brand') {
      const b = brands.find(x => x.ref === t.refId);
      const [type, brand] = t.refId.split('/');
      const catTitle = categoryTitle(type);
      return {
        title: catTitle !== type ? `${brand} ${catTitle}` : brand,
        img: b?.img || '',
        meta: `Marka · ${brand} / ${catTitle}`,
        missing: !loadingProducts && !b,
      };
    }
    if (t.kind === 'product') {
      const p = products.find(x => x.id === t.refId);
      return {
        title: p?.productName || p?.productCode || t.refId,
        img: p?.img || '',
        meta: p?.brand ? `Ürün · ${p.brand} · ${p.productCode}` : 'Ürün',
        missing: !loadingProducts && !p,
      };
    }
    return { title: '', img: '', meta: `Bağlantı · ${t.refId}`, missing: false };
  };

  const configBytes = useMemo(() => new Blob([JSON.stringify(config)]).size, [config]);

  const popularProducts = config.popularProductIds
    .map(id => products.find(p => p.id === id))
    .filter(Boolean) as ProductOption[];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Ana Sayfa Düzeni</h2>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <button className="admin-btn admin-btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Kaydediliyor...' : saved ? '✓ Kaydedildi' : 'Kaydet'}
          </button>
          {saveError && <p className="admin-error" style={{ margin: 0, fontSize: 12, maxWidth: 300, textAlign: 'right' }}>{saveError}</p>}
        </div>
      </div>

      {/* ── Slider images ── */}
      <div className="admin-home-section">
        <h3 className="admin-home-section-title">Slider Görselleri</h3>

        <div className="admin-home-image-list">
          {config.sliderImages.length === 0 && (
            <p className="admin-empty">Henüz görsel eklenmedi.</p>
          )}
          {config.sliderImages.map((url, i) => (
            <div key={i} className="admin-home-image-row">
              <img src={url} className="admin-home-thumb" alt="" />
              <span className="admin-home-image-url">{basename(url)}</span>
              <div className="admin-actions">
                <button className="admin-btn admin-btn-sm" onClick={() => moveImage(i, -1)} disabled={i === 0}>↑</button>
                <button className="admin-btn admin-btn-sm" onClick={() => moveImage(i, 1)} disabled={i === config.sliderImages.length - 1}>↓</button>
                <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => removeImage(i)}>Sil</button>
              </div>
            </div>
          ))}
        </div>

        {/* Add image row */}
        <div className="admin-home-add-row">
          <input
            value={newImageUrl}
            onChange={e => setNewImageUrl(e.target.value)}
            placeholder="URL girin veya cihazdan yükleyin..."
            onKeyDown={e => e.key === 'Enter' && addImage(newImageUrl)}
          />
          <button className="admin-btn admin-btn-primary" onClick={() => addImage(newImageUrl)}>Ekle</button>
          <AdminImageUpload folder="slider" onUploaded={url => addImage(url)} label="Cihazdan Yükle" />
          <button
            className="admin-btn"
            onClick={() => setShowImagePicker(v => !v)}
          >
            {showImagePicker ? 'Galeriyi Kapat' : '🖼 Galeriden Seç'}
          </button>
        </div>

        {/* Image gallery picker */}
        {showImagePicker && (
          <div className="admin-home-image-picker">
            {IMAGE_GROUPS.map(group => (
              <div key={group.label}>
                <p className="admin-home-picker-group-label">{group.label}</p>
                <div className="admin-home-gallery-grid">
                  {group.images.map(url => {
                    const already = config.sliderImages.includes(url);
                    return (
                      <div
                        key={url}
                        className={`admin-home-gallery-item${already ? ' selected' : ''}`}
                        onClick={() => already ? removeImage(config.sliderImages.indexOf(url)) : addImage(url)}
                        title={basename(url)}
                      >
                        <img src={url} alt={basename(url)} />
                        {already && <span className="admin-home-pick-check">✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Showcase grid ── */}
      <div className="admin-home-section">
        <h3 className="admin-home-section-title">Ana Sayfa Vitrini</h3>
        <p className="admin-home-section-hint">
          Ana sayfanın en üstündeki butonlar. Her butonun adını, görselini ve tıklanınca nereye
          gideceğini (kategori, marka sayfası, ürün veya özel bağlantı) siz belirlersiniz. Butonlar
          ekrana sığdığı kadar yan yana dizilir, sığmayanlar alt satıra geçer; sıra buradaki
          sıralamayla aynıdır. Hiç buton yoksa ilk 12 kategori otomatik gösterilir.
        </p>

        {/* Existing buttons */}
        {config.showcaseTiles.length === 0 ? (
          <p className="admin-empty">Henüz buton eklenmedi — aşağıdaki formdan oluşturun.</p>
        ) : (
          <div className="admin-home-popular-list">
            {config.showcaseTiles.map((t, i) => {
              const preview = tilePreview(t);
              const img = t.img || preview.img;
              const editing = editingTile === i;
              const problem = tileProblem(t);
              return (
                <div key={i} className={`admin-home-tile-row${editing ? ' editing' : ''}`}>
                  <div className="admin-home-tile-main">
                    {img
                      ? <img src={img} className="admin-home-thumb" alt="" />
                      : <div className="admin-home-thumb admin-home-pick-placeholder" />
                    }
                    <div className="admin-home-popular-info">
                      <span className="admin-home-popular-name">
                        {t.label || preview.title || '(adsız)'}
                        {preview.missing && <span className="admin-home-tile-missing"> (hedef bulunamadı)</span>}
                        {problem && <span className="admin-home-tile-missing"> ({problem})</span>}
                      </span>
                      <span className="admin-home-popular-meta">{preview.meta}</span>
                    </div>
                    <div className="admin-actions">
                      <button className="admin-btn admin-btn-sm" onClick={() => moveTile(i, -1)} disabled={i === 0}>↑</button>
                      <button className="admin-btn admin-btn-sm" onClick={() => moveTile(i, 1)} disabled={i === config.showcaseTiles.length - 1}>↓</button>
                      <button
                        className={`admin-btn admin-btn-sm${editing ? ' admin-btn-primary' : ''}`}
                        onClick={() => setEditingTile(editing ? null : i)}
                      >
                        {editing ? 'Bitti' : 'Düzenle'}
                      </button>
                      <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => removeTile(i)}>Sil</button>
                    </div>
                  </div>
                  {editing && (
                    <AdminShowcaseEditor
                      value={t}
                      onChange={next => replaceTile(i, next)}
                      categories={categories}
                      brands={brands}
                      brandNames={brandNames}
                      products={products}
                      loadingProducts={loadingProducts}
                      defaultLabel={preview.title}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Quick picks — one click adds a ready-made button (click again to remove) */}
        <div className="admin-showcase-new">
          <p className="admin-home-picker-group-label" style={{ marginTop: 0 }}>Hızlı Ekle</p>
          <div className="admin-home-tabs">
            {([
              ['category', 'Kategoriler'],
              ['brandAll', 'Markalar'],
              ['product', 'Ürünler'],
            ] as const).map(([tab, label]) => (
              <button
                key={tab}
                className={`admin-btn admin-btn-sm${quickTab === tab ? ' admin-btn-primary' : ''}`}
                onClick={() => setQuickTab(tab)}
              >
                {label}
              </button>
            ))}
          </div>

          <input
            className="admin-search"
            style={{ maxWidth: '100%', margin: '12px 0' }}
            value={quickSearch}
            onChange={e => setQuickSearch(e.target.value)}
            placeholder={
              quickTab === 'category' ? 'Kategori ara...'
                : quickTab === 'brandAll' ? 'Marka ara...'
                : 'Ürün ara (ad, marka, kod)...'
            }
          />

          {quickTab !== 'category' && loadingProducts ? (
            <p style={{ color: '#888', fontSize: 13 }}>Yükleniyor...</p>
          ) : quickItems.length === 0 ? (
            <p className="admin-empty">Aramanızla eşleşen sonuç yok.</p>
          ) : (
            <div className="admin-home-product-grid">
              {quickItems.map(item => {
                const selected = hasTile(quickTab, item.refId);
                return (
                  <div
                    key={item.refId}
                    className={`admin-home-product-item${selected ? ' selected' : ''}`}
                    onClick={() => toggleTile(quickTab, item.refId)}
                  >
                    {selected && <span className="admin-home-pick-check">✓</span>}
                    {item.img
                      ? <img src={item.img} className="admin-home-pick-thumb" alt="" />
                      : <div className="admin-home-pick-thumb admin-home-pick-placeholder" />
                    }
                    <span className="admin-home-pick-name">{item.name}</span>
                    <span className="admin-home-pick-meta">{item.meta}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* New button form */}
        <div className="admin-showcase-new">
          <p className="admin-home-picker-group-label" style={{ marginTop: 0 }}>Özel Buton Oluştur</p>
          <AdminShowcaseEditor
            value={draft}
            onChange={next => { setDraft(next); setDraftError(''); }}
            categories={categories}
            brands={brands}
            brandNames={brandNames}
            products={products}
            loadingProducts={loadingProducts}
            defaultLabel={tilePreview(draft).title}
          />
          <div className="admin-showcase-new-actions">
            {draftError && <span className="admin-error" style={{ margin: 0, fontSize: 12 }}>{draftError}</span>}
            <button className="admin-btn admin-btn-primary" onClick={addTile}>+ Butonu Ekle</button>
          </div>
        </div>

        {configBytes > DOC_WARN_BYTES && (
          <p className="admin-error" style={{ fontSize: 12.5 }}>
            Ana sayfa ayarları {(configBytes / 1024).toFixed(0)} KB'a ulaştı (sınır 1024 KB). Cihazdan
            yüklenen görseller ayarların içinde saklanır — bazılarını kaldırın veya URL ile verin,
            yoksa kayıt reddedilir.
          </p>
        )}
        <p className="admin-home-section-hint" style={{ margin: '12px 0 0' }}>
          Değişiklikler sayfanın üstündeki <strong>Kaydet</strong> ile yayına alınır.
        </p>
      </div>

      {/* ── Popular products ── */}
      <div className="admin-home-section">
        <h3 className="admin-home-section-title">Popüler Ürünler</h3>

        {/* Currently selected */}
        {popularProducts.length > 0 && (
          <div className="admin-home-popular-list">
            {popularProducts.map((p, i) => (
              <div key={p.id} className="admin-home-popular-row">
                {p.img && <img src={p.img} className="admin-home-thumb" alt="" />}
                <div className="admin-home-popular-info">
                  <span className="admin-home-popular-name">{p.productName || p.productCode}</span>
                  <span className="admin-home-popular-meta">{p.brand} · {p.productCode}</span>
                </div>
                <div className="admin-actions">
                  <button className="admin-btn admin-btn-sm" onClick={() => movePopular(i, -1)} disabled={i === 0}>↑</button>
                  <button className="admin-btn admin-btn-sm" onClick={() => movePopular(i, 1)} disabled={i === popularProducts.length - 1}>↓</button>
                  <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => removePopular(p.id)}>Çıkar</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Product picker */}
        <div className="admin-home-picker">
          <p style={{ margin: '0 0 10px', fontSize: 13, color: '#666' }}>
            Eklemek için ürüne tıklayın — seçili olanlar kaldırmak için tekrar tıklayın:
          </p>
          <input
            className="admin-search"
            style={{ maxWidth: '100%', marginBottom: 12 }}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ürün ara (ad, marka, kod)..."
          />

          {loadingProducts ? (
            <p style={{ color: '#888', fontSize: 13 }}>Ürünler yükleniyor...</p>
          ) : products.length === 0 ? (
            <p style={{ color: '#888', fontSize: 13 }}>Ürün bulunamadı. Önce ürün ekleyin.</p>
          ) : (
            <div className="admin-home-product-grid">
              {filtered.slice(0, 60).map(p => {
                const selected = config.popularProductIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    className={`admin-home-product-item${selected ? ' selected' : ''}`}
                    onClick={() => toggleProduct(p.id)}
                  >
                    {selected && <span className="admin-home-pick-check">✓</span>}
                    {p.img
                      ? <img src={p.img} className="admin-home-pick-thumb" alt="" />
                      : <div className="admin-home-pick-thumb admin-home-pick-placeholder" />
                    }
                    <span className="admin-home-pick-name">{p.productName || p.productCode}</span>
                    <span className="admin-home-pick-meta">{p.brand}</span>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <p className="admin-empty" style={{ gridColumn: '1/-1' }}>Aramanızla eşleşen ürün yok.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
