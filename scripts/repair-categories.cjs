/**
 * One-time category repair:
 *  1. Merges duplicate categories (products moved to the canonical id,
 *     duplicate category doc deleted):
 *       ekleme_parcalari ("Fittings", empty) -> fittings
 *       yedek_parca ("Yedek Parça")          -> yedek_parcalar
 *  2. Fixes products whose productType holds category display text
 *     (e.g. "PVC - PPRC Malzemeler") instead of the category slug,
 *     routing through the merge map above.
 *
 * Usage: node scripts/repair-categories.cjs          (dry run)
 *        node scripts/repair-categories.cjs --apply  (write changes)
 */
const path = require('path');
const admin = require('firebase-admin');

const APPLY = process.argv.includes('--apply');
const keyPath = process.env.SERVICE_ACCOUNT_KEY
  || path.join(__dirname, '..', 'serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(require(keyPath)) });
const db = admin.firestore();

const MERGES = {
  ekleme_parcalari: 'fittings',
  yedek_parca: 'yedek_parcalar',
};

// Must mirror normalize()/slugify() in src/admin/AdminProductImport.tsx
function normalize(s) {
  return String(s || '').toLowerCase()
    .replace(/İ/g, 'i').replace(/I/g, 'i')
    .replace(/ş/g, 's').replace(/Ş/g, 's')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/Ü/g, 'u')
    .replace(/ö/g, 'o').replace(/Ö/g, 'o')
    .replace(/ç/g, 'c').replace(/Ç/g, 'c')
    .trim();
}
function slugify(s) {
  return normalize(s).replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

(async () => {
  const catSnap = await db.collection('categories').get();
  const slugs = new Set(catSnap.docs.map(d => d.id));
  const prodSnap = await db.collection('products').get();
  console.log(`Kategori: ${catSnap.size}, ürün: ${prodSnap.size}`);

  const updates = new Map(); // docRef path -> {ref, slug}
  const summary = new Map(); // "from -> to" -> count
  const note = (from, to) => summary.set(`${from} -> ${to}`, (summary.get(`${from} -> ${to}`) || 0) + 1);

  for (const d of prodSnap.docs) {
    const raw = d.get('productType') || '';
    let target = null;

    if (MERGES[raw]) {
      target = MERGES[raw]; // product sits in a category being merged away
    } else if (!slugs.has(raw)) {
      let slug = slugify(raw);
      slug = MERGES[slug] || slug; // display text of a merged category
      if (slug && slugs.has(slug)) target = slug;
      else { note(`"${raw}"`, 'EŞLEŞMEDİ (elle düzeltilmeli)'); continue; }
    }

    if (target && target !== raw) {
      updates.set(d.ref.path, { ref: d.ref, slug: target });
      note(`"${raw}"`, target);
    }
  }

  for (const [line, count] of [...summary.entries()].sort()) {
    console.log(`  ${count} ürün: ${line}`);
  }
  const deletions = Object.keys(MERGES).filter(s => slugs.has(s));
  console.log(`Silinecek kategori dokümanları: ${deletions.join(', ') || '(yok)'}`);
  console.log(`Toplam güncellenecek ürün: ${updates.size}`);

  if (!APPLY) {
    console.log('\nKuru çalıştırma — uygulamak için: node scripts/repair-categories.cjs --apply');
    return;
  }

  let batch = db.batch(), n = 0, total = 0;
  for (const u of updates.values()) {
    batch.update(u.ref, { productType: u.slug });
    if (++n === 400) { await batch.commit(); total += n; batch = db.batch(); n = 0; }
  }
  if (n) { await batch.commit(); total += n; }

  for (const slug of deletions) {
    await db.collection('categories').doc(slug).delete();
    console.log(`kategori silindi: ${slug}`);
  }
  console.log(`\n${total} ürün güncellendi. Tamamlandı.`);
})().catch(e => { console.error(e); process.exit(1); });
