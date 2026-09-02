import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import AdminImageUpload from './AdminImageUpload';
import type { Category, HomeShowcaseTile } from '../types/firestore';

interface HomeConfig {
  sliderImages: string[];
  popularProductIds: string[];
  showcaseTiles: HomeShowcaseTile[];
}

type CategoryOption = Category & { id: string };

interface ProductOption {
  id: string;
  productName: string;
  img: string;
  brand: string;
  productType: string;
  productCode: string;
}

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
  const [showcaseTab, setShowcaseTab] = useState<'category' | 'product'>('category');
  const [showcaseSearch, setShowcaseSearch] = useState('');
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
  const tileKey = (t: HomeShowcaseTile) => `${t.kind}:${t.refId}`;

  const toggleTile = (kind: HomeShowcaseTile['kind'], refId: string) =>
    setConfig(c => ({
      ...c,
      showcaseTiles: c.showcaseTiles.some(t => t.kind === kind && t.refId === refId)
        ? c.showcaseTiles.filter(t => !(t.kind === kind && t.refId === refId))
        : [...c.showcaseTiles, { kind, refId }],
    }));

  const removeTile = (i: number) =>
    setConfig(c => ({ ...c, showcaseTiles: c.showcaseTiles.filter((_, j) => j !== i) }));

  const moveTile = (i: number, dir: -1 | 1) => {
    const arr = [...config.showcaseTiles];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setConfig(c => ({ ...c, showcaseTiles: arr }));
  };

  // Blank label/image means "use the referenced product or category's own",
  // so an emptied field is dropped rather than saved as an empty string.
  const updateTile = (i: number, patch: Partial<HomeShowcaseTile>) =>
    setConfig(c => ({
      ...c,
      showcaseTiles: c.showcaseTiles.map((t, j) => {
        if (j !== i) return t;
        const next: HomeShowcaseTile = { ...t, ...patch };
        if (!next.label) delete next.label;
        if (!next.img) delete next.img;
        return next;
      }),
    }));

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

  // Resolve each tile to the label/image the public grid will actually render.
  const tilePreview = (t: HomeShowcaseTile) => {
    if (t.kind === 'category') {
      const c = categories.find(x => x.id === t.refId || x.slug === t.refId);
      return { title: c?.title || t.refId, img: c?.img?.[0] || '', meta: 'Kategori', missing: !c };
    }
    const p = products.find(x => x.id === t.refId);
    return {
      title: p?.productName || p?.productCode || t.refId,
      img: p?.img || '',
      meta: p?.brand ? `Ürün · ${p.brand}` : 'Ürün',
      missing: !p,
    };
  };

  const showcaseQuery = showcaseSearch.toLowerCase();
  const showcaseCategories = showcaseQuery
    ? categories.filter(c => (c.title || '').toLowerCase().includes(showcaseQuery))
    : categories;
  const showcaseProducts = showcaseQuery
    ? products.filter(p =>
        p.productName.toLowerCase().includes(showcaseQuery) ||
        p.brand.toLowerCase().includes(showcaseQuery) ||
        p.productCode.toLowerCase().includes(showcaseQuery)
      )
    : products;

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
          Ana sayfanın en üstündeki kutucuk ızgarası. Kategori veya ürün seçin; sıra buradaki
          sıralamayla aynıdır. Hiç seçim yapılmazsa ilk 12 kategori otomatik gösterilir.
        </p>

        {/* Currently selected tiles */}
        {config.showcaseTiles.length === 0 ? (
          <p className="admin-empty">Henüz kutucuk eklenmedi — aşağıdan seçin.</p>
        ) : (
          <div className="admin-home-popular-list">
            {config.showcaseTiles.map((t, i) => {
              const preview = tilePreview(t);
              return (
                <div key={`${tileKey(t)}-${i}`} className="admin-home-tile-row">
                  <div className="admin-home-tile-main">
                    {(t.img || preview.img)
                      ? <img src={t.img || preview.img} className="admin-home-thumb" alt="" />
                      : <div className="admin-home-thumb admin-home-pick-placeholder" />
                    }
                    <div className="admin-home-popular-info">
                      <span className="admin-home-popular-name">
                        {t.label || preview.title}
                        {preview.missing && <span className="admin-home-tile-missing"> (bulunamadı)</span>}
                      </span>
                      <span className="admin-home-popular-meta">{preview.meta}</span>
                    </div>
                    <div className="admin-actions">
                      <button className="admin-btn admin-btn-sm" onClick={() => moveTile(i, -1)} disabled={i === 0}>↑</button>
                      <button className="admin-btn admin-btn-sm" onClick={() => moveTile(i, 1)} disabled={i === config.showcaseTiles.length - 1}>↓</button>
                      <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => removeTile(i)}>Çıkar</button>
                    </div>
                  </div>
                  <div className="admin-home-tile-overrides">
                    <input
                      value={t.label ?? ''}
                      onChange={e => updateTile(i, { label: e.target.value })}
                      placeholder={`Başlık (boş = ${preview.title})`}
                    />
                    <input
                      value={t.img ?? ''}
                      onChange={e => updateTile(i, { img: e.target.value })}
                      placeholder="Görsel URL (boş = varsayılan görsel)"
                    />
                    <AdminImageUpload folder="showcase" onUploaded={url => updateTile(i, { img: url })} label="Görsel Yükle" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tile picker */}
        <div className="admin-home-picker">
          <div className="admin-home-tabs">
            <button
              className={`admin-btn admin-btn-sm${showcaseTab === 'category' ? ' admin-btn-primary' : ''}`}
              onClick={() => setShowcaseTab('category')}
            >
              Kategoriler
            </button>
            <button
              className={`admin-btn admin-btn-sm${showcaseTab === 'product' ? ' admin-btn-primary' : ''}`}
              onClick={() => setShowcaseTab('product')}
            >
              Ürünler
            </button>
          </div>

          <input
            className="admin-search"
            style={{ maxWidth: '100%', margin: '12px 0' }}
            value={showcaseSearch}
            onChange={e => setShowcaseSearch(e.target.value)}
            placeholder={showcaseTab === 'category' ? 'Kategori ara...' : 'Ürün ara (ad, marka, kod)...'}
          />

          {showcaseTab === 'category' ? (
            categories.length === 0 ? (
              <p style={{ color: '#888', fontSize: 13 }}>Kategori bulunamadı.</p>
            ) : (
              <div className="admin-home-product-grid">
                {showcaseCategories.map(c => {
                  const selected = config.showcaseTiles.some(t => t.kind === 'category' && t.refId === c.id);
                  return (
                    <div
                      key={c.id}
                      className={`admin-home-product-item${selected ? ' selected' : ''}`}
                      onClick={() => toggleTile('category', c.id)}
                    >
                      {selected && <span className="admin-home-pick-check">✓</span>}
                      {c.img?.[0]
                        ? <img src={c.img[0]} className="admin-home-pick-thumb" alt="" />
                        : <div className="admin-home-pick-thumb admin-home-pick-placeholder" />
                      }
                      <span className="admin-home-pick-name">{c.title || c.id}</span>
                      <span className="admin-home-pick-meta">Kategori</span>
                    </div>
                  );
                })}
                {showcaseCategories.length === 0 && (
                  <p className="admin-empty" style={{ gridColumn: '1/-1' }}>Aramanızla eşleşen kategori yok.</p>
                )}
              </div>
            )
          ) : loadingProducts ? (
            <p style={{ color: '#888', fontSize: 13 }}>Ürünler yükleniyor...</p>
          ) : (
            <div className="admin-home-product-grid">
              {showcaseProducts.slice(0, 60).map(p => {
                const selected = config.showcaseTiles.some(t => t.kind === 'product' && t.refId === p.id);
                return (
                  <div
                    key={p.id}
                    className={`admin-home-product-item${selected ? ' selected' : ''}`}
                    onClick={() => toggleTile('product', p.id)}
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
              {showcaseProducts.length === 0 && (
                <p className="admin-empty" style={{ gridColumn: '1/-1' }}>Aramanızla eşleşen ürün yok.</p>
              )}
            </div>
          )}
        </div>
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
