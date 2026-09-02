import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { read, utils } from 'xlsx';
import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { fold } from '../searchFold.ts';
import type { Product } from '../types/firestore';

// ── Utilities ──────────────────────────────────────────────────────────────

type PriceField = 'productCode' | 'productName' | 'price' | 'listeAdi';

const FIELD_LABELS: Record<PriceField, string> = {
  productCode: 'Ürün Kodu',
  productName: 'Ürün Adı',
  price: 'Fiyat (TRY) *',
  listeAdi: 'Liste Adı',
};

// listeAdi is checked first on purpose: autoDetect stops at the first field a
// header matches, and headers like "Fiyat Listesi" contain the price keyword too.
const KEYWORDS: Record<PriceField, string[]> = {
  listeAdi: ['liste adı', 'liste adi', 'listeadi', 'list name', 'listename', 'fiyat listesi', 'liste'],
  productCode: ['ürün kodu', 'urun kodu', 'kod', 'sku', 'code', 'model', 'productcode'],
  productName: ['ürün adı', 'urun adi', 'isim', 'name', 'productname'],
  price: ['fiyat', 'price', 'tutar', 'nakit'],
};

function normalize(s: string): string {
  return String(s || '')
    .toLowerCase()
    .replace(/İ/g, 'i').replace(/I/g, 'i')
    .replace(/ş/g, 's').replace(/Ş/g, 's')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/Ü/g, 'u')
    .replace(/ö/g, 'o').replace(/Ö/g, 'o')
    .replace(/ç/g, 'c').replace(/Ç/g, 'c')
    .trim();
}

// Header text only. normalize() leaves the dotless "ı" alone, so "Liste Adı"
// and "Ürün Adı" never matched their "...adi" keywords. Folding it here fixes
// detection without touching normalize(), which product code/name matching and
// the existing list grouping both depend on behaving exactly as they do today.
function normalizeHeader(s: string): string {
  return normalize(s).replace(/ı/g, 'i');
}

