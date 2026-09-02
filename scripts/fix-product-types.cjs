/**
 * One-time repair: products imported by the old Excel wizard carry the
 * category's display text (e.g. "PVC - PPRC Malzemeler") in productType
 * instead of the category slug, so they never appear on the site and they
 * block re-imports (name-based duplicate detection sees them as existing).
 *
 * For every product whose productType is not a category slug:
 *   - if slugify(productType) matches an existing category → point it there
 *   - otherwise create that category (title = original text) and point to it
 *
 * Usage: node scripts/fix-product-types.cjs          (dry run — prints plan)
 *        node scripts/fix-product-types.cjs --apply  (writes changes)
 */
const path = require('path');
const admin = require('firebase-admin');

const APPLY = process.argv.includes('--apply');
const keyPath = process.env.SERVICE_ACCOUNT_KEY
  || path.join(__dirname, '..', 'serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(require(keyPath)) });
const db = admin.firestore();

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
  const broken = prodSnap.docs.filter(d => !slugs.has(d.get('productType') || ''));
  console.log(`Ürün sayısı: ${prodSnap.size}, bozuk kategorili: ${broken.length}`);

  // Group by broken type value
  const byType = new Map();
  for (const d of broken) {
    const t = d.get('productType') || '';
    if (!byType.has(t)) byType.set(t, []);
    byType.get(t).push(d);
  }

  const newCategories = [];
  const updates = [];
  for (const [raw, docs] of byType) {
    let slug = slugify(raw);
    if (!slug) { console.log(`ATLANDI (boş tip): ${docs.length} ürün`); continue; }
    if (!slugs.has(slug)) newCategories.push({ slug, title: raw });
    updates.push(...docs.map(d => ({ ref: d.ref, slug })));
    console.log(`"${raw}" -> ${slug} (${docs.length} ürün${slugs.has(slug) ? '' : ', kategori oluşturulacak'})`);
  }

  if (!APPLY) {
    console.log('\nKuru çalıştırma — değişiklik yazılmadı. Uygulamak için: node scripts/fix-product-types.cjs --apply');
    return;
  }

  for (const c of newCategories) {
    await db.collection('categories').doc(c.slug).set({
      title: c.title, img: [], brand: [], brandImg: [], link: [], order: 999,
    });
    console.log(`kategori oluşturuldu: ${c.slug}`);
  }

  let batch = db.batch(), n = 0, total = 0;
  for (const u of updates) {
    batch.update(u.ref, { productType: u.slug });
    if (++n === 400) { await batch.commit(); total += n; batch = db.batch(); n = 0; }
  }
  if (n) { await batch.commit(); total += n; }
  console.log(`\n${total} ürün düzeltildi.`);
})().catch(e => { console.error(e); process.exit(1); });
