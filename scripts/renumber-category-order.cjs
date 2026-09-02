/**
 * One-off repair: give every category a distinct `order`.
 *
 * Excel import creates categories with `order: 999`, so most of the catalog
 * ends up tied and the Kategoriler tab lists them in arbitrary document-id
 * order. Curated categories (order < 100) keep their positions; everything
 * else is renumbered from 100 upwards, alphabetically by title (Turkish).
 *
 * Usage: node scripts/renumber-category-order.cjs [--apply]
 */
const admin = require('firebase-admin');
const path = require('path');

admin.initializeApp({
  credential: admin.credential.cert(require(path.join(__dirname, '..', 'serviceAccountKey.json'))),
});
const db = admin.firestore();

const APPLY = process.argv.includes('--apply');
const CURATED_MAX = 100; // orders below this are hand-set and left alone

(async () => {
  const snap = await db.collection('categories').get();
  const cats = snap.docs.map(d => ({
    id: d.id,
    title: (d.data().title || d.id),
    order: d.data().order,
  }));

  const curated = cats.filter(c => typeof c.order === 'number' && c.order < CURATED_MAX);
  const rest = cats.filter(c => !(typeof c.order === 'number' && c.order < CURATED_MAX));
  rest.sort((a, b) => String(a.title).localeCompare(String(b.title), 'tr'));

  const updates = rest
    .map((c, i) => ({ ...c, newOrder: CURATED_MAX + i }))
    .filter(c => c.order !== c.newOrder);

  console.log(`${cats.length} kategori · ${curated.length} curated (order < ${CURATED_MAX}, korunuyor) · ${updates.length} yeniden numaralanacak\n`);
  curated
    .sort((a, b) => a.order - b.order)
    .forEach(c => console.log(`  [keep] ${String(c.order).padStart(3)}  ${c.title}`));
  console.log('');
  updates.forEach(c => console.log(`  [set ] ${String(c.order).padStart(3)} -> ${c.newOrder}  ${c.title}`));

  if (!APPLY) {
    console.log('\nDry run. Uygulamak için: node scripts/renumber-category-order.cjs --apply');
    process.exit(0);
  }

  const batch = db.batch();
  updates.forEach(c => batch.update(db.collection('categories').doc(c.id), { order: c.newOrder }));
  await batch.commit();
  console.log(`\n✓ ${updates.length} kategori güncellendi.`);
  process.exit(0);
})();
