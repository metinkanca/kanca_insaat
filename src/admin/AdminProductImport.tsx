import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { read, utils, writeFile } from 'xlsx';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import type { Product } from '../types/firestore';

type KancaField =
  | 'productType' | 'brand' | 'productCode' | 'productName'
  | 'price' | 'img' | 'logo' | 'dealerLink' | 'listeAdi'
  | 'depth' | 'width' | 'height';

const FIELD_LABELS: Record<KancaField, string> = {
  productType: 'Ürün Tipi',
  brand: 'Marka *',
  productCode: 'Ürün Kodu',
  productName: 'Ürün Adı *',
  price: 'Fiyat (TRY)',
  img: 'Görsel URL',
  logo: 'Logo URL',
  dealerLink: 'Dealer Link',
  listeAdi: 'Liste Adı',
  depth: 'Derinlik (mm)',
  width: 'Genişlik (mm)',
  height: 'Yükseklik (mm)',
};

// productType intentionally excluded — missing type goes to category-assignment step
// productCode intentionally excluded — not all products have codes
const REQUIRED: KancaField[] = ['brand', 'productName'];

const KEYWORDS: Record<KancaField, string[]> = {
  listeAdi: ['liste adı', 'liste adi', 'listeadi', 'list name', 'listename', 'fiyat listesi', 'liste'],
  productType: ['ürün tipi', 'urun tipi', 'kategori', 'category', 'tip', 'type', 'producttype'],
  brand: ['marka', 'brand', 'firma'],
  productCode: ['ürün kodu', 'urun kodu', 'kod', 'sku', 'code', 'model', 'productcode'],
  productName: ['ürün adı', 'urun adi', 'isim', 'name', 'productname'],
  price: ['fiyat', 'price', 'tutar', 'nakit'],
  img: ['görsel', 'gorsel', 'resim', 'image', 'img', 'url', 'görsel url'],
  logo: ['logo'],
  dealerLink: ['link', 'bayi', 'dealer', 'dealerlink'],
  depth: ['derinlik', 'depth'],
  width: ['genişlik', 'genislik', 'width', 'en'],
  height: ['yükseklik', 'yukseklik', 'height', 'boy'],
};

function normalize(s: string) {
  return String(s || '').toLowerCase()
    .replace(/İ/g, 'i').replace(/I/g, 'i')
    .replace(/ş/g, 's').replace(/Ş/g, 's')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/Ü/g, 'u')
    .replace(/ö/g, 'o').replace(/Ö/g, 'o')
    .replace(/ç/g, 'c').replace(/Ç/g, 'c')
    .trim();
}

function slugify(s: string) {
  return normalize(s).replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

// Duplicate-detection key: name alone is too loose (same-named products can
// exist under different brands), so key on name + brand.
function nameKey(productName: string, brand: string) {
  return `${normalize(productName)}__${normalize(brand)}`;
}

// Turkish price lists come as "1.250,50", "1.250" or plain numbers.
// parseFloat alone reads "1.250,50" as 1.25 — handle separators explicitly.
function parsePrice(raw: string): number {
  let s = String(raw ?? '').trim().replace(/[^\d.,-]/g, '');
  if (!s) return 0;
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && hasDot) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (hasComma) {
    s = /^\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, '') : s.replace(',', '.');
  } else if (hasDot && /^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '');
  }
  const n = parseFloat(s);
  return isFinite(n) ? n : 0;
}


function autoDetect(headers: string[]): Record<string, KancaField> {
  const mapping: Record<string, KancaField> = {};
  for (const header of headers) {
    const n = normalize(header);
    for (const [field, keywords] of Object.entries(KEYWORDS) as [KancaField, string[]][]) {
      if (keywords.some(k => n.includes(k))) { mapping[header] = field; break; }
    }
  }
  return mapping;
}

// Some price lists carry both a plain "Kod" column (the short internal code the
// admin panel searches by) and a separate "Ürün Kodu" column (usually blank) —
// both auto-detect to the same field. A plain "Kod" column always wins; otherwise
// the last non-empty mapped column wins instead of blindly overwriting with blank.
function pickMappedValue(
  row: Record<string, any>,
  mapping: Record<string, KancaField>,
  field: KancaField
): string {
  const cols = Object.keys(mapping).filter(c => mapping[c] === field);
  const exactKod = cols.find(c => normalize(c) === 'kod');
  if (exactKod) return String(row[exactKod] ?? '').trim();
  let value = '';
  for (const c of cols) {
    const v = String(row[c] ?? '').trim();
    if (v) value = v;
  }
  return value;
}

