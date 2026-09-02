import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Minus, Plus, ShoppingCart, Check } from 'lucide-react';
import { db } from './firebase';
import PageLoader from './PageLoader.tsx';
import { fold, slugify } from './searchFold.ts';
import { useCart } from './contexts/CartContext';
import type { Category, Product } from './types/firestore';

type CategoryWithId = Category & { id: string };
type ProductWithId = Product & { id: string };
type ViewMode = 'grid' | 'list';

export default function Products() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  // Per-product amount to add; the control shows a stepper then an add button
  // side by side (rather than toggling), so the quantity is chosen before adding.
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [addedId, setAddedId] = useState<string | null>(null);
  const getQty = (id: string) => qtyMap[id] ?? 1;
  const bumpQty = (id: string, d: number) =>
    setQtyMap(m => ({ ...m, [id]: Math.max(1, (m[id] ?? 1) + d) }));
  // /products/:productType opens the catalog pre-filtered to that category
  // (replaces the removed category page, keeping its old URLs alive).
  const { productType } = useParams();
  const [categories, setCategories] = useState<CategoryWithId[]>([]);
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState(productType || '');

  useEffect(() => { setTypeFilter(productType || ''); }, [productType]);
  const [view, setView] = useState<ViewMode>(() =>
    localStorage.getItem('publicProductView') === 'list' ? 'list' : 'grid'
  );

  useEffect(() => {
    Promise.all([
      getDocs(query(collection(db, 'categories'), orderBy('order'))),
      getDocs(collection(db, 'products')),
    ]).then(([catSnap, prodSnap]) => {
      setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() } as CategoryWithId)));
      const prods = prodSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as ProductWithId))
        .filter(p => p.isActive !== false);
      prods.sort((a, b) => a.productType.localeCompare(b.productType, 'tr') || a.productName.localeCompare(b.productName, 'tr'));
      setProducts(prods);
      setLoading(false);
    });
  }, []);

  const changeView = (v: ViewMode) => {
    setView(v);
    localStorage.setItem('publicProductView', v);
  };

  const catTitle = (slug: string) =>
    categories.find(c => c.slug === slug || c.id === slug)?.title || slug;

  // Filter options derived from actual products; categories keep their Firestore order
  const productTypes = categories
    .map(c => c.slug || c.id)
    .filter(slug => products.some(p => p.productType === slug));
  products.forEach(p => {
    if (!productTypes.includes(p.productType)) productTypes.push(p.productType);
  });
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr'));

  const filtered = products.filter(p => {
    const q = fold(search);
    const matchSearch = !q || fold(p.productName).includes(q) || fold(p.productCode).includes(q) || fold(p.brand).includes(q);
    const matchBrand = !brandFilter || p.brand === brandFilter;
    const matchType = !typeFilter || p.productType === typeFilter;
    return matchSearch && matchBrand && matchType;
  });

  // Render at most PAGE_SIZE cards/rows at a time — with 2,000+ products,
  // mounting every card (and its image) at once is what actually made this
  // page feel slow, far more than the single Firestore read of all docs.
  const PAGE_SIZE = 100;
  const [page, setPage] = useState(0);
  useEffect(() => { setPage(0); }, [search, brandFilter, typeFilter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageStart = currentPage * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, filtered.length);
  const pageItems = filtered.slice(pageStart, pageEnd);
  const goPage = (p: number) => setPage(Math.min(pageCount - 1, Math.max(0, p)));

  const pager = pageCount > 1 ? (
    <div className="public-pager">
      <button onClick={() => goPage(0)} disabled={currentPage === 0}>«</button>
      <button onClick={() => goPage(currentPage - 1)} disabled={currentPage === 0}>‹ Önceki</button>
      <span className="public-pager-info">
        Sayfa <strong>{currentPage + 1}</strong> / {pageCount}
        &nbsp;·&nbsp; {(pageStart + 1).toLocaleString('tr-TR')}–{pageEnd.toLocaleString('tr-TR')} / {filtered.length.toLocaleString('tr-TR')}
      </span>
      <button onClick={() => goPage(currentPage + 1)} disabled={currentPage >= pageCount - 1}>Sonraki ›</button>
      <button onClick={() => goPage(pageCount - 1)} disabled={currentPage >= pageCount - 1}>»</button>
    </div>
  ) : null;

  const hasPrices = filtered.some(p => p.price > 0);
  // Code-less products link via their name slug; an empty last segment would
  // fall through to the brand page instead of the product detail.
  const detailLink = (p: ProductWithId) =>
    `/products/${p.productType}/${p.brand}/${p.productCode || slugify(p.productName)}`;

  // Inline add-to-cart used by both grid cards and list rows: a small − qty +
  // stepper followed by a compact add button. Wrapped in a stopPropagation
  // container by the caller so clicks don't trigger card/row navigation.
  const cartControls = (p: ProductWithId) => {
    const q = getQty(p.id);
    const add = () => {
      addItem({ id: p.id, name: p.productName, price: p.price, image: p.img, unit: p.unit }, q);
      setAddedId(p.id);
      window.setTimeout(() => setAddedId(c => (c === p.id ? null : c)), 1200);
    };
    return (
      <div className="catalog-cart">
        <div className="catalog-qty">
          <button aria-label="Azalt" onClick={() => bumpQty(p.id, -1)} disabled={q <= 1}>
            <Minus size={13} />
          </button>
          <span>{q}</span>
          <button aria-label="Artır" onClick={() => bumpQty(p.id, 1)}>
            <Plus size={13} />
          </button>
        </div>
        <button
          className={`catalog-add-btn${addedId === p.id ? ' is-added' : ''}`}
          onClick={add}
          aria-label="Sepete ekle"
        >
          {addedId === p.id ? <Check size={15} /> : <ShoppingCart size={15} />}
        </button>
      </div>
    );
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="page-title"><p className="products-page-title">Ürünler</p></div>

      <div className="public-catalog page-enter">
        <div className="public-products-toolbar public-products-toolbar--filters">
          <input
            className="public-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Kod, ürün adı veya marka ara..."
          />
          <select className="public-select" value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
            <option value="">Tüm Markalar</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className="public-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">Tüm Kategoriler</option>
            {productTypes.map(t => <option key={t} value={t}>{catTitle(t)}</option>)}
          </select>
          <span className="public-result-count">{filtered.length.toLocaleString('tr-TR')} ürün</span>
          <div className="public-view-toggle">
            <button
              className={view === 'grid' ? 'active' : ''}
              onClick={() => changeView('grid')}
              title="Kart görünümü"
              aria-label="Kart görünümü"
            >▦</button>
            <button
              className={view === 'list' ? 'active' : ''}
              onClick={() => changeView('list')}
              title="Liste görünümü"
              aria-label="Liste görünümü"
            >☰</button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="public-catalog-empty">Ürün bulunamadı.</p>
        ) : (
          <>
            {pager}
            {view === 'grid' ? (
              <div className="catalog-grid">
                {pageItems.map(p => (
                  <Link key={p.id} to={detailLink(p)} className="product-card catalog-card">
                    <div className="catalog-card-img">
                      {p.img
                        ? <img src={p.img} alt={p.productName} loading="lazy" decoding="async" />
                        : <div className="catalog-card-placeholder" />
                      }
                    </div>
                    <div className="catalog-card-info">
                      <p className="catalog-card-brand">{p.brand}</p>
                      <p className="catalog-card-name">{p.productName}</p>
                      {p.price > 0 && (
                        <p className="catalog-card-price">{p.price.toLocaleString('tr-TR')} ₺</p>
                      )}
                      {p.price > 0 && (
                        <div
                          className="catalog-card-cart"
                          onClick={e => { e.preventDefault(); e.stopPropagation(); }}
                        >
                          {cartControls(p)}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="public-product-table-wrapper">
                <table className="public-product-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Marka</th>
                      <th>Kategori</th>
                      <th>Ürün Adı</th>
                      {hasPrices && <th className="public-cell-right">Fiyat</th>}
                      {hasPrices && <th className="public-cell-cart-col"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map(p => (
                      <tr key={p.id} onClick={() => navigate(detailLink(p))}>
                        <td className="public-cell-thumb">
                          {p.img && <img src={p.img} alt={p.productName} loading="lazy" decoding="async" />}
                        </td>
                        <td className="public-cell-brand" title={p.brand || undefined}>{p.brand || '—'}</td>
                        <td title={catTitle(p.productType)}>{catTitle(p.productType)}</td>
                        <td title={p.productName}>{p.productName}</td>
                        {hasPrices && (
                          <td className="public-cell-price public-cell-right">
                            {p.price > 0 ? `${p.price.toLocaleString('tr-TR')} ₺` : '—'}
                          </td>
                        )}
                        {hasPrices && (
                          <td className="public-cell-cart" onClick={e => e.stopPropagation()}>
                            {p.price > 0 && cartControls(p)}
                          </td>
                        )}
                        {/* Mobile-only: same data, stacked as a card row instead of scrolling columns */}
                        <td className="public-cell-mobile">
                          <div className="public-mobile-row">
                            <div className="public-mobile-thumb">
                              {p.img ? <img src={p.img} alt="" loading="lazy" decoding="async" /> : <div className="public-mobile-thumb-placeholder" />}
                            </div>
                            <div className="public-mobile-text">
                              <p className="public-mobile-name">{p.productName}</p>
                              <p className="public-mobile-meta">
                                {[p.brand, catTitle(p.productType)].filter(Boolean).join(' · ')}
                              </p>
                              {p.price > 0 && (
                                <p className="public-mobile-price">{p.price.toLocaleString('tr-TR')} ₺</p>
                              )}
                            </div>
                            {p.price > 0 && (
                              <div className="public-mobile-cart" onClick={e => e.stopPropagation()}>
                                {cartControls(p)}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {pager}
          </>
        )}
      </div>
    </div>
  );
}
