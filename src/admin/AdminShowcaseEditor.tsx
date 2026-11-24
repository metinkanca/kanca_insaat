import { useMemo, useState } from 'react';
import AdminImageUpload from './AdminImageUpload';
import type { Category, HomeShowcaseKind, HomeShowcaseTile } from '../types/firestore';

export type CategoryOption = Category & { id: string };

export interface ProductOption {
  id: string;
  productName: string;
  img: string;
  brand: string;
  productType: string;
  productCode: string;
}

export interface BrandOption {
  // "{productType}/{brand}" — the refId a 'brand' button stores.
  ref: string;
  brand: string;
  productType: string;
  img: string;
}

export const KIND_LABELS: Record<HomeShowcaseKind, string> = {
  category: 'Kategori sayfası',
  brandAll: 'Marka (tüm ürünleri)',
  brand: 'Marka + kategori sayfası',
  product: 'Ürün sayfası',
  link: 'Özel bağlantı',
};

// Every brand/type pair that has at least one product, i.e. every
// /products/{type}/{brand} page that actually shows something.
export function brandOptionsFrom(products: ProductOption[]): BrandOption[] {
  const map = new Map<string, BrandOption>();
  products.forEach(p => {
    if (!p.productType || !p.brand) return;
    const ref = `${p.productType}/${p.brand}`;
    const existing = map.get(ref);
    if (!existing) map.set(ref, { ref, brand: p.brand, productType: p.productType, img: p.img });
    else if (!existing.img && p.img) existing.img = p.img;
  });
  return [...map.values()].sort((a, b) => a.brand.localeCompare(b.brand, 'tr'));
}

export interface BrandNameOption {
  brand: string;
  img: string;
  count: number;
}

// Every brand on its own, across all categories — the targets of 'brandAll'.
export function brandNameOptionsFrom(products: ProductOption[]): BrandNameOption[] {
  const map = new Map<string, BrandNameOption>();
  products.forEach(p => {
    if (!p.brand) return;
    const existing = map.get(p.brand);
    if (!existing) map.set(p.brand, { brand: p.brand, img: p.img, count: 1 });
    else {
      existing.count++;
      if (!existing.img && p.img) existing.img = p.img;
    }
  });
  return [...map.values()].sort((a, b) => a.brand.localeCompare(b.brand, 'tr'));
}

// Why a button can't be saved yet, or '' when it is complete.
export function tileProblem(t: HomeShowcaseTile): string {
  if (!t.refId.trim()) {
    return t.kind === 'link' ? 'Bağlantı adresini girin.' : 'Hedef seçin.';
  }
  if (t.kind === 'link' && !t.label?.trim()) return 'Özel bağlantı için buton adı zorunlu.';
  return '';
}

interface Props {
  value: HomeShowcaseTile;
  onChange: (next: HomeShowcaseTile) => void;
  categories: CategoryOption[];
  brands: BrandOption[];
  brandNames: BrandNameOption[];
  products: ProductOption[];
  loadingProducts: boolean;
  // Name/picture the button shows when the admin leaves those fields blank.
  defaultLabel: string;
}

