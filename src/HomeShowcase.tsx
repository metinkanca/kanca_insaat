import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from './firebase';
import { slugify } from './searchFold.ts';
import type { Category, HomeShowcaseTile, Product } from './types/firestore';

// How many categories fill the strip when the admin has not configured any
// tiles yet — the section is useful out of the box and only then overridden.
const FALLBACK_COUNT = 12;

// The track is the tile list repeated N times and slid left by exactly one
// repetition, so the loop is seamless. With only a handful of tiles two
// copies would not span a wide viewport, so repeat until there are enough.
const MIN_TRACK_ITEMS = 16;

// Seconds each tile takes to cross the strip — the loop is timed per tile so
// the speed stays the same no matter how many the admin picks.
const SECONDS_PER_TILE = 7;

// Placeholder tiles rendered while the config loads — enough to span a wide
// viewport so the reserved height matches the real strip.
const SKELETON_ITEMS = 12;

interface Tile {
  key: string;
  label: string;
  img: string;
  to: string;
}

function productLink(p: Product) {
  return `/products/${p.productType}/${p.brand}/${p.productCode || slugify(p.productName)}`;
}

export default function HomeShowcase() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  // Firestore needs a round trip before the strip can render. Without a
  // placeholder the section has zero height on first paint and everything
  // below it jumps down once the tiles arrive.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [configSnap, catSnap] = await Promise.all([
        getDoc(doc(db, 'homeConfig', 'main')).catch(() => null),
        getDocs(query(collection(db, 'categories'), orderBy('order'))).catch(() => null),
      ]);

      const categories = (catSnap?.docs ?? []).map(d => ({ id: d.id, ...d.data() } as Category & { id: string }));
      const configured = configSnap?.exists()
        ? (configSnap.data().showcaseTiles as HomeShowcaseTile[] | undefined)
        : undefined;

      // Nothing configured yet — show the first categories in their panel order.
      if (!configured || configured.length === 0) {
        if (cancelled) return;
        setLoading(false);
        setTiles(
          categories.slice(0, FALLBACK_COUNT).map(c => ({
            key: `category:${c.id}`,
            label: c.title || c.id,
            img: c.img?.[0] || '',
            to: `/products/${c.slug || c.id}`,
          }))
        );
        return;
      }

      // Only product tiles need a per-document read; categories are already loaded.
      const productIds = [...new Set(configured.filter(t => t.kind === 'product').map(t => t.refId))];
      const productDocs = await Promise.all(productIds.map(id => getDoc(doc(db, 'products', id)).catch(() => null)));
      const products = new Map<string, Product>();
      productDocs.forEach(d => { if (d?.exists()) products.set(d.id, d.data() as Product); });

      const resolved: Tile[] = [];
      configured.forEach((t, i) => {
        if (t.kind === 'category') {
          const c = categories.find(x => x.id === t.refId || x.slug === t.refId);
          if (!c) return;
          resolved.push({
            key: `${i}:category:${t.refId}`,
            label: t.label || c.title || t.refId,
            img: t.img || c.img?.[0] || '',
            to: `/products/${c.slug || c.id}`,
          });
        } else {
          const p = products.get(t.refId);
          if (!p) return;
          resolved.push({
            key: `${i}:product:${t.refId}`,
            label: t.label || p.productName || p.productCode,
            img: t.img || p.img || '',
            to: productLink(p),
          });
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
        <div className="home-marquee">
          <div className="home-marquee-track home-marquee-track--static">
            {Array.from({ length: SKELETON_ITEMS }, (_, i) => (
              <div key={i} className="home-marquee-item home-marquee-item--skeleton" aria-hidden="true">
                <span className="home-marquee-img" />
                <span className="home-marquee-label" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (tiles.length === 0) return null;

  const repeats = Math.max(2, Math.ceil(MIN_TRACK_ITEMS / tiles.length));
  const track = Array.from({ length: repeats }, (_, r) => tiles.map(t => ({ ...t, key: `${r}:${t.key}`, copy: r }))).flat();

  return (
    <section className="home-showcase">
      <div className="home-marquee">
        <div
          className="home-marquee-track"
          style={{
            // Shift by exactly one repetition so the strip loops without a seam.
            ['--marquee-shift' as string]: `-${100 / repeats}%`,
            animationDuration: `${tiles.length * SECONDS_PER_TILE}s`,
          }}
        >
          {track.map(t => (
            <Link
              key={t.key}
              to={t.to}
              className="home-marquee-item"
              // Only the first pass is real content; the clones are decorative.
              aria-hidden={t.copy > 0 ? true : undefined}
              tabIndex={t.copy > 0 ? -1 : undefined}
            >
              <span className="home-marquee-img">
                {t.img && <img src={t.img} alt={t.copy > 0 ? '' : t.label} loading="lazy" />}
              </span>
              <span className="home-marquee-label">{t.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
