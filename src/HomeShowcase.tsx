import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { slugify } from './searchFold.ts';
import type { Category, HomeShowcaseTile, Product } from './types/firestore';

// How many categories fill the grid when the admin has not configured any
// buttons yet — the section is useful out of the box and only then overridden.
const FALLBACK_COUNT = 12;

// Placeholder tiles rendered while the config loads, so the section reserves
// roughly its final height instead of pushing the page down when it arrives.
const SKELETON_ITEMS = 7;

interface Tile {
  key: string;
  label: string;
  img: string;
  to: string;
  external: boolean;
}

function productLink(p: Product) {
  return `/products/${p.productType}/${p.brand}/${p.productCode || slugify(p.productName)}`;
}

// A 'link' button holds whatever the admin typed: a site path ("/about") stays
// in the SPA, anything else opens as an external page. A bare "www.x.com" gets
// a scheme so the browser does not treat it as a relative path.
function resolveCustomLink(raw: string): { to: string; external: boolean } {
  const v = raw.trim();
  if (v.startsWith('/')) return { to: v, external: false };
  if (/^(https?:|mailto:|tel:)/i.test(v)) return { to: v, external: true };
  return { to: `https://${v}`, external: true };
}

export default function HomeShowcase() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [configSnap, catSnap] = await Promise.all([
        getDoc(doc(db, 'homeConfig', 'main')).catch(() => null),
        getDocs(query(collection(db, 'categories'), orderBy('order'))).catch(() => null),
      ]);

      const categories = (catSnap?.docs ?? []).map(d => ({ id: d.id, ...d.data() } as Category & { id: string }));
      const findCategory = (id: string) => categories.find(x => x.id === id || x.slug === id);
      const configured = configSnap?.exists()
        ? (configSnap.data().showcaseTiles as HomeShowcaseTile[] | undefined)
        : undefined;

      // Nothing configured yet — show the first categories in their panel order.
      if (!configured || configured.length === 0) {
        if (cancelled) return;
        setTiles(
          categories.slice(0, FALLBACK_COUNT).map(c => ({
            key: `category:${c.id}`,
            label: c.title || c.id,
            img: c.img?.[0] || '',
            to: `/products/${c.slug || c.id}`,
            external: false,
          }))
        );
        setLoading(false);
        return;
      }

      // Product buttons need their document for the link; brand buttons without
      // their own picture borrow the first product of that brand (and type).
      const productIds = [...new Set(configured.filter(t => t.kind === 'product').map(t => t.refId))];
      const brandRefs = [...new Set(configured.filter(t => t.kind === 'brand' && !t.img).map(t => t.refId))];
      const brandNames = [...new Set(configured.filter(t => t.kind === 'brandAll' && !t.img).map(t => t.refId))];

      const [productDocs, brandDocs, brandAllDocs] = await Promise.all([
        Promise.all(productIds.map(id => getDoc(doc(db, 'products', id)).catch(() => null))),
        Promise.all(brandRefs.map(ref => {
          const [productType, brand] = ref.split('/');
          return getDocs(query(collection(db, 'products'),
            where('productType', '==', productType),
            where('brand', '==', brand),
            limit(1),
          )).catch(() => null);
        })),
        Promise.all(brandNames.map(brand =>
          getDocs(query(collection(db, 'products'), where('brand', '==', brand), limit(1))).catch(() => null)
        )),
      ]);

      const products = new Map<string, Product>();
      productDocs.forEach(d => { if (d?.exists()) products.set(d.id, d.data() as Product); });
      const brandImg = new Map<string, string>();
      brandDocs.forEach((snap, i) => {
        const img = snap?.docs[0]?.data().img;
        if (img) brandImg.set(brandRefs[i], img);
      });
      const brandAllImg = new Map<string, string>();
      brandAllDocs.forEach((snap, i) => {
        const img = snap?.docs[0]?.data().img;
        if (img) brandAllImg.set(brandNames[i], img);
      });

      const resolved: Tile[] = [];
      configured.forEach((t, i) => {
        const key = `${i}:${t.kind}:${t.refId}`;
        if (t.kind === 'category') {
          const c = findCategory(t.refId);
          if (!c) return;
          resolved.push({
            key,
            label: t.label || c.title || t.refId,
            img: t.img || c.img?.[0] || '',
            to: `/products/${c.slug || c.id}`,
            external: false,
          });
        } else if (t.kind === 'brandAll') {
          if (!t.refId) return;
          resolved.push({
            key,
            label: t.label || t.refId,
            img: t.img || brandAllImg.get(t.refId) || '',
            to: `/products?marka=${encodeURIComponent(t.refId)}`,
            external: false,
          });
        } else if (t.kind === 'brand') {
          const [productType, brand] = t.refId.split('/');
          if (!productType || !brand) return;
          const c = findCategory(productType);
          resolved.push({
            key,
            label: t.label || (c?.title ? `${brand} ${c.title}` : brand),
            img: t.img || brandImg.get(t.refId) || '',
            to: `/products/${productType}/${brand}`,
            external: false,
          });
        } else if (t.kind === 'product') {
          const p = products.get(t.refId);
          if (!p) return;
          resolved.push({
            key,
            label: t.label || p.productName || p.productCode,
            img: t.img || p.img || '',
            to: productLink(p),
            external: false,
          });
        } else if (t.kind === 'link') {
          if (!t.refId.trim()) return;
          const { to, external } = resolveCustomLink(t.refId);
          resolved.push({ key, label: t.label || '', img: t.img || '', to, external });
        }
      });

      if (!cancelled) {
        setTiles(resolved);
        setLoading(false);
      }
    })().catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <section className="home-showcase">
        <div className="home-showcase-grid">
          {Array.from({ length: SKELETON_ITEMS }, (_, i) => (
            <div key={i} className="home-showcase-item home-showcase-item--skeleton" aria-hidden="true">
              <span className="home-showcase-img" />
              <span className="home-showcase-label" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (tiles.length === 0) return null;

  return (
    <section className="home-showcase">
      <div className="home-showcase-grid">
        {tiles.map(t => {
          const body = (
            <>
              <span className="home-showcase-img">
                {t.img && <img src={t.img} alt={t.label} loading="lazy" />}
              </span>
              <span className="home-showcase-label">{t.label}</span>
            </>
          );
          return t.external ? (
            <a key={t.key} href={t.to} className="home-showcase-item" target="_blank" rel="noopener noreferrer">
              {body}
            </a>
          ) : (
            <Link key={t.key} to={t.to} className="home-showcase-item">
              {body}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
