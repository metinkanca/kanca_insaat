import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../contexts/CartContext';
import { fold } from '../searchFold.ts';
import type { Product } from '../types/firestore';

type ProductWithId = Product & { id: string };
type ViewMode = 'grid' | 'list';

export default function DealerProducts() {
  const { addItem, removeItem, updateQty, items } = useCart();
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [categoryTitles, setCategoryTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [view, setView] = useState<ViewMode>(() =>
    localStorage.getItem('dealerProductView') === 'list' ? 'list' : 'grid'
  );

  useEffect(() => {
    Promise.all([
      getDocs(collection(db, 'products')),
      getDocs(collection(db, 'categories')),
    ]).then(([prodSnap, catSnap]) => {
      const prods = prodSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as ProductWithId))
        .filter(p => p.isActive !== false);
      prods.sort((a, b) => a.productType.localeCompare(b.productType, 'tr') || a.productName.localeCompare(b.productName, 'tr'));
      setProducts(prods);

      const titles: Record<string, string> = {};
      catSnap.docs.forEach(d => { titles[d.id] = (d.data().title as string) || d.id; });
      setCategoryTitles(titles);
      setLoading(false);
    });
  }, []);

  const changeView = (v: ViewMode) => {
    setView(v);
    localStorage.setItem('dealerProductView', v);
  };

  const productTypes = [...new Set(products.map(p => p.productType))].sort((a, b) => a.localeCompare(b, 'tr'));

  const filtered = products.filter(p => {
    const q = fold(search);
    const matchSearch = !q || fold(p.productName).includes(q) || fold(p.productCode).includes(q) || fold(p.brand).includes(q);
    const matchType = !typeFilter || p.productType === typeFilter;
    return matchSearch && matchType;
  });

  const cartQty = (id: string) => items.find(i => i.id === id)?.qty ?? 0;
  const catTitle = (slug: string) => categoryTitles[slug] || slug;

  const cartControls = (p: ProductWithId, compact: boolean) => {
    const qty = cartQty(p.id);
    const add = () => addItem({ id: p.id, name: p.productName, price: p.price, image: p.img, unit: p.unit });
    if (qty === 0) {
      return (
        <button
          className={compact ? 'dealer-btn dealer-btn-sm dealer-btn-primary' : 'dealer-btn dealer-btn-sm dealer-btn-primary dealer-btn-full'}
          onClick={add}
        >
          {compact ? 'Ekle' : 'Sepete Ekle'}
        </button>
      );
    }
    return (
      <div className="dealer-qty-row">
        <button className="dealer-btn dealer-btn-sm" onClick={() => qty <= 1 ? removeItem(p.id) : updateQty(p.id, qty - 1)}>−</button>
        <span className="dealer-qty-val">{qty}</span>
        <button className="dealer-btn dealer-btn-sm" onClick={add}>+</button>
      </div>
    );
  };

  if (loading) return <div className="dealer-page"><p>Yükleniyor...</p></div>;

  return (
    <div className="dealer-page dealer-page--wide">
      <div className="dealer-page-header">
        <h2 className="dealer-page-title">Ürün Kataloğu</h2>
      </div>

      <div className="dealer-products-toolbar">
        <input
          className="dealer-search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Ürün adı, kod veya marka ara..."
        />
        <select className="dealer-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">Tüm Kategoriler</option>
          {productTypes.map(t => <option key={t} value={t}>{catTitle(t)}</option>)}
        </select>
        <span className="dealer-result-count">{filtered.length.toLocaleString('tr-TR')} ürün</span>
        <div className="dealer-view-toggle">
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
        <p className="dealer-empty">Ürün bulunamadı.</p>
      ) : view === 'grid' ? (
        <div className="dealer-product-grid">
          {filtered.map(p => (
            <div key={p.id} className="dealer-product-card">
              <div className="dealer-product-img-wrap">
                {p.img
                  ? <img src={p.img} alt={p.productName} className="dealer-product-img" />
                  : <div className="dealer-product-img-placeholder" />
                }
              </div>
              <div className="dealer-product-info">
                <p className="dealer-product-brand">{p.brand}</p>
                <p className="dealer-product-name">{p.productName}</p>
                {p.price > 0 && (
                  <p className="dealer-product-price">{p.price.toLocaleString('tr-TR')} ₺</p>
                )}
              </div>
              <div className="dealer-product-actions">
                {cartControls(p, false)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="dealer-table-wrapper">
          <table className="dealer-table dealer-table--compact">
            <thead>
              <tr>
                <th>Marka</th>
                <th>Kategori</th>
                <th>Ürün Adı</th>
                <th className="dealer-cell-right">Fiyat</th>
                <th>Sepet</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td className="dealer-cell-brand">{p.brand || '—'}</td>
                  <td>{catTitle(p.productType)}</td>
                  <td className="dealer-cell-name">{p.productName}</td>
                  <td className="dealer-cell-price dealer-cell-right">
                    {p.price > 0 ? `${p.price.toLocaleString('tr-TR')} ₺` : '—'}
                  </td>
                  <td className="dealer-cell-cart">{cartControls(p, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