function makeId(productType: string, brand: string, productCode: string, productName: string) {
  // '/' would turn the ID into a nested Firestore path (the write "succeeds"
  // but the product never appears in the products collection). Code-less
  // products fall back to the name so they don't all collide on the same ID.
  const codePart = productCode || slugify(productName) || 'urun';
  return `${productType}__${brand}__${codePart}`.replace(/\s+/g, '_').replace(/\//g, '-');
}

function downloadTemplate() {
  const wb = utils.book_new();
  const headers = ['Ürün Tipi', 'Marka', 'Ürün Kodu', 'Ürün Adı', 'Fiyat', 'Görsel URL', 'Logo URL', 'Dealer Link', 'Liste Adı', 'Derinlik', 'Genişlik', 'Yükseklik'];
  const ws = utils.aoa_to_sheet([headers, ['isi_pompasi', 'Daiwa', 'DW-10', 'Daiwa DW-10 Isı Pompası', '15000', '', '', '', 'Fiyat Listesi 2024-A', '590', '550', '1210']]);
  utils.book_append_sheet(wb, ws, 'Ürünler');
  writeFile(wb, 'kanca_urun_sablonu.xlsx');
}

type ValidRow = {
  productType: string; brand: string; productCode: string; productName: string;
  price: number; img: string; logo: string; dealerLink: string; listeAdi: string;
  depth: string; width: string; height: string; _row: number;
};
type ErrorRow = { row: number; fields: string[] };
type UnknownType = { raw: string; slug: string; title: string; skip: boolean };

function buildRows(
  rawRows: Record<string, any>[],
  mapping: Record<string, KancaField>
): { valid: ValidRow[]; uncategorized: ValidRow[]; errors: ErrorRow[] } {
  const valid: ValidRow[] = [];
  const uncategorized: ValidRow[] = [];
  const errors: ErrorRow[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const mapped: Partial<Record<KancaField, string>> = {};
    for (const field of new Set(Object.values(mapping))) {
      mapped[field] = pickMappedValue(row, mapping, field);
    }

    const missing = REQUIRED.filter(f => !mapped[f]);
    if (missing.length) {
      errors.push({ row: i + 2, fields: missing.map(f => FIELD_LABELS[f]) });
      continue;
    }

    const base: ValidRow = {
      productType: mapped.productType || '',
      brand: mapped.brand!,
      productCode: mapped.productCode!,
      productName: mapped.productName!,
      price: parsePrice(mapped.price || ''),
      img: mapped.img || '',
      logo: mapped.logo || '',
      dealerLink: mapped.dealerLink || '',
      listeAdi: mapped.listeAdi || '',
      depth: mapped.depth || '',
      width: mapped.width || '',
      height: mapped.height || '',
      _row: i + 2,
    };

    if (base.productType) {
      valid.push(base);
    } else {
      uncategorized.push(base);
    }
  }

  return { valid, uncategorized, errors };
}

type Step = 1 | 2 | 'newtypes' | 3 | 4;

export default function AdminProductImport() {
  const navigate = useNavigate();

  const [step, setStep]       = useState<Step>(1);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [fileName, setFileName] = useState('');
  const [mapping, setMapping] = useState<Record<string, KancaField>>({});

  // Rows that have a productType but we haven't finalized yet (held until after newtypes step)
  const [pendingRows, setPendingRows]             = useState<ValidRow[]>([]);
  const [validRows, setValidRows]                 = useState<ValidRow[]>([]);
  const [skippedRows, setSkippedRows]             = useState<ValidRow[]>([]);
  const [errorRows, setErrorRows]                 = useState<ErrorRow[]>([]);
  const [uncategorizedRows, setUncategorizedRows] = useState<ValidRow[]>([]);

  // New product types step
  const [unknownTypes, setUnknownTypes] = useState<UnknownType[]>([]);
  const [savingType, setSavingType]     = useState(false);

  // Category assignment step
  const [categories, setCategories]         = useState<{ slug: string; title: string }[]>([]);
  const [catAssignments, setCatAssignments] = useState<Record<number, string>>({});
  const [catSelected, setCatSelected]       = useState<Set<number>>(new Set());
  const [existingNames, setExistingNames]   = useState<Set<string>>(new Set());
  const [existingIds, setExistingIds]       = useState<Set<string>>(new Set());
  const [uncatSkipped, setUncatSkipped]     = useState(0);

  // Pagination for the (potentially huge) category-assignment table
  const UNCAT_PAGE_SIZE = 100;
  const [uncatPage, setUncatPage] = useState(0);
  const [catActiveIdx, setCatActiveIdx] = useState<number | null>(null);
  const catRowsRef = useRef<HTMLDivElement>(null);

  // Inline new-category creation in Step 3
  const [showNewCatForm, setShowNewCatForm] = useState(false);
  const [newCatTitle, setNewCatTitle]       = useState('');
  const [newCatSlug, setNewCatSlug]         = useState('');
  const [creatingCat, setCreatingCat]       = useState(false);

  const [proceeding, setProceeding] = useState(false);
  const [importing, setImporting]   = useState(false);
  const [progress, setProgress]     = useState(0);
  const [done, setDone]             = useState<{ success: number; failed: number; collided: number } | null>(null);
  const [dragOver, setDragOver]     = useState(false);
  const [parseError, setParseError] = useState('');

  const isDraggingRef = useRef(false);
  const dragStartRef  = useRef<number | null>(null);

  // Global mouseup for drag-select
  useEffect(() => {
    const up = () => { isDraggingRef.current = false; };
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);


  // ── File parsing ───────────────────────────────────────────────────────────

  const parseFile = useCallback(async (file: File) => {
    setParseError('');
    try {
      const ab = await file.arrayBuffer();
      const wb = read(new Uint8Array(ab), { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawData: any[][] = utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (rawData.length < 2) { setParseError('Dosya boş veya sadece başlık satırı var.'); return; }

      const hdrs = (rawData[0] as string[]).map(String);
      const rows = rawData.slice(1).map(row => {
        const obj: Record<string, any> = {};
        hdrs.forEach((h, i) => { obj[h] = row[i] ?? ''; });
        return obj;
      }).filter(row => hdrs.some(h => row[h] !== ''));

      setHeaders(hdrs);
      setRawRows(rows);
      setFileName(file.name);
      setMapping(autoDetect(hdrs));
      setStep(2);
    } catch {
      setParseError('Dosya okunamadı. Lütfen geçerli bir Excel veya CSV dosyası seçin.');
    }
  }, []);

  const handleFile = (file: File) => {
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setParseError('Sadece .xlsx, .xls veya .csv dosyaları desteklenir.');
      return;
    }
    parseFile(file);
  };

  // ── Step 2 → newtypes or 3 or 4 ───────────────────────────────────────────

  const proceed = async () => {
    const mapped = Object.values(mapping);
    const missing = REQUIRED.filter(f => !mapped.includes(f));
    if (missing.length) {
      alert('Zorunlu alanlar eşleştirilmedi: ' + missing.map(f => FIELD_LABELS[f]).join(', '));
      return;
    }
    setProceeding(true);
    try {
      const { valid, uncategorized, errors } = buildRows(rawRows, mapping);

      const [prodSnap, catSnap] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'categories')),
      ]);

      const existNames = new Set(
        prodSnap.docs.map(d => {
          const p = d.data() as Product;
          return nameKey(p.productName || '', p.brand || '');
        })
      );
      setExistingIds(new Set(prodSnap.docs.map(d => d.id)));
      const cats = catSnap.docs
        .map(d => ({ slug: d.id, title: (d.data().title as string) || d.id }))
        .sort((a, b) => a.title.localeCompare(b.title, 'tr'));

      // Excel often holds the category's display text ("Armatür") rather than
      // its slug ("armatur"). Products saved with the display text would never
      // appear on the site, so normalize to the known slug up front.
      const knownSlugsEarly = new Set(cats.map(c => c.slug));
      const normalizedValid = valid.map(r =>
        !knownSlugsEarly.has(r.productType) && knownSlugsEarly.has(slugify(r.productType))
          ? { ...r, productType: slugify(r.productType) }
          : r
      );

      const toImport = normalizedValid.filter(r => !existNames.has(nameKey(r.productName, r.brand)));
      const skipped  = normalizedValid.filter(r =>  existNames.has(nameKey(r.productName, r.brand)));

      // Rows without a category whose product already exists in the database
      // don't need manual assignment — take them out of step 3 entirely and
      // report them as "already exists" instead.
      const uncatNew      = uncategorized.filter(r => !existNames.has(nameKey(r.productName, r.brand)));
      const uncatExisting = uncategorized.filter(r =>  existNames.has(nameKey(r.productName, r.brand)));
      skipped.push(...uncatExisting);

      // Detect product types from the raw Excel data — read every row's productType value
      // directly from the mapped column, before any validation filtering, so rows that are
      // errors (missing name/code/brand) still contribute their type to the unknown-type check.
      const knownSlugs = new Set(cats.map(c => c.slug));
      const productTypeCol = Object.keys(mapping).find(k => mapping[k] === 'productType');
      const allRawTypes = productTypeCol
        ? [...new Set(rawRows.map(r => String(r[productTypeCol] ?? '').trim()).filter(Boolean))]
        : [...new Set(valid.map(r => r.productType))];
      const unknownList: UnknownType[] = allRawTypes
        // treat as known if raw or its slugified form already exists as a category slug
        .filter(t => !knownSlugs.has(t) && !knownSlugs.has(slugify(t)))
        .map(t => ({ raw: t, slug: slugify(t) || t, title: t, skip: false }));

      setPendingRows(toImport);
      setSkippedRows(skipped);
      setErrorRows(errors);
      setUncategorizedRows(uncatNew);
      setUncatPage(0);
      setCategories(cats);
      setExistingNames(existNames);
      setCatAssignments({});
      setCatSelected(new Set());

      if (unknownList.length > 0) {
        setUnknownTypes(unknownList);
        setStep('newtypes');
      } else {
        // All types known — go straight to category assignment or preview
        setValidRows(toImport);
        setStep(uncatNew.length > 0 ? 3 : 4);
      }
    } finally {
      setProceeding(false);
    }
  };

  // ── New types: inline edit helpers ────────────────────────────────────────

  const updateUnknownType = (idx: number, field: 'slug' | 'title', value: string) => {
    setUnknownTypes(prev => prev.map((t, i) =>
      i === idx ? { ...t, [field]: field === 'slug' ? slugify(value) || value : value } : t
    ));
  };

  const toggleSkip = (idx: number) => {
    setUnknownTypes(prev => prev.map((t, i) => i === idx ? { ...t, skip: !t.skip } : t));
  };

  // ── newtypes → 3 or 4: save all confirmed types at once ───────────────────

  const finishNewTypes = async () => {
    const toAdd = unknownTypes.filter(t => !t.skip && t.slug && t.title);

    setSavingType(true);
    try {
      await Promise.all(toAdd.map(t =>
        setDoc(doc(db, 'categories', t.slug), {
          title: t.title, img: [], brand: [], brandImg: [], link: [], order: 999,
        })
      ));
    } finally {
      setSavingType(false);
    }

    const allCats = [
      ...categories,
      ...toAdd.map(t => ({ slug: t.slug, title: t.title })),
    ].sort((a, b) => a.title.localeCompare(b.title, 'tr'));
    setCategories(allCats);

    // Remap pending rows whose raw type differs from the confirmed slug
    let updated = [...pendingRows];
    for (const t of toAdd) {
      if (t.raw !== t.slug) {
        updated = updated.map(r => r.productType === t.raw ? { ...r, productType: t.slug } : r);
      }
    }

    const validSlugs = new Set(allCats.map(c => c.slug));
    const finalValid: ValidRow[]   = [];
    const movedToUncat: ValidRow[] = [];
    for (const r of updated) {
      if (validSlugs.has(r.productType)) finalValid.push(r);
      else movedToUncat.push({ ...r, productType: '' });
    }

    setValidRows(finalValid);
    const newUncat = [...uncategorizedRows, ...movedToUncat];
    setUncategorizedRows(newUncat);
    setUncatPage(0);
    setStep(newUncat.length > 0 ? 3 : 4);
  };

  // ── Step 3 → 4 ────────────────────────────────────────────────────────────

  const proceedFromCategories = () => {
    const newlyAssigned: ValidRow[] = [];
    const newlySkipped: ValidRow[]  = [];
    let noCategory = 0;

    uncategorizedRows.forEach((r, idx) => {
      const slug = catAssignments[idx];
      if (!slug) { noCategory++; return; }
      if (existingNames.has(nameKey(r.productName, r.brand))) {
        newlySkipped.push(r);
      } else {
        newlyAssigned.push({ ...r, productType: slug });
      }
    });

    setValidRows(prev => [...prev, ...newlyAssigned]);
    setSkippedRows(prev => [...prev, ...newlySkipped]);
    setUncatSkipped(noCategory);
    setStep(4);
  };

  // ── Import ─────────────────────────────────────────────────────────────────

  const doImport = async () => {
    if (!validRows.length) return;

    // The doc ID is type__brand__code — rows resolving to the same ID would
    // silently overwrite each other (or an existing product), so drop
    // duplicates here and report them instead of writing blind.
    const seenIds = new Set<string>();
    const toWrite: ValidRow[] = [];
    let collided = 0;
    for (const r of validRows) {
      const id = makeId(r.productType, r.brand, r.productCode, r.productName);
      if (seenIds.has(id) || existingIds.has(id)) { collided++; continue; }
      seenIds.add(id);
      toWrite.push(r);
    }

    if (!toWrite.length) {
      alert('Eklenecek ürün kalmadı: tüm satırlar mevcut ürünlerle çakışıyor.');
      return;
    }
    if (!confirm(
      `${toWrite.length} yeni ürün eklenecek` +
      (skippedRows.length ? `, ${skippedRows.length} mevcut ürün atlanacak` : '') +
      (collided ? `, ${collided} satır çakışma (aynı ürün kimliği) nedeniyle atlanacak` : '') +
      `. Devam edilsin mi?`
    )) return;

    setImporting(true);
    setProgress(0);
    let success = 0, failed = 0;
    for (let i = 0; i < toWrite.length; i++) {
      const r = toWrite[i];
      try {
        const id = makeId(r.productType, r.brand, r.productCode, r.productName);
        await setDoc(doc(db, 'products', id), {
          productType: r.productType, brand: r.brand,
          productCode: r.productCode, productName: r.productName,
          price: r.price, img: r.img, logo: r.logo,
          dealerLink: r.dealerLink, listeAdi: r.listeAdi,
          depth: r.depth, width: r.width, height: r.height,
          listTitle: [], listValue: [], isActive: true,
        });
        success++;
      } catch { failed++; }
      setProgress(Math.round(((i + 1) / toWrite.length) * 100));
      if (i < toWrite.length - 1) await new Promise(r => setTimeout(r, 50));
    }
    setDone({ success, failed, collided });
    setImporting(false);
  };

  // ── Drag-select handlers ───────────────────────────────────────────────────

  const handleCatMouseDown = (idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartRef.current  = idx;
    setCatSelected(new Set([idx]));
    setCatActiveIdx(idx);
    // preventScroll: avoid scrolling the table into view on focus, which would
    // fire spurious mouseenter events and extend the selection unintentionally.
    catRowsRef.current?.focus({ preventScroll: true });
  };

  const handleCatMouseEnter = (idx: number) => {
    if (!isDraggingRef.current || dragStartRef.current === null) return;
    const start = dragStartRef.current;
    const min = Math.min(start, idx), max = Math.max(start, idx);
    const next = new Set<number>();
    for (let i = min; i <= max; i++) next.add(i);
    setCatSelected(next);
    setCatActiveIdx(idx);
  };

  // Keyboard range select: click a row, then Shift+↑/↓ extends the selection.
  const onCatKeyDown = (e: React.KeyboardEvent) => {
    if (catActiveIdx === null || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
    e.preventDefault();
    const dir = e.key === 'ArrowDown' ? 1 : -1;
    const next = Math.min(uncatEnd - 1, Math.max(uncatStart, catActiveIdx + dir));
    if (e.shiftKey) {
      setCatSelected(prev => {
        const set = new Set(prev);
        for (let k = Math.min(catActiveIdx, next); k <= Math.max(catActiveIdx, next); k++) set.add(k);
        return set;
      });
    }
    setCatActiveIdx(next);
    // Keep a few rows of lookahead visible beyond the cursor.
    const lookAt = Math.min(uncatEnd - 1, Math.max(uncatStart, next + dir * 4));
    catRowsRef.current?.querySelector(`[data-idx="${lookAt}"]`)?.scrollIntoView({ block: 'nearest' });
  };

  const assignCategory = (slug: string) => {
    if (!slug || catSelected.size === 0) return;
    setCatAssignments(prev => {
      const next = { ...prev };
      for (const idx of catSelected) next[idx] = slug;
      return next;
    });
  };

  const createAndAssignCategory = async () => {
    const slug = newCatSlug.trim();
    const title = newCatTitle.trim();
    if (!slug || !title) return;
    if (categories.some(c => c.slug === slug)) {
      alert('Bu slug zaten mevcut: ' + slug);
      return;
    }
    setCreatingCat(true);
    try {
      await setDoc(doc(db, 'categories', slug), {
        title, img: [], brand: [], brandImg: [], link: [], order: 999,
      });
    } finally {
      setCreatingCat(false);
    }
    const newCat = { slug, title };
    setCategories(prev => [...prev, newCat].sort((a, b) => a.title.localeCompare(b.title, 'tr')));
    if (catSelected.size > 0) {
      setCatAssignments(prev => {
        const next = { ...prev };
        for (const idx of catSelected) next[idx] = slug;
        return next;
      });
    }
    setNewCatTitle('');
    setNewCatSlug('');
    setShowNewCatForm(false);
  };

  // ── Step counter ──────────────────────────────────────────────────────────

  const hasNewTypesStep = unknownTypes.length > 0;
  const hasUncatStep    = uncategorizedRows.length > 0;
  const totalSteps  = 2 + (hasNewTypesStep ? 1 : 0) + (hasUncatStep ? 1 : 0) + 1;
  const displayStep = step === 1 ? 1
    : step === 2 ? 2
    : step === 'newtypes' ? 3
    : step === 3 ? (hasNewTypesStep ? 4 : 3)
    : totalSteps;

  // ── Category-assignment pagination ────────────────────────────────────────
  const uncatPageCount = Math.max(1, Math.ceil(uncategorizedRows.length / UNCAT_PAGE_SIZE));
  const uncatStart = uncatPage * UNCAT_PAGE_SIZE;
  const uncatEnd = Math.min(uncatStart + UNCAT_PAGE_SIZE, uncategorizedRows.length);
  const goUncatPage = (p: number) => { setUncatPage(Math.min(uncatPageCount - 1, Math.max(0, p))); setCatActiveIdx(null); };

  const uncatPager = uncatPageCount > 1 ? (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
      <button type="button" className="admin-btn admin-btn-sm" onClick={() => goUncatPage(0)} disabled={uncatPage === 0}>«</button>
      <button type="button" className="admin-btn admin-btn-sm" onClick={() => goUncatPage(uncatPage - 1)} disabled={uncatPage === 0}>‹ Önceki</button>
      <span style={{ fontSize: 13, color: '#555' }}>
        Sayfa <strong>{uncatPage + 1}</strong> / {uncatPageCount}
        &nbsp;·&nbsp; {uncatStart + 1}–{uncatEnd} / {uncategorizedRows.length}
      </span>
      <button type="button" className="admin-btn admin-btn-sm" onClick={() => goUncatPage(uncatPage + 1)} disabled={uncatPage >= uncatPageCount - 1}>Sonraki ›</button>
      <button type="button" className="admin-btn admin-btn-sm" onClick={() => goUncatPage(uncatPageCount - 1)} disabled={uncatPage >= uncatPageCount - 1}>»</button>
    </div>
  ) : null;

  // ── Done screen ───────────────────────────────────────────────────────────

  if (done) {
    return (
      <div className="admin-page">
        <h2 className="admin-page-title">Excel İçe Aktarma</h2>
        <div className="admin-form" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 48 }}>{done.failed === 0 ? '✅' : '⚠️'}</p>
          <h3 style={{ margin: '0 0 8px' }}>{done.failed === 0 ? 'Tamamlandı!' : 'Tamamlandı (uyarılarla)'}</h3>
          <p style={{ color: '#555' }}>
            {done.success} ürün içe aktarıldı
            {done.failed > 0 ? `, ${done.failed} ürün başarısız` : ''}
            {done.collided > 0 ? `, ${done.collided} satır çakışma nedeniyle atlandı` : ''}.
          </p>
          <button className="admin-btn admin-btn-primary" onClick={() => navigate('/admin/products')}>
            Ürünlere Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Excel İçe Aktar</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#888' }}>Adım {displayStep}/{totalSteps}</span>
          <button className="admin-btn" onClick={() => navigate('/admin/products')}>İptal</button>
        </div>
      </div>

      {/* ── Step 1: Upload ──────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="admin-form">
          <div
            className={`admin-upload-area${dragOver ? ' drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            onClick={() => document.getElementById('xlsxFileInput')?.click()}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
            <h3 style={{ margin: '0 0 6px' }}>Excel Dosyası Seçin</h3>
            <p style={{ color: '#888', margin: '0 0 16px', fontSize: 14 }}>Sürükleyip bırakın veya tıklayın</p>
            <p style={{ color: '#aaa', fontSize: 12 }}>.xlsx, .xls, .csv desteklenir</p>
            <input id="xlsxFileInput" type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
          {parseError && <p className="admin-error" style={{ marginTop: 12 }}>{parseError}</p>}
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button className="admin-btn admin-btn-sm" onClick={downloadTemplate}>Şablon İndir</button>
          </div>
        </div>
      )}

      {/* ── Step 2: Column mapping ──────────────────────────────────────────── */}
      {step === 2 && (
        <div className="admin-form" style={{ maxWidth: 900 }}>
          <p style={{ marginTop: 0, color: '#555', fontSize: 14 }}>
            <strong>{fileName}</strong> — {rawRows.length} satır, {headers.length} sütun. Sütunları aşağıdaki alanlara eşleştirin.
          </p>
          <div className="admin-table-wrapper" style={{ marginBottom: 20 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Excel Sütunu</th><th>Ürün Alanı</th><th>Örnek Veri</th>
                </tr>
              </thead>
              <tbody>
                {headers.map(header => (
                  <tr key={header}>
                    <td><strong>{header}</strong></td>
                    <td>
                      <select
                        value={mapping[header] || ''}
                        onChange={e => setMapping(prev => {
                          const next = { ...prev };
                          if (e.target.value) next[header] = e.target.value as KancaField;
                          else delete next[header];
                          return next;
                        })}
                        style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ddd', fontSize: 13 }}
                      >
                        <option value="">— Eşleştirme —</option>
                        {(Object.entries(FIELD_LABELS) as [KancaField, string][]).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ color: '#888', fontSize: 12 }}>
                      {String(rawRows[0]?.[header] ?? '').slice(0, 40)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 12, color: '#888', margin: '0 0 16px' }}>
            * işaretli alanlar zorunludur. Ürün Tipi eksik olanlar sonraki adımda atanabilir.
          </p>
          <div className="admin-form-actions">
            <button className="admin-btn" onClick={() => setStep(1)}>Geri</button>
            <button className="admin-btn admin-btn-primary" onClick={proceed} disabled={proceeding}>
              {proceeding ? 'Kontrol ediliyor...' : 'Devam Et →'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step newtypes: New product types ───────────────────────────────── */}
      {step === 'newtypes' && (
        <div className="admin-form" style={{ maxWidth: 900 }}>
          <p style={{ marginTop: 0, fontSize: 14, color: '#555' }}>
            Aşağıdaki ürün tipleri sistemde mevcut değil. Slug ve görünen adı düzenleyin;
            eklemek istemediklerinizi <strong>Atla</strong> olarak işaretleyin.
          </p>

          <div className="admin-table-wrapper" style={{ marginBottom: 12 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Excel'deki Değer</th>
                  <th>Slug (ID)</th>
                  <th>Görünen Ad</th>
                  <th style={{ width: 80, textAlign: 'center' }}>Durum</th>
                </tr>
              </thead>
              <tbody>
                {unknownTypes.map((t, idx) => (
                  <tr key={idx} style={{ opacity: t.skip ? 0.4 : 1 }}>
                    <td>
                      <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
                        {t.raw}
                      </code>
                    </td>
                    <td>
                      <input
                        value={t.slug}
                        disabled={t.skip}
                        onChange={e => updateUnknownType(idx, 'slug', e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ddd', fontSize: 13, fontFamily: 'monospace', width: '100%', boxSizing: 'border-box' }}
                      />
                    </td>
                    <td>
                      <input
                        value={t.title}
                        disabled={t.skip}
                        onChange={e => updateUnknownType(idx, 'title', e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ddd', fontSize: 13, width: '100%', boxSizing: 'border-box' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="admin-btn admin-btn-sm"
                        style={t.skip ? { color: '#15803d', borderColor: '#15803d' } : { color: '#888' }}
                        onClick={() => toggleSkip(idx)}
                      >
                        {t.skip ? 'Ekle' : 'Atla'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ fontSize: 13, color: '#555', margin: '0 0 16px' }}>
            {unknownTypes.filter(t => !t.skip).length} tip eklenecek
            {unknownTypes.filter(t => t.skip).length > 0 && `, ${unknownTypes.filter(t => t.skip).length} tip atlanacak`}.
          </p>

          <div className="admin-form-actions">
            <button className="admin-btn" onClick={() => setStep(2)} disabled={savingType}>Geri</button>
            <button className="admin-btn admin-btn-primary" onClick={finishNewTypes} disabled={savingType}>
              {savingType ? 'Kaydediliyor...' : 'Onayla ve Devam Et →'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Category assignment ─────────────────────────────────────── */}
      {step === 3 && (
        <div className="admin-form" style={{ maxWidth: 900 }}>
          <p style={{ marginTop: 0, fontSize: 14, color: '#555' }}>
            <strong>{uncategorizedRows.length}</strong> ürünün Ürün Tipi bulunamadı.
            Satırları sürükleyerek (veya bir satıra tıklayıp <kbd>Shift</kbd> + <kbd>↑</kbd>/<kbd>↓</kbd> ile) seçin,
            ardından toplu kategori atayın. Kategori atanmayanlar içe aktarılmayacak.
          </p>

          <div style={{
            display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
            padding: '10px 14px', background: '#f8f9fa', borderRadius: 8, marginBottom: 12,
          }}>
            <span style={{ fontSize: 13, color: '#555', minWidth: 120 }}>
              {catSelected.size > 0 ? `${catSelected.size} satır seçili` : 'Satır seçmek için sürükleyin'}
            </span>
            <select
              value=""
              disabled={catSelected.size === 0}
              onChange={e => { assignCategory(e.target.value); (e.target as HTMLSelectElement).value = ''; }}
              style={{ padding: '5px 10px', borderRadius: 4, border: '1px solid #ddd', fontSize: 13, flex: 1, maxWidth: 260 }}
            >
              <option value="">Seçilenlere kategori ata...</option>
              {categories.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}
            </select>
            <button
              className="admin-btn admin-btn-sm"
              style={{ whiteSpace: 'nowrap' }}
              onClick={() => { setShowNewCatForm(v => !v); setNewCatTitle(''); setNewCatSlug(''); }}
            >
              + Yeni Kategori
            </button>
            {catSelected.size > 0 && (
              <button className="admin-btn admin-btn-sm" onClick={() => setCatSelected(new Set())}>
                Seçimi Temizle
              </button>
            )}
            <button
              className="admin-btn admin-btn-sm"
              style={{ marginLeft: 'auto' }}
              onClick={() => setCatSelected(new Set(uncategorizedRows.map((_, i) => i)))}
            >
              Tümünü Seç
            </button>
          </div>

          {showNewCatForm && (
            <div style={{
              padding: '14px 16px', background: '#fff7ed', border: '1px solid #fed7aa',
              borderRadius: 8, marginBottom: 12, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>Kategori Adı</label>
                <input
                  type="text"
                  value={newCatTitle}
                  onChange={e => {
                    setNewCatTitle(e.target.value);
                    setNewCatSlug(slugify(e.target.value));
                  }}
                  placeholder="örn. Vana ve Armatürler"
                  style={{ padding: '5px 10px', borderRadius: 4, border: '1px solid #ddd', fontSize: 13, width: 220 }}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>Slug (sistem adı)</label>
                <input
                  type="text"
                  value={newCatSlug}
                  onChange={e => setNewCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="vana_ve_armaturler"
                  style={{ padding: '5px 10px', borderRadius: 4, border: '1px solid #ddd', fontSize: 13, fontFamily: 'monospace', width: 200 }}
                />
              </div>
              <button
                className="admin-btn admin-btn-primary admin-btn-sm"
                onClick={createAndAssignCategory}
                disabled={creatingCat || !newCatTitle.trim() || !newCatSlug.trim()}
              >
                {creatingCat ? 'Oluşturuluyor...' : catSelected.size > 0 ? 'Oluştur ve Ata' : 'Oluştur'}
              </button>
              <button className="admin-btn admin-btn-sm" onClick={() => setShowNewCatForm(false)}>
                İptal
              </button>
              {catSelected.size > 0 && (
                <span style={{ fontSize: 12, color: '#92400e' }}>
                  Seçili {catSelected.size} satıra atanacak
                </span>
              )}
            </div>
          )}

          {(() => {
            const assigned = Object.keys(catAssignments).length;
            return assigned > 0 ? (
              <p style={{ fontSize: 13, color: '#15803d', margin: '0 0 10px' }}>
                ✓ {assigned} ürüne kategori atandı, {uncategorizedRows.length - assigned} ürün atanmadı (atlanacak)
              </p>
            ) : null;
          })()}

          {uncatPager}
          <div
            className="admin-table-wrapper"
            style={{ marginBottom: 20, userSelect: 'none', outline: 'none' }}
            ref={catRowsRef}
            tabIndex={0}
            onKeyDown={onCatKeyDown}
          >
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Marka</th><th>Ürün Kodu</th><th>Ürün Adı</th><th>Atanan Kategori</th>
                </tr>
              </thead>
              <tbody>
                {uncategorizedRows.slice(uncatStart, uncatEnd).map((r, j) => {
                  const idx = uncatStart + j;
                  const slug = catAssignments[idx];
                  const catTitle = slug ? (categories.find(c => c.slug === slug)?.title ?? slug) : '';
                  const isSelected = catSelected.has(idx);
                  return (
                    <tr
                      key={r._row}
                      data-idx={idx}
                      className={isSelected ? 'admin-row-selected' : slug ? 'admin-row-assigned' : ''}
                      onMouseDown={e => handleCatMouseDown(idx, e)}
                      onMouseEnter={() => handleCatMouseEnter(idx)}
                      style={{
                        cursor: 'pointer',
                        outline: isSelected ? '2px solid #3b82f6' : idx === catActiveIdx ? '2px dashed #93c5fd' : undefined,
                        outlineOffset: '-2px',
                      }}
                    >
                      <td style={{ color: '#aaa', fontSize: 12 }}>{r._row}</td>
                      <td>{r.brand}</td>
                      <td className="admin-mono">{r.productCode}</td>
                      <td>{r.productName}</td>
                      <td style={{ fontSize: 13, color: slug ? '#15803d' : '#ccc', fontWeight: slug ? 600 : 400 }}>
                        {catTitle || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {uncatPager}

          <div className="admin-form-actions">
            <button className="admin-btn" onClick={() => setStep(hasNewTypesStep ? 'newtypes' : 2)}>Geri</button>
            <button className="admin-btn admin-btn-primary" onClick={proceedFromCategories}>Devam Et →</button>
          </div>
        </div>
      )}

      {/* ── Step 4: Preview & import ────────────────────────────────────────── */}
      {step === 4 && (
        <div className="admin-form" style={{ maxWidth: 900 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            <div style={{ background: '#d4edda', borderRadius: 8, padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#155724' }}>{validRows.length}</div>
              <div style={{ fontSize: 13, color: '#155724' }}>Yeni Eklenecek</div>
            </div>
            <div style={{ background: '#e2e3ff', borderRadius: 8, padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#3730a3' }}>{skippedRows.length}</div>
              <div style={{ fontSize: 13, color: '#3730a3' }}>Zaten Mevcut</div>
            </div>
            <div style={{ background: '#f8d7da', borderRadius: 8, padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#721c24' }}>{errorRows.length}</div>
              <div style={{ fontSize: 13, color: '#721c24' }}>Hatalı</div>
            </div>
            <div style={{ background: '#fff3cd', borderRadius: 8, padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#856404' }}>
                {validRows.filter(r => !r.price).length}
              </div>
              <div style={{ fontSize: 13, color: '#856404' }}>Fiyatsız</div>
            </div>
          </div>

          {skippedRows.length > 0 && (
            <div style={{ background: '#e2e3ff', borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <strong style={{ color: '#3730a3' }}>Zaten mevcut — atlanacak ({skippedRows.length}):</strong>
              <ul style={{ margin: '8px 0 0', paddingLeft: 20, fontSize: 13, color: '#3730a3' }}>
                {skippedRows.slice(0, 10).map(r => (
                  <li key={r._row}>{r.productName} ({r.productCode})</li>
                ))}
                {skippedRows.length > 10 && <li>...ve {skippedRows.length - 10} ürün daha</li>}
              </ul>
            </div>
          )}

          {errorRows.length > 0 && (
            <div style={{ background: '#f8d7da', borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <strong style={{ color: '#721c24' }}>Hatalı satırlar (içe aktarılmayacak):</strong>
              <ul style={{ margin: '8px 0 0', paddingLeft: 20, fontSize: 13, color: '#721c24' }}>
                {errorRows.slice(0, 10).map(e => (
                  <li key={e.row}>Satır {e.row}: eksik alanlar — {e.fields.join(', ')}</li>
                ))}
                {errorRows.length > 10 && <li>...ve {errorRows.length - 10} satır daha</li>}
              </ul>
            </div>
          )}

          {uncatSkipped > 0 && (
            <p style={{ fontSize: 13, color: '#888', margin: '0 0 16px' }}>
              ℹ️ {uncatSkipped} ürün kategori atanmadığı için içe aktarılmayacak.
            </p>
          )}

          {validRows.length > 0 && (
            <div className="admin-table-wrapper" style={{ marginBottom: 20 }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ürün Tipi</th><th>Marka</th><th>Kod</th><th>Ürün Adı</th><th>Fiyat</th>
                  </tr>
                </thead>
                <tbody>
                  {validRows.slice(0, 10).map(r => (
                    <tr key={r._row}>
                      <td className="admin-mono">{r.productType}</td>
                      <td>{r.brand}</td>
                      <td className="admin-mono">{r.productCode}</td>
                      <td>{r.productName}</td>
                      <td>{r.price ? r.price.toLocaleString('tr-TR') + ' ₺' : <span style={{ color: '#bbb' }}>—</span>}</td>
                    </tr>
                  ))}
                  {validRows.length > 10 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
                        ...ve {validRows.length - 10} ürün daha
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {importing && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'rgb(255,82,82)', transition: 'width 0.2s' }} />
              </div>
              <p style={{ fontSize: 13, color: '#555', margin: '6px 0 0' }}>İçe aktarılıyor... {progress}%</p>
            </div>
          )}

          <div className="admin-form-actions">
            <button className="admin-btn" onClick={() => setStep(hasUncatStep ? 3 : hasNewTypesStep ? 'newtypes' : 2)} disabled={importing}>
              Geri
            </button>
            <button
              className="admin-btn admin-btn-primary"
              onClick={doImport}
              disabled={importing || validRows.length === 0}
            >
              {importing ? 'Aktarılıyor...' : `${validRows.length} Ürünü İçe Aktar`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
