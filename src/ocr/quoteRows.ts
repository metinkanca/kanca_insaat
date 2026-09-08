// The OCR-list → quote-lines pipeline, shared by the dealer portal's
// "Yeni Teklif" screen and the admin panel's "Teklif Ekle" screen. Both
// must read a photo the same way — a change here shows up on both, which
// is the point: the matching behaviour is regression-tested against
// reference photos and may not drift between the two entry points.
import { callOcrSpaceLines, getOcrDiagnostics, runOcrOnPdf } from './ocrUtils';
import type { OcrDiagnostics } from './ocrUtils';
import {
  applyDittoMarks,
  buildVocabulary,
  correctOcrLine,
  matchProductsFromOcr,
  mergeStubLines,
} from './ocrMatch';
import type { Product } from '../types/firestore';

export type ProductWithId = Product & { id: string };

// One row of the OCR review table. productId === '' means the line did not
// match a catalog product; it goes in as free text and is priced by hand.
export type ReviewRow = {
  key: number;
  text: string;
  qty: number;
  productId: string;
  productCode: string;
  unitPrice?: number;
  ocrLine: string;
  // Near misses for a line that did not match: shown as one-click chips so
  // the row is fixed without searching the whole catalog by hand.
  suggestions?: { id: string; name: string }[];
  _line?: number; // original OCR line order, for sorting
};

let rowKey = 1;
export const nextRowKey = () => rowKey++;

// Strip trailing quantity notation ("... 5 adet", "... 30 mt") from free text
export const stripQty = (s: string) =>
  s.replace(/\s+\d+\s*(adet(?:ler)?|adeti?|ad|mt|metre)\s*$/i, '').trim();

// A row built by picking a product out of the catalog grid rather than by OCR.
export const rowFromProduct = (product: ProductWithId): ReviewRow => ({
  key: nextRowKey(),
  text: product.productName,
  qty: 1,
  productId: product.id,
  productCode: product.productCode,
  unitPrice: product.price > 0 ? product.price : undefined,
  ocrLine: '',
});

export interface QuoteOcrResult {
  rows: ReviewRow[];
  diagnostics: OcrDiagnostics | null;
  // Set when the file was read but yielded nothing usable. Hard failures
  // (network, bad key, unreadable PDF) throw instead.
  error?: string;
}

// Reads a photo/PDF of a material list and turns it into review rows.
// `onProgress` receives a whole-number percentage; PDFs only.
export async function readQuoteRowsFromFile(
  file: File,
  apiKey: string,
  products: ProductWithId[],
  onProgress?: (percent: number) => void,
): Promise<QuoteOcrResult> {
  let lines: string[];
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
    const text = await runOcrOnPdf(file, apiKey, p => onProgress?.(Math.round(p * 100)));
    lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  } else {
    lines = await callOcrSpaceLines(file, apiKey);
  }
  const diagnostics = getOcrDiagnostics();

  if (!lines.length) {
    return { rows: [], diagnostics, error: 'Listede okunabilir yazı bulunamadı. Daha net bir fotoğraf deneyin.' };
  }

  const matchProducts = products.map(p => ({
    id: p.id, productName: p.productName, productCode: p.productCode, brand: p.brand,
  }));
  // The catalog doubles as the spellchecker for the handwriting.
  const vocabulary = buildVocabulary(matchProducts);
  const corrected = applyDittoMarks(
    mergeStubLines(lines.map(l => correctOcrLine(l, vocabulary))),
  );
  const { matched, unmatched } = matchProductsFromOcr(corrected, matchProducts);

  const priceOf = (id: string) => {
    const p = products.find(x => x.id === id);
    return p && p.price > 0 ? p.price : undefined;
  };

  const rows: ReviewRow[] = [
    ...matched.map(m => ({
      key: nextRowKey(),
      text: m.productName,
      qty: m.quantity,
      productId: m.productId,
      productCode: products.find(p => p.id === m.productId)?.productCode || '',
      unitPrice: priceOf(m.productId),
      ocrLine: m.ocrLine,
      _line: m.lineNumber,
    })),
    ...unmatched.map(u => ({
      key: nextRowKey(),
      text: stripQty(u.ocrLine),
      qty: u.quantity,
      productId: '',
      productCode: '',
      unitPrice: undefined,
      ocrLine: u.ocrLine,
      suggestions: u.candidates
        .filter(c => c.score >= 10)
        .map(c => ({ id: c.productId, name: c.productName })),
      _line: u.lineNumber,
    })),
  ].sort((a, b) => (a._line ?? 0) - (b._line ?? 0));

  if (!rows.length) {
    return { rows: [], diagnostics, error: 'Listede ürün satırı bulunamadı. Daha net bir fotoğraf deneyin.' };
  }
  return { rows, diagnostics };
}