export default function AdminShowcaseEditor({
  value, onChange, categories, brands, brandNames, products, loadingProducts, defaultLabel,
}: Props) {
  const [productSearch, setProductSearch] = useState('');

  const categoryTitle = (slug: string) =>
    categories.find(c => c.id === slug || c.slug === slug)?.title || slug;

  // Blank label/image means "use the destination's own", so an emptied field
  // is dropped rather than saved as an empty string.
  const patch = (p: Partial<HomeShowcaseTile>) => {
    const next: HomeShowcaseTile = { ...value, ...p };
    if (!next.label) delete next.label;
    if (!next.img) delete next.img;
    onChange(next);
  };

  // Brands grouped under their category so the dropdown reads like the catalog.
  const brandGroups = useMemo(() => {
    const groups = new Map<string, BrandOption[]>();
    brands.forEach(b => {
      const list = groups.get(b.productType) ?? [];
      list.push(b);
      groups.set(b.productType, list);
    });
    return [...groups.entries()].sort((a, b) =>
      categoryTitle(a[0]).localeCompare(categoryTitle(b[0]), 'tr'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brands, categories]);

  const q = productSearch.toLowerCase();
  const productMatches = q
    ? products.filter(p =>
        p.productName.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.productCode.toLowerCase().includes(q)
      ).slice(0, 24)
    : [];
  const selectedProduct = value.kind === 'product' ? products.find(p => p.id === value.refId) : undefined;

  return (
    <div className="admin-showcase-editor">
      <div className="admin-showcase-editor-row">
        <label className="admin-showcase-field">
          <span>Tıklanınca gideceği yer</span>
          <select
            value={value.kind}
            onChange={e => patch({ kind: e.target.value as HomeShowcaseKind, refId: '' })}
          >
            {(Object.keys(KIND_LABELS) as HomeShowcaseKind[]).map(k => (
              <option key={k} value={k}>{KIND_LABELS[k]}</option>
            ))}
          </select>
        </label>

        {value.kind === 'category' && (
          <label className="admin-showcase-field admin-showcase-field--grow">
            <span>Kategori</span>
            <select value={value.refId} onChange={e => patch({ refId: e.target.value })}>
              <option value="">— Kategori seçin —</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.title || c.id}</option>
              ))}
            </select>
          </label>
        )}

        {value.kind === 'brandAll' && (
          <label className="admin-showcase-field admin-showcase-field--grow">
            <span>Marka</span>
            <select value={value.refId} onChange={e => patch({ refId: e.target.value })} disabled={loadingProducts}>
              <option value="">{loadingProducts ? 'Yükleniyor...' : '— Marka seçin —'}</option>
              {brandNames.map(b => (
                <option key={b.brand} value={b.brand}>{b.brand} ({b.count} ürün)</option>
              ))}
            </select>
          </label>
        )}

        {value.kind === 'brand' && (
          <label className="admin-showcase-field admin-showcase-field--grow">
            <span>Marka + kategori</span>
            <select value={value.refId} onChange={e => patch({ refId: e.target.value })} disabled={loadingProducts}>
              <option value="">{loadingProducts ? 'Yükleniyor...' : '— Marka seçin —'}</option>
              {brandGroups.map(([type, list]) => (
                <optgroup key={type} label={categoryTitle(type)}>
                  {list.map(b => (
                    <option key={b.ref} value={b.ref}>{b.brand} — {categoryTitle(type)}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        )}

        {value.kind === 'link' && (
          <label className="admin-showcase-field admin-showcase-field--grow">
            <span>Bağlantı adresi</span>
            <input
              value={value.refId}
              onChange={e => patch({ refId: e.target.value })}
              placeholder="/about, /products/kombi veya https://..."
            />
          </label>
        )}
      </div>

      {value.kind === 'product' && (
        <div className="admin-showcase-product">
          {selectedProduct ? (
            <div className="admin-showcase-selected">
              {selectedProduct.img
                ? <img src={selectedProduct.img} className="admin-home-thumb" alt="" />
                : <div className="admin-home-thumb admin-home-pick-placeholder" />}
              <div className="admin-home-popular-info">
                <span className="admin-home-popular-name">{selectedProduct.productName || selectedProduct.productCode}</span>
                <span className="admin-home-popular-meta">{selectedProduct.brand} · {selectedProduct.productCode}</span>
              </div>
              <button type="button" className="admin-btn admin-btn-sm" onClick={() => patch({ refId: '' })}>Değiştir</button>
            </div>
          ) : (
            <>
              <input
                className="admin-search"
                style={{ maxWidth: '100%', marginBottom: 8 }}
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder={loadingProducts ? 'Ürünler yükleniyor...' : 'Ürün ara (ad, marka, kod)...'}
                disabled={loadingProducts}
              />
              {value.refId && (
                <p className="admin-home-tile-missing" style={{ margin: '0 0 8px', fontSize: 12 }}>
                  Kayıtlı ürün bulunamadı ({value.refId}) — yeni bir ürün seçin.
                </p>
              )}
              {q && (
                <div className="admin-home-product-grid">
                  {productMatches.map(p => (
                    <div
                      key={p.id}
                      className="admin-home-product-item"
                      onClick={() => { patch({ refId: p.id }); setProductSearch(''); }}
                    >
                      {p.img
                        ? <img src={p.img} className="admin-home-pick-thumb" alt="" />
                        : <div className="admin-home-pick-thumb admin-home-pick-placeholder" />}
                      <span className="admin-home-pick-name">{p.productName || p.productCode}</span>
                      <span className="admin-home-pick-meta">{p.brand}</span>
                    </div>
                  ))}
                  {productMatches.length === 0 && (
                    <p className="admin-empty" style={{ gridColumn: '1/-1' }}>Aramanızla eşleşen ürün yok.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="admin-showcase-editor-row">
        <label className="admin-showcase-field admin-showcase-field--grow">
          <span>Buton adı{value.kind === 'link' ? ' (zorunlu)' : ''}</span>
          <input
            value={value.label ?? ''}
            onChange={e => patch({ label: e.target.value })}
            placeholder={value.kind === 'link' ? 'Örn. Kampanyalar' : `Boş bırakılırsa: ${defaultLabel || '—'}`}
          />
        </label>
      </div>

      <div className="admin-showcase-editor-row admin-showcase-editor-row--end">
        <label className="admin-showcase-field admin-showcase-field--grow">
          <span>Görsel</span>
          <input
            value={value.img?.startsWith('data:') ? '(cihazdan yüklendi)' : value.img ?? ''}
            readOnly={value.img?.startsWith('data:')}
            onChange={e => patch({ img: e.target.value })}
            placeholder={value.kind === 'link' ? 'Görsel URL' : 'Görsel URL (boş = varsayılan görsel)'}
          />
        </label>
        <AdminImageUpload folder="showcase" onUploaded={url => patch({ img: url })} label="Görsel Yükle" />
        {value.img && (
          <button type="button" className="admin-btn" onClick={() => patch({ img: '' })}>Görseli Kaldır</button>
        )}
      </div>
    </div>
  );
}