function autoDetect(headers: string[]): Record<string, PriceField> {
  const mapping: Record<string, PriceField> = {};
  for (const header of headers) {
    const n = normalizeHeader(header);
    for (const [field, kws] of Object.entries(KEYWORDS) as [PriceField, string[]][]) {
      if (kws.some(k => n.includes(k))) { mapping[header] = field; break; }
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
  mapping: Record<string, PriceField>,
  field: PriceField
): string {
  const cols = Object.keys(mapping).filter(c => mapping[c] === field);
  const exactKod = cols.find(c => normalizeHeader(c) === 'kod');
  if (exactKod) return String(row[exactKod] ?? '').trim();
  let value = '';
  for (const c of cols) {
    const v = String(row[c] ?? '').trim();
    if (v) value = v;
  }
  return value;
}

function makeId(productType: string, brand: string, productCode: string) {
  return `${productType}__${brand}__${productCode}`.replace(/\s+/g, '_');
}

// Most frequent non-empty value among the products for a given field.
function dominant(products: FirestoreProduct[], field: 'productType' | 'brand'): string {
  const counts: Record<string, number> = {};
  for (const p of products) {
    const v = (p[field] || '').trim();
    if (v) counts[v] = (counts[v] || 0) + 1;
  }
  let best = '', bestN = 0;
  for (const [v, n] of Object.entries(counts)) {
    if (n > bestN) { best = v; bestN = n; }
  }
  return best;
}

// ── Types ──────────────────────────────────────────────────────────────────

type ExcelRow = { productCode: string; productName: string; price: number; listeAdi: string };
type MatchType = 'code' | 'name';

type MatchedItem = {
  productId: string;
  productCode: string;
  newCode: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  matchType: MatchType;
  // From the Excel's own Liste Adı column; empty when that column wasn't
  // mapped (or the cell was blank) — resolved against the fallback at write time.
  newListeAdi: string;
};

type UnmatchedProduct = { productId: string; productCode: string; productName: string; oldPrice: number };
type UnmatchedExcelRow = { code: string; name: string; price: number; listeAdi: string };

type FirestoreProduct = Product & { id: string };

type ListOption = { name: string; count: number };
type AddDecision = { add: boolean; productType: string; brand: string; code: string };

// ── Matching ───────────────────────────────────────────────────────────────

function findMatch(product: FirestoreProduct, rows: ExcelRow[]): { row: ExcelRow; type: MatchType } | null {
  const normCode = normalize(product.productCode);
  const normName = normalize(product.productName);

  // 1. Exact code match
  const byCode = rows.find(r => r.productCode && normalize(r.productCode) === normCode);
  if (byCode) return { row: byCode, type: 'code' };

  // 2. Name fallback — exact or one contains the other
  const byName = rows.find(r => {
    if (!r.productName) return false;
    const rn = normalize(r.productName);
    return rn === normName || rn.includes(normCode) || normName.includes(rn);
  });
  return byName ? { row: byName, type: 'name' } : null;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function AdminPriceUpdate() {
  const navigate = useNavigate();

  const [step, setStep]           = useState<1 | 2 | 3 | 4>(1);
  const [dragOver, setDragOver]   = useState(false);
  const [parseError, setParseError] = useState('');

  // ── Loaded once on mount ──
  const [loading, setLoading]         = useState(true);
  const [loadError, setLoadError]     = useState('');
  const [allProducts, setAllProducts] = useState<FirestoreProduct[]>([]);
  const [listOptions, setListOptions] = useState<ListOption[]>([]);
  const [categories, setCategories]   = useState<{ slug: string; title: string }[]>([]);
  const [brands, setBrands]           = useState<string[]>([]);
  const [brandLogos, setBrandLogos]   = useState<Record<string, string>>({});

  // ── Selected list (step 1) ──
  const [listName, setListName]                   = useState('');
  const [firestoreProducts, setFirestoreProducts] = useState<FirestoreProduct[]>([]);
  const [defaultType, setDefaultType]             = useState('');
  const [defaultBrand, setDefaultBrand]           = useState('');

  // ── Step 1 mode toggle: pick a whole "Liste Adı" or hand-pick products ──
  const [mode, setMode] = useState<'list' | 'products'>('list');
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerType, setPickerType]     = useState('');
  const [pickerBrand, setPickerBrand]   = useState('');
  const [pickerSelected, setPickerSelected] = useState<Set<string>>(new Set());

  const pickerFiltered = allProducts.filter(p => {
    if (pickerType && p.productType !== pickerType) return false;
    if (pickerBrand && p.brand !== pickerBrand) return false;
    const q = fold(pickerSearch);
    if (q && !fold(p.productName).includes(q) && !fold(p.productCode).includes(q)) return false;
    return true;
  });

  const togglePicker = (id: string) => setPickerSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const continueWithPicked = () => {
    const products = allProducts.filter(p => pickerSelected.has(p.id));
    if (products.length === 0) return;
    setListName(`${products.length} seçili ürün`);
    setFirestoreProducts(products);
    setDefaultType(dominant(products, 'productType'));
    setDefaultBrand(dominant(products, 'brand'));
    setStep(2);
  };

  // ── Manual price touch-up (products mode, step 2) ──
  const [manualPrices, setManualPrices]   = useState<Record<string, string>>({});
  const [manualSaving, setManualSaving]   = useState(false);
  const [manualProgress, setManualProgress] = useState(0);
  const [manualDone, setManualDone]       = useState('');

  useEffect(() => {
    if (mode === 'products' && step === 2) {
      const init: Record<string, string> = {};
      firestoreProducts.forEach(p => { init[p.id] = p.price ? String(p.price) : ''; });
      setManualPrices(init);
      setManualDone('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, step]);

  const manualChanges = () => firestoreProducts
    .map(p => ({ p, v: parseFloat((manualPrices[p.id] ?? '').replace(',', '.')) }))
    .filter(({ p, v }) => !isNaN(v) && v >= 0 && v !== p.price);

  const manualChangedCount = manualChanges().length;

  const saveManualPrices = async () => {
    const changes = manualChanges();
    if (changes.length === 0) return;
    if (!confirm(`${changes.length} ürünün fiyatı doğrudan güncellenecek. Devam edilsin mi?`)) return;

    setManualSaving(true);
    setManualProgress(0);
    let ok = 0, fail = 0;
    for (let i = 0; i < changes.length; i++) {
      try {
        await updateDoc(doc(db, 'products', changes[i].p.id), { price: changes[i].v });
        ok++;
      } catch {
        fail++;
      }
      setManualProgress(Math.round(((i + 1) / changes.length) * 100));
    }
    const byId = new Map(changes.map(c => [c.p.id, c.v]));
    setFirestoreProducts(prev => prev.map(p => byId.has(p.id) ? { ...p, price: byId.get(p.id)! } : p));
    setAllProducts(prev => prev.map(p => byId.has(p.id) ? { ...p, price: byId.get(p.id)! } : p));
    setManualSaving(false);
    setManualDone(`${ok} ürünün fiyatı güncellendi${fail ? `, ${fail} başarısız` : ''}.`);
  };

  // Lighter "back" from step 2 that keeps picker/list selections intact.
  const backToStep1 = () => {
    setStep(1);
    setFileName(''); setHeaders([]); setRawRows([]); setMapping({}); setNewListName('');
    setParseError('');
  };

  // ── Upload + mapping (steps 2-3) ──
  const [fileName, setFileName]   = useState('');
  const [headers, setHeaders]     = useState<string[]>([]);
  const [rawRows, setRawRows]     = useState<Record<string, any>[]>([]);
  const [mapping, setMapping]     = useState<Record<string, PriceField>>({});
  // Defaults to the uploaded file's name so "Liste Adı" tracks the latest
  // pricing source; admin can override before confirming.
  const [newListName, setNewListName] = useState('');

  // ── Preview (step 4) ──
  const [matched, setMatched]                     = useState<MatchedItem[]>([]);
  const [unmatchedProducts, setUnmatchedProducts] = useState<UnmatchedProduct[]>([]);
  const [unmatchedExcel, setUnmatchedExcel]       = useState<UnmatchedExcelRow[]>([]);
  const [addDecisions, setAddDecisions]           = useState<Record<number, AddDecision>>({});

  const [updating, setUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone]         = useState<{ updated: number; added: number; failed: number } | null>(null);

  // ── Mount: load products, list names, categories, brands ──────────────────

  useEffect(() => {
    (async () => {
      try {
        const [prodSnap, catSnap, brandSnap] = await Promise.all([
          getDocs(collection(db, 'products')),
          getDocs(collection(db, 'categories')),
          getDocs(collection(db, 'brandGroups')),
        ]);

        const products = prodSnap.docs.map(d => ({ id: d.id, ...(d.data() as Product) }));
        setAllProducts(products);

        // Distinct list names (grouped by normalized value) with product counts.
        const groups = new Map<string, ListOption>();
        for (const p of products) {
          const raw = (p.listeAdi || '').trim();
          if (!raw) continue;
          const key = normalize(raw);
          const existing = groups.get(key);
          if (existing) existing.count++;
          else groups.set(key, { name: raw, count: 1 });
        }
        setListOptions(
          [...groups.values()].sort((a, b) => a.name.localeCompare(b.name, 'tr'))
        );

        const cats = catSnap.docs.map(d => ({ slug: d.id, title: (d.data().title as string) || d.id }));
        cats.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
        setCategories(cats);

        // brandGroups only holds a handful of legacy cover-image docs, so it misses
        // most real brands — merge it with the brands the products actually use.
        const brandSet = new Set(
          brandSnap.docs.map(d => ((d.data().brand as string) || '').trim()).filter(Boolean)
        );
        products.forEach(p => {
          const b = (p.brand || '').trim();
          if (b) brandSet.add(b);
        });
        setBrands([...brandSet].sort((a, b) => a.localeCompare(b, 'tr')));

        // brand → logo map from existing products
        const logos: Record<string, string> = {};
        products.forEach(p => {
          if (p.brand && p.logo && !logos[p.brand]) logos[p.brand] = p.logo;
        });
        setBrandLogos(logos);
      } catch {
        setLoadError('Veriler yüklenemedi. Bağlantınızı kontrol edip sayfayı yenileyin.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Step 1: pick a list ───────────────────────────────────────────────────

  const selectList = (option: ListOption) => {
    const normKey = normalize(option.name);
    const products = allProducts.filter(p => normalize(p.listeAdi || '') === normKey);
    setListName(option.name);
    setFirestoreProducts(products);
    setDefaultType(dominant(products, 'productType'));
    setDefaultBrand(dominant(products, 'brand'));
    setStep(2);
  };

  // ── Step 2: upload + parse ────────────────────────────────────────────────

  const processFile = useCallback(async (file: File) => {
    setParseError('');
    try {
      setFileName(file.name);

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
      setMapping(autoDetect(hdrs));
      setNewListName(file.name.replace(/\.[^.]+$/, '').trim());
      setStep(3);
    } catch {
      setParseError('Dosya okunamadı. Lütfen geçerli bir Excel veya CSV dosyası seçin.');
    }
  }, []);

  const handleFile = (file: File) => {
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setParseError('Sadece .xlsx, .xls veya .csv dosyaları desteklenir.');
      return;
    }
    processFile(file);
  };

  // ── Step 3 → Step 4: build matches ────────────────────────────────────────

  const proceed = () => {
    const mappedFields = Object.values(mapping);
    if (!mappedFields.includes('price')) {
      alert('Fiyat sütunu eşleştirilmedi.');
      return;
    }
    if (!mappedFields.includes('productCode') && !mappedFields.includes('productName')) {
      alert('Ürün Kodu veya Ürün Adı sütunundan en az biri eşleştirilmeli.');
      return;
    }

    // No Liste Adı column → the file name becomes the tag for every touched
    // product. That silently re-groups the catalog, so make the admin say yes.
    if (!mappedFields.includes('listeAdi')) {
      const fallback = newListName.trim() || listName;
      if (!confirm(
        `Excel'de "Liste Adı" sütunu eşleştirilmedi.\n\n` +
        `Devam ederseniz güncellenen ve eklenen ürünlerin Liste Adı'sı dosya adına göre ` +
        `"${fallback}" olarak ayarlanacak.\n\n` +
        `Devam edilsin mi? (İptal ederseniz geri dönüp Liste Adı sütununu eşleştirebilirsiniz.)`
      )) return;
    }

    const excelRows: ExcelRow[] = rawRows.map(row => {
      const mapped: Partial<Record<PriceField, string>> = {};
      for (const field of new Set(Object.values(mapping))) {
        mapped[field] = pickMappedValue(row, mapping, field);
      }
      return {
        productCode: mapped.productCode || '',
        productName: mapped.productName || '',
        price: parseFloat((mapped.price || '0').replace(',', '.')) || 0,
        listeAdi: (mapped.listeAdi || '').trim(),
      };
    }).filter(r => r.price > 0);

    const matchedItems: MatchedItem[] = [];
    const unmatchedProds: UnmatchedProduct[] = [];
    const claimedRows = new Set<ExcelRow>();

    for (const product of firestoreProducts) {
      const result = findMatch(product, excelRows);
      if (result) {
        claimedRows.add(result.row);
        matchedItems.push({
          productId: product.id,
          productCode: product.productCode,
          newCode: result.row.productCode,
          productName: product.productName,
          oldPrice: product.price,
          newPrice: result.row.price,
          matchType: result.type,
          newListeAdi: result.row.listeAdi,
        });
      } else {
        unmatchedProds.push({
          productId: product.id,
          productCode: product.productCode,
          productName: product.productName,
          oldPrice: product.price,
        });
      }
    }

    const leftover = excelRows
      .filter(r => !claimedRows.has(r))
      .map(r => ({ code: r.productCode, name: r.productName, price: r.price, listeAdi: r.listeAdi }));

    // Default add-decision per leftover row: ignore, with smart defaults prefilled.
    const decisions: Record<number, AddDecision> = {};
    leftover.forEach((r, i) => {
      decisions[i] = { add: false, productType: defaultType, brand: defaultBrand, code: r.code };
    });

    setMatched(matchedItems);
    setUnmatchedProducts(unmatchedProds);
    setUnmatchedExcel(leftover);
    setAddDecisions(decisions);
    setBulkType(defaultType);
    setBulkBrand(defaultBrand);
    setPage(0);
    setActiveIdx(null);
    setStep(4);
  };

  const setDecision = (i: number, patch: Partial<AddDecision>) =>
    setAddDecisions(prev => ({ ...prev, [i]: { ...prev[i], ...patch } }));

  // Toggle the "add" flag on every unmatched row at once.
  const setAllAdd = (add: boolean) =>
    setAddDecisions(prev => {
      const next: Record<number, AddDecision> = {};
      for (const [k, d] of Object.entries(prev)) next[Number(k)] = { ...d, add };
      return next;
    });

  // Bulk category/brand for the toolbar, plus an apply-to-checked action.
  const [bulkType, setBulkType]   = useState('');
  const [bulkBrand, setBulkBrand] = useState('');

  // Pick a value in the bulk dropdown → immediately apply it to every checked row.
  const applyBulkField = (field: 'productType' | 'brand', val: string) => {
    if (field === 'productType') setBulkType(val); else setBulkBrand(val);
    if (!val) return;
    setAddDecisions(prev => {
      const next: Record<number, AddDecision> = {};
      for (const [k, d] of Object.entries(prev)) {
        next[Number(k)] = d.add ? { ...d, [field]: val } : d;
      }
      return next;
    });
  };

  const hasListColumn = Object.values(mapping).includes('listeAdi');
  // Rows the Excel supplies a Liste Adı for; the rest fall back to newListName.
  const listFromExcelCount =
    matched.filter(m => m.newListeAdi).length +
    unmatchedExcel.filter((r, i) => addDecisions[i]?.add && r.listeAdi).length;

  const codeFixCount = matched.filter(m => m.newCode && m.newCode !== m.productCode).length;
  const addCount = Object.values(addDecisions).filter(d => d.add).length;
  const allAdded = unmatchedExcel.length > 0 && addCount === unmatchedExcel.length;

  // ── Pagination for the new-products table ────────────────────────────────
  const PAGE_SIZE = 100;
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(unmatchedExcel.length / PAGE_SIZE));
  const pageStart = page * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, unmatchedExcel.length);

  // ── Range selection (click a row, then Shift+↑/↓ or Shift+click) ──────────
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const newRowsRef = useRef<HTMLDivElement>(null);

  const selectRange = (lo: number, hi: number) =>
    setAddDecisions(prev => {
      const next = { ...prev };
      for (let k = lo; k <= hi; k++) if (next[k]) next[k] = { ...next[k], add: true };
      return next;
    });

  const onRowClick = (i: number, shift: boolean) => {
    if (shift && activeIdx !== null) {
      selectRange(Math.min(activeIdx, i), Math.max(activeIdx, i));
    } else {
      setDecision(i, { add: true });
    }
    setActiveIdx(i);
    newRowsRef.current?.focus();
  };

  const onRowsKeyDown = (e: React.KeyboardEvent) => {
    if (activeIdx === null || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
    e.preventDefault();
    // Keep the cursor within the rows currently rendered on this page.
    const dir = e.key === 'ArrowDown' ? 1 : -1;
    const next = Math.min(pageEnd - 1, Math.max(pageStart, activeIdx + dir));
    if (e.shiftKey) selectRange(Math.min(activeIdx, next), Math.max(activeIdx, next));
    setActiveIdx(next);
    // Keep a few rows of lookahead visible beyond the cursor.
    const lookAt = Math.min(pageEnd - 1, Math.max(pageStart, next + dir * 4));
    newRowsRef.current?.querySelector(`[data-idx="${lookAt}"]`)?.scrollIntoView({ block: 'nearest' });
  };

  const goPage = (p: number) => { setPage(Math.min(pageCount - 1, Math.max(0, p))); setActiveIdx(null); };

  const pager = pageCount > 1 ? (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
      <button type="button" className="admin-btn" onClick={() => goPage(0)} disabled={page === 0}>«</button>
      <button type="button" className="admin-btn" onClick={() => goPage(page - 1)} disabled={page === 0}>‹ Önceki</button>
      <span style={{ fontSize: 13, color: '#555' }}>
        Sayfa <strong>{page + 1}</strong> / {pageCount}
        &nbsp;·&nbsp; {pageStart + 1}–{pageEnd} / {unmatchedExcel.length}
      </span>
      <button type="button" className="admin-btn" onClick={() => goPage(page + 1)} disabled={page >= pageCount - 1}>Sonraki ›</button>
      <button type="button" className="admin-btn" onClick={() => goPage(pageCount - 1)} disabled={page >= pageCount - 1}>»</button>
    </div>
  ) : null;

  // ── Step 4: confirm, update prices + create new products ──────────────────

  const doUpdate = async () => {
    if (!matched.length && addCount === 0) return;

    // Validate add rows: each needs a category, a brand, and a code (fallback to name).
    const toAdd: { code: string; name: string; price: number; productType: string; brand: string; listeAdi: string }[] = [];
    for (const [iStr, d] of Object.entries(addDecisions)) {
      if (!d.add) continue;
      const i = Number(iStr);
      const row = unmatchedExcel[i];
      const code = (d.code || '').trim() || normalize(row.name).replace(/\s+/g, '-');
      if (!d.productType || !d.brand) {
        alert(`"${row.name || row.code}" için kategori ve marka seçilmeli.`);
        return;
      }
      if (!code) {
        alert(`"${row.name || row.code}" için ürün kodu gerekli (boş bırakılamaz).`);
        return;
      }
      toAdd.push({ code, name: row.name, price: row.price, productType: d.productType, brand: d.brand, listeAdi: row.listeAdi });
    }

    const total = matched.length + toAdd.length;
    const listTag = newListName.trim() || listName;

    // Rows carrying their own Liste Adı keep it; the rest fall back to listTag.
    const fromExcel = matched.filter(m => m.newListeAdi).length + toAdd.filter(a => a.listeAdi).length;
    const listSummary = fromExcel === total
      ? `Liste Adı her ürün için Excel'deki değere ayarlanacak.`
      : fromExcel > 0
        ? `${fromExcel} ürünün Liste Adı'sı Excel'den alınacak, kalan ${total - fromExcel} ürün "${listTag}" olarak işaretlenecek.`
        : `Liste Adı "${listTag}" olarak işaretlenecek.`;

    if (!confirm(
      `${matched.length} ürünün fiyatı güncellenecek` +
      (codeFixCount ? ` (${codeFixCount} ürünün kodu da düzeltilecek)` : '') +
      `, ${toAdd.length} yeni ürün eklenecek. ${listSummary} Devam edilsin mi?`
    )) return;

    setUpdating(true);
    setProgress(0);
    let updated = 0, added = 0, failed = 0, processed = 0;

    const tick = async () => {
      processed++;
      setProgress(Math.round((processed / total) * 100));
      if (processed < total) await new Promise(r => setTimeout(r, 50));
    };

    for (const m of matched) {
      try {
        const patch: Record<string, any> = { price: m.newPrice, listeAdi: m.newListeAdi || listTag };
        // Only ever fill in/correct the code — never blank an existing one out
        // just because this particular row's Kod column happened to be empty.
        if (m.newCode && m.newCode !== m.productCode) patch.productCode = m.newCode;
        await updateDoc(doc(db, 'products', m.productId), patch);
        updated++;
      } catch {
        failed++;
      }
      await tick();
    }

    for (const a of toAdd) {
      try {
        const id = makeId(a.productType, a.brand, a.code);
        await setDoc(doc(db, 'products', id), {
          productType: a.productType,
          brand: a.brand,
          productCode: a.code,
          productName: a.name || a.code,
          price: a.price,
          img: '',
          logo: brandLogos[a.brand] || '',
          dealerLink: '',
          listeAdi: a.listeAdi || listTag,
          depth: '',
          width: '',
          height: '',
          listTitle: [],
          listValue: [],
          isActive: true,
        });
        added++;
      } catch {
        failed++;
      }
      await tick();
    }

    setDone({ updated, added, failed });
    setUpdating(false);
  };

  const reset = () => {
    setStep(1); setListName(''); setFirestoreProducts([]); setDefaultType(''); setDefaultBrand('');
    setFileName(''); setHeaders([]); setRawRows([]); setMapping({}); setNewListName('');
    setMatched([]); setUnmatchedProducts([]); setUnmatchedExcel([]); setAddDecisions({});
    setPage(0); setActiveIdx(null);
    setDone(null); setParseError(''); setProgress(0);
    setPickerSelected(new Set()); setPickerSearch(''); setPickerType(''); setPickerBrand('');
    setManualPrices({}); setManualDone('');
  };

  // ── Done screen ───────────────────────────────────────────────────────────

  if (done) {
    return (
      <div className="admin-page">
        <h2 className="admin-page-title">Fiyat Güncelleme</h2>
        <div className="admin-form" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 48 }}>{done.failed === 0 ? '✅' : '⚠️'}</p>
          <h3 style={{ margin: '0 0 8px' }}>{done.failed === 0 ? 'Tamamlandı!' : 'Tamamlandı (uyarılarla)'}</h3>
          <p style={{ color: '#555' }}>
            {done.updated} ürün güncellendi
            {done.added > 0 ? `, ${done.added} yeni ürün eklendi` : ''}
            {done.failed > 0 ? `, ${done.failed} işlem başarısız` : ''}.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
            <button className="admin-btn" onClick={reset}>Yeni Liste Seç</button>
            <button className="admin-btn admin-btn-primary" onClick={() => navigate('/admin/products')}>
              Ürünlere Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Fiyat Güncelleme</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {step === 1 && (
            <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setMode('list')}
                style={{
                  padding: '6px 12px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: mode === 'list' ? 'rgb(255,82,82)' : '#fff',
                  color: mode === 'list' ? '#fff' : '#333',
                }}
              >
                Liste Adı Seç
              </button>
              <button
                type="button"
                onClick={() => setMode('products')}
                style={{
                  padding: '6px 12px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: mode === 'products' ? 'rgb(255,82,82)' : '#fff',
                  color: mode === 'products' ? '#fff' : '#333',
                }}
              >
                Ürün Seç
              </button>
            </div>
          )}
          <span style={{ fontSize: 12, color: '#888' }}>Adım {step}/4</span>
          <button className="admin-btn" onClick={() => navigate('/admin/products')}>İptal</button>
        </div>
      </div>

      {/* ── Step 1: Select list ────────────────────────────────────────────── */}
      {step === 1 && mode === 'list' && (
        <div className="admin-form">
          <p style={{ marginTop: 0, fontSize: 14, color: '#555' }}>
            Fiyatlarını güncellemek istediğiniz <strong>liste adını</strong> seçin.
            Seçtikten sonra o listeye ait ürünleri görüp fiyat Excel'ini yükleyebilirsiniz.
          </p>

          {loading && <p style={{ color: '#888' }}>Yükleniyor…</p>}
          {loadError && <p className="admin-error">{loadError}</p>}

          {!loading && !loadError && listOptions.length === 0 && (
            <div style={{ padding: '12px 16px', background: '#fff3cd', borderRadius: 8, fontSize: 14, color: '#856404' }}>
              Hiçbir üründe Liste Adı tanımlı değil. Önce ürünlere Liste Adı atayın.
            </div>
          )}

          {!loading && listOptions.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {listOptions.map(opt => (
                <button
                  key={opt.name}
                  className="admin-btn"
                  onClick={() => selectList(opt)}
                  style={{ textAlign: 'left', padding: '14px 16px', height: 'auto', minHeight: 64, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, whiteSpace: 'normal' }}
                >
                  <strong style={{ fontSize: 14, whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.3 }}>{opt.name}</strong>
                  <span style={{ fontSize: 12, color: '#888' }}>{opt.count} ürün</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Step 1 (alt): Hand-pick individual products ───────────────────── */}
      {step === 1 && mode === 'products' && (
        <div className="admin-form">
          <p style={{ marginTop: 0, fontSize: 14, color: '#555' }}>
            Liste adına bakmaksızın güncellemek istediğiniz <strong>ürünleri tek tek işaretleyin</strong>.
            Devam ettiğinizde fiyatlarına doğrudan dokunabilir, isterseniz sadece bu ürünler için bir Excel de yükleyebilirsiniz.
          </p>

          {loading && <p style={{ color: '#888' }}>Yükleniyor…</p>}
          {loadError && <p className="admin-error">{loadError}</p>}

          {!loading && !loadError && (
            <>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
                <input
                  value={pickerSearch}
                  onChange={e => setPickerSearch(e.target.value)}
                  placeholder="Ürün adı veya kod ara..."
                  style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13, width: 220 }}
                />
                <select value={pickerType} onChange={e => setPickerType(e.target.value)}
                  style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }}>
                  <option value="">Tüm Kategoriler</option>
                  {categories.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}
                </select>
                <select value={pickerBrand} onChange={e => setPickerBrand(e.target.value)}
                  style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }}>
                  <option value="">Tüm Markalar</option>
                  {brands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: '#555', minWidth: 110 }}>
                  {pickerSelected.size > 0 ? `${pickerSelected.size} ürün seçili` : `${pickerFiltered.length} ürün listelendi`}
                </span>
                <button className="admin-btn admin-btn-sm" onClick={() => setPickerSelected(new Set(pickerFiltered.map(p => p.id)))}>
                  Tümünü Seç ({pickerFiltered.length})
                </button>
                {pickerSelected.size > 0 && (
                  <>
                    <button className="admin-btn admin-btn-sm" onClick={() => setPickerSelected(new Set())}>
                      Seçimi Temizle
                    </button>
                    <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={continueWithPicked}>
                      Seçili {pickerSelected.size} ürünle devam et →
                    </button>
                  </>
                )}
              </div>

              <div className="admin-table-wrapper" style={{ maxHeight: 480, overflowY: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}></th>
                      <th>Kod</th>
                      <th>Ürün Adı</th>
                      <th>Marka</th>
                      <th>Mevcut Fiyat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pickerFiltered.map(p => {
                      const isSel = pickerSelected.has(p.id);
                      return (
                        <tr
                          key={p.id}
                          className={isSel ? 'admin-row-selected' : ''}
                          onClick={() => togglePicker(p.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={isSel} onChange={() => togglePicker(p.id)} />
                          </td>
                          <td className="admin-mono">{p.productCode || '—'}</td>
                          <td>{p.productName}</td>
                          <td>{p.brand}</td>
                          <td>{p.price ? p.price.toLocaleString('tr-TR') + ' ₺' : '—'}</td>
                        </tr>
                      );
                    })}
                    {pickerFiltered.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>Bu filtreyle eşleşen ürün yok.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Step 2: Upload ─────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="admin-form">
          <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f0f4ff', borderRadius: 8, fontSize: 14 }}>
            {mode === 'list' ? <>Seçilen liste: <strong>{listName}</strong> &nbsp;·&nbsp;</> : null}
            <strong>{firestoreProducts.length}</strong> ürün
          </div>

          {mode === 'products' && (
            <>
              <p style={{ marginTop: 0, fontSize: 14, color: '#555' }}>
                Seçtiğiniz ürünlerin fiyatlarına doğrudan aşağıdan dokunabilir, ya da sadece bu ürünler için bir
                fiyat Excel'i yükleyebilirsiniz.
              </p>

              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#333', margin: '0 0 8px' }}>
                Fiyatları Doğrudan Düzenle
              </h3>

              {(manualSaving || manualDone) && (
                <div style={{ marginBottom: 12 }}>
                  {manualSaving && (
                    <div style={{ height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                      <div style={{ height: '100%', width: `${manualProgress}%`, background: 'rgb(255,82,82)', transition: 'width 0.2s' }} />
                    </div>
                  )}
                  {manualSaving
                    ? <p style={{ fontSize: 13, color: '#555', margin: 0 }}>Kaydediliyor... {manualProgress}%</p>
                    : <p style={{ fontSize: 13, color: '#15803d', margin: 0 }}>✓ {manualDone}</p>}
                </div>
              )}

              <div className="admin-table-wrapper" style={{ marginBottom: 12, maxHeight: 360, overflowY: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr><th>Kod</th><th>Ürün Adı</th><th>Marka</th><th>Mevcut Fiyat</th><th>Yeni Fiyat</th></tr>
                  </thead>
                  <tbody>
                    {firestoreProducts.map(p => (
                      <tr key={p.id}>
                        <td className="admin-mono">{p.productCode || '—'}</td>
                        <td>{p.productName}</td>
                        <td>{p.brand}</td>
                        <td style={{ color: '#888' }}>{p.price ? p.price.toLocaleString('tr-TR') + ' ₺' : '—'}</td>
                        <td>
                          <input
                            value={manualPrices[p.id] ?? ''}
                            onChange={e => setManualPrices(prev => ({ ...prev, [p.id]: e.target.value }))}
                            placeholder="0"
                            style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ddd', fontSize: 13, width: 110 }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="admin-form-actions" style={{ marginBottom: 24 }}>
                <button
                  className="admin-btn admin-btn-primary"
                  onClick={saveManualPrices}
                  disabled={manualSaving || manualChangedCount === 0}
                >
                  {manualSaving ? 'Kaydediliyor...' : `${manualChangedCount} fiyatı kaydet`}
                </button>
              </div>

              <p style={{ fontSize: 13, color: '#555', margin: '0 0 12px', fontWeight: 600 }}>
                — veya bu ürünler için bir Excel yükleyerek toplu güncelleyin —
              </p>
            </>
          )}

          {mode === 'list' && (
            <>
              <p style={{ marginTop: 0, fontSize: 14, color: '#555' }}>
                Bu listeye ait fiyatları güncellemek için fiyat Excel'ini yükleyin. Dosya adı, güncellenen ürünlerin
                yeni Liste Adı'nı önerir (bir sonraki adımda değiştirebilirsiniz).
              </p>

              {/* Preview of products in the selected list */}
              {firestoreProducts.length > 0 && (
                <div className="admin-table-wrapper" style={{ marginBottom: 20, maxHeight: 280, overflowY: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr><th>Kod</th><th>Ürün Adı</th><th>Marka</th><th>Mevcut Fiyat</th></tr>
                    </thead>
                    <tbody>
                      {firestoreProducts.map(p => (
                        <tr key={p.id}>
                          <td className="admin-mono">{p.productCode}</td>
                          <td>{p.productName}</td>
                          <td>{p.brand}</td>
                          <td>{p.price ? p.price.toLocaleString('tr-TR') + ' ₺' : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          <div
            className={`admin-upload-area${dragOver ? ' drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            onClick={() => document.getElementById('priceFileInput')?.click()}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
            <h3 style={{ margin: '0 0 6px' }}>Fiyat Listesi Dosyası Seçin</h3>
            <p style={{ color: '#888', margin: '0 0 6px', fontSize: 14 }}>Sürükleyip bırakın veya tıklayın</p>
            <p style={{ color: '#aaa', fontSize: 12 }}>.xlsx, .xls, .csv desteklenir</p>
            <input id="priceFileInput" type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
          {parseError && <p className="admin-error" style={{ marginTop: 12 }}>{parseError}</p>}

          <div className="admin-form-actions" style={{ marginTop: 16 }}>
            <button className="admin-btn" onClick={backToStep1}>
              {mode === 'products' ? '← Ürün Seçimi' : '← Liste Seçimi'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Column mapping ─────────────────────────────────────────── */}
      {step === 3 && (
        <div className="admin-form" style={{ maxWidth: 900 }}>
          <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f0f4ff', borderRadius: 8, fontSize: 14 }}>
            <strong>{fileName}</strong> &nbsp;·&nbsp;
            {mode === 'list' ? <>Liste adı: <strong>{listName}</strong> &nbsp;·&nbsp;</> : null}
            <strong>{firestoreProducts.length}</strong> {mode === 'list' ? 'ürün bu listeye ait' : 'seçili ürün'} &nbsp;·&nbsp;
            <strong>{rawRows.length}</strong> Excel satırı
          </div>

          <div className="admin-table-wrapper" style={{ marginBottom: 20 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Excel Sütunu</th>
                  <th>Alan</th>
                  <th>Örnek Veri</th>
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
                          if (e.target.value) next[header] = e.target.value as PriceField;
                          else delete next[header];
                          return next;
                        })}
                        style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ddd', fontSize: 13 }}
                      >
                        <option value="">— Eşleştirme —</option>
                        {(Object.entries(FIELD_LABELS) as [PriceField, string][]).map(([k, v]) => (
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
            * Fiyat sütunu zorunludur. Ürün Kodu veya Ürün Adı'ndan en az biri seçilmeli.
            <br />
            Excel'de fiyat listesinin adını taşıyan bir sütun varsa <strong>Liste Adı</strong> olarak eşleştirin;
            ürünler o sütundaki değerle işaretlenir. Eşleştirmezseniz dosya adı kullanılır (onayınız istenir).
          </p>
          <div className="admin-form-actions">
            <button className="admin-btn" onClick={() => setStep(2)}>Geri</button>
            <button className="admin-btn admin-btn-primary" onClick={proceed}>Devam Et →</button>
          </div>
        </div>
      )}

      {/* ── Step 4: Preview + confirm ──────────────────────────────────────── */}
      {step === 4 && (
        <div className="admin-form" style={{ maxWidth: 900 }}>
          {/* New list name — tags updated/added products so admins can track the latest pricing source */}
          {hasListColumn && (
            <div style={{ marginBottom: 16, padding: '12px 16px', background: '#d4edda', borderRadius: 8, fontSize: 13, color: '#155724' }}>
              ✓ Liste Adı Excel'deki <strong>Liste Adı</strong> sütunundan alınacak
              {listFromExcelCount > 0 && <> — <strong>{listFromExcelCount}</strong> satırda dolu</>}.
              Hücresi boş olan satırlar aşağıdaki değere ayarlanır.
            </div>
          )}

          <label style={{ display: 'block', marginBottom: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
              {hasListColumn ? 'Liste Adı (Excel’de boş olan satırlar için)' : 'Liste Adı (bu yükleme için)'}
            </span>
            <input
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              style={{ display: 'block', width: '100%', maxWidth: 420, marginTop: 6, padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
            />
            <span style={{ fontSize: 12, color: '#888' }}>
              {hasListColumn
                ? 'Excel’de Liste Adı hücresi boş bırakılmış ürünler bu değerle işaretlenir.'
                : 'Güncellenen ve eklenen ürünlerin Liste Adı bu değere ayarlanır, böylece en güncel fiyat kaynağı takip edilebilir.'}
            </span>
          </label>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            <div style={{ background: '#d4edda', borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#155724' }}>{matched.length}</div>
              <div style={{ fontSize: 13, color: '#155724' }}>Güncellenecek</div>
            </div>
            <div style={{ background: '#e2e3ff', borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#3730a3' }}>{codeFixCount}</div>
              <div style={{ fontSize: 13, color: '#3730a3' }}>Kod Düzeltilecek</div>
            </div>
            <div style={{ background: '#fff3cd', borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#856404' }}>{unmatchedProducts.length}</div>
              <div style={{ fontSize: 13, color: '#856404' }}>Excel'de Yok</div>
            </div>
            <div style={{ background: '#f8d7da', borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#721c24' }}>{unmatchedExcel.length}</div>
              <div style={{ fontSize: 13, color: '#721c24' }}>Sistemde Bilinmiyor</div>
            </div>
          </div>

          {/* Matched table */}
          {matched.length > 0 && (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#155724', margin: '0 0 8px' }}>
                Güncellenecek Ürünler ({matched.length})
              </h3>
              <div className="admin-table-wrapper" style={{ marginBottom: 20 }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Kod</th><th>Ürün Adı</th><th>Eski Fiyat</th><th>Yeni Fiyat</th>
                      {hasListColumn && <th>Yeni Liste Adı</th>}
                      <th>Eşleşme</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matched.map(m => (
                      <tr key={m.productId}>
                        <td className="admin-mono">
                          {m.newCode && m.newCode !== m.productCode ? (
                            <>
                              <span style={{ color: '#ccc', textDecoration: m.productCode ? 'line-through' : 'none' }}>
                                {m.productCode || '—'}
                              </span>
                              {' → '}
                              <strong style={{ color: '#155724' }}>{m.newCode}</strong>
                            </>
                          ) : (
                            m.productCode || '—'
                          )}
                        </td>
                        <td>{m.productName}</td>
                        <td style={{ color: '#888' }}>
                          {m.oldPrice ? m.oldPrice.toLocaleString('tr-TR') + ' ₺' : <span style={{ color: '#ccc' }}>—</span>}
                        </td>
                        <td style={{ fontWeight: 600, color: m.newPrice !== m.oldPrice ? '#155724' : '#555' }}>
                          {m.newPrice.toLocaleString('tr-TR')} ₺
                        </td>
                        {hasListColumn && (
                          <td style={{ fontSize: 12 }}>
                            {m.newListeAdi
                              ? m.newListeAdi
                              : <span style={{ color: '#aaa', fontStyle: 'italic' }}>{newListName.trim() || listName}</span>}
                          </td>
                        )}
                        <td style={{ fontSize: 12, color: '#888' }}>{m.matchType === 'code' ? 'Kod' : 'Ad'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Products not found in Excel */}
          {unmatchedProducts.length > 0 && (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#856404', margin: '0 0 8px' }}>
                Excel'de Bulunamayan Ürünler — Değişmeyecek ({unmatchedProducts.length})
              </h3>
              <div className="admin-table-wrapper" style={{ marginBottom: 20 }}>
                <table className="admin-table">
                  <thead>
                    <tr><th>Kod</th><th>Ürün Adı</th><th>Mevcut Fiyat</th></tr>
                  </thead>
                  <tbody>
                    {unmatchedProducts.slice(0, 20).map(p => (
                      <tr key={p.productId} style={{ opacity: 0.55 }}>
                        <td className="admin-mono">{p.productCode}</td>
                        <td>{p.productName}</td>
                        <td>{p.oldPrice ? p.oldPrice.toLocaleString('tr-TR') + ' ₺' : '—'}</td>
                      </tr>
                    ))}
                    {unmatchedProducts.length > 20 && (
                      <tr><td colSpan={3} style={{ textAlign: 'center', color: '#888', fontStyle: 'italic' }}>...ve {unmatchedProducts.length - 20} ürün daha</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Excel rows not matched to any product — Add or Ignore */}
          {unmatchedExcel.length > 0 && (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#721c24', margin: '0 0 8px' }}>
                Sistemde Bulunmayan Yeni Ürünler ({unmatchedExcel.length})
              </h3>
              <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px' }}>
                Bu satırlar seçili listede yok. Eklemek istediklerinizi işaretleyip kategori ve markayı doğrulayın;
                geri kalanlar yok sayılır.
              </p>

              {/* Bulk toolbar — select all + apply category/brand to checked rows */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 12, padding: '10px 12px', background: '#f8f9fa', borderRadius: 8 }}>
                <button type="button" className="admin-btn" onClick={() => setAllAdd(true)}>Tümünü Seç</button>
                <button type="button" className="admin-btn" onClick={() => setAllAdd(false)}>Tümünü Kaldır</button>
                <span style={{ fontSize: 12, color: '#888', margin: '0 6px' }}>{addCount} / {unmatchedExcel.length} seçili</span>
                <span style={{ width: 1, height: 22, background: '#ddd', margin: '0 4px' }} />
                <span style={{ fontSize: 12, color: '#555' }}>Seçililere uygula:</span>
                <select
                  value={bulkType}
                  onChange={e => applyBulkField('productType', e.target.value)}
                  disabled={addCount === 0}
                  style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ddd', fontSize: 12 }}
                >
                  <option value="">— Kategori —</option>
                  {categories.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}
                </select>
                <select
                  value={bulkBrand}
                  onChange={e => applyBulkField('brand', e.target.value)}
                  disabled={addCount === 0}
                  style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ddd', fontSize: 12 }}
                >
                  <option value="">— Marka —</option>
                  {brands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <p style={{ fontSize: 12, color: '#888', margin: '0 0 8px' }}>
                İpucu: bir satıra tıklayıp <kbd>Shift</kbd> + <kbd>↑</kbd>/<kbd>↓</kbd> ile (veya Shift+tıklama) aralık seçebilirsiniz.
              </p>
              {pager}
              <div
                className="admin-table-wrapper"
                style={{ marginBottom: 20, outline: 'none' }}
                ref={newRowsRef}
                tabIndex={0}
                onKeyDown={onRowsKeyDown}
              >
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={allAdded}
                          ref={el => { if (el) el.indeterminate = addCount > 0 && !allAdded; }}
                          onChange={e => setAllAdd(e.target.checked)}
                          title="Tümünü seç / kaldır"
                        />
                      </th>
                      <th>Kod</th><th>Ad</th><th>Fiyat</th><th>Kategori</th><th>Marka</th>
                      {hasListColumn && <th>Liste Adı</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {unmatchedExcel.slice(pageStart, pageEnd).map((r, j) => {
                      const i = pageStart + j;
                      const d = addDecisions[i];
                      if (!d) return null;
                      return (
                        <tr
                          key={i}
                          data-idx={i}
                          onClick={e => {
                            const tag = (e.target as HTMLElement).tagName;
                            if (tag === 'INPUT' || tag === 'SELECT' || tag === 'OPTION' || tag === 'BUTTON') return;
                            onRowClick(i, e.shiftKey);
                          }}
                          style={{
                            opacity: d.add ? 1 : 0.6,
                            cursor: 'pointer',
                            background: i === activeIdx ? '#fde2e4' : d.add ? '#fff5f5' : undefined,
                            userSelect: 'none',
                          }}
                        >
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={d.add}
                              onChange={e => setDecision(i, { add: e.target.checked })}
                            />
                          </td>
                          <td>
                            <input
                              className="admin-mono"
                              value={d.code}
                              onChange={e => setDecision(i, { code: e.target.value })}
                              disabled={!d.add}
                              placeholder={normalize(r.name).replace(/\s+/g, '-') || 'kod'}
                              style={{ padding: '3px 6px', borderRadius: 4, border: '1px solid #ddd', fontSize: 12, width: 110 }}
                            />
                          </td>
                          <td>{r.name || '—'}</td>
                          <td>{r.price.toLocaleString('tr-TR')} ₺</td>
                          <td>
                            <select
                              value={d.productType}
                              onChange={e => setDecision(i, { productType: e.target.value })}
                              disabled={!d.add}
                              style={{ padding: '3px 6px', borderRadius: 4, border: '1px solid #ddd', fontSize: 12 }}
                            >
                              <option value="">— Kategori —</option>
                              {categories.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}
                            </select>
                          </td>
                          <td>
                            <select
                              value={d.brand}
                              onChange={e => setDecision(i, { brand: e.target.value })}
                              disabled={!d.add}
                              style={{ padding: '3px 6px', borderRadius: 4, border: '1px solid #ddd', fontSize: 12 }}
                            >
                              <option value="">— Marka —</option>
                              {brands.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                          </td>
                          {hasListColumn && (
                            <td style={{ fontSize: 12 }}>
                              {r.listeAdi
                                ? r.listeAdi
                                : <span style={{ color: '#aaa', fontStyle: 'italic' }}>{newListName.trim() || listName}</span>}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {pager}
            </>
          )}

          {/* Progress */}
          {updating && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'rgb(255,82,82)', transition: 'width 0.2s' }} />
              </div>
              <p style={{ fontSize: 13, color: '#555', margin: '6px 0 0' }}>İşleniyor... {progress}%</p>
            </div>
          )}

          <div className="admin-form-actions">
            <button className="admin-btn" onClick={() => setStep(3)} disabled={updating}>Geri</button>
            <button
              className="admin-btn admin-btn-primary"
              onClick={doUpdate}
              disabled={updating || (matched.length === 0 && addCount === 0)}
            >
              {updating
                ? 'İşleniyor...'
                : `${matched.length} fiyat güncelle${addCount > 0 ? ` + ${addCount} ürün ekle` : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
