declare const pdfjsLib: any;

// ── Overlay-based line reconstruction ──────────────────────────────────────

// OCR.space's TextOverlay.Lines are segmented per *text run*, not per
// physical row: on a handwritten order list the wide gap between the
// quantity column ("20 Ad.") and the description ("Köşe Düzeltirici")
// makes the engine emit two Lines for what the writer wrote as one row.
// Downstream every line becomes one order item, so that split silently
// turns one product into two junk rows and loses its quantity.
//
// So: keep OCR.space's word grouping (it is good), but re-join its Lines
// into rows by vertical overlap. This is deliberately line-level, not
// word-level — an earlier word-level clustering pass failed because its
// reference point never updated while words were appended, so evenly
// spaced rows merged or split depending on where the tolerance happened
// to fall. Whole Lines already carry a stable vertical span, and two
// fragments of the same row overlap on it almost completely while
// neighbouring rows barely touch.
interface OverlayFragment {
  text: string;
  left: number; right: number;
  top: number; bottom: number;
}

function fragmentFromOverlayLine(line: any): OverlayFragment | null {
  const words = (line.Words || []).filter((w: any) => (w.WordText || '').trim());
  if (!words.length) return null;

  const text = words
    .slice()
    .sort((a: any, b: any) => (a.Left || 0) - (b.Left || 0))
    .map((w: any) => String(w.WordText).trim())
    .join(' ');

  const lefts   = words.map((w: any) => w.Left || 0);
  const rights  = words.map((w: any) => (w.Left || 0) + (w.Width || 0));
  const tops    = words.map((w: any) => w.Top || 0);
  const bottoms = words.map((w: any) => (w.Top || 0) + (w.Height || 0));

  const top    = line.MinTop != null ? line.MinTop : Math.min(...tops);
  const bottom = line.MinTop != null && line.MaxHeight != null
    ? line.MinTop + line.MaxHeight
    : Math.max(...bottoms);

  return { text, left: Math.min(...lefts), right: Math.max(...rights), top, bottom };
}

// A fragment holding nothing but a count — "20 Ad.", "12 Boy", "8 A2" or a
// bare "16". These are the only fragments worth moving: everything else
// OCR.space already places on the right row, and re-grouping fragments that
// carry real text does more harm than good on a slanted handwritten page.
const QTY_ONLY_ROW = /^\s*\d+\s*[.,)]?\s*(a[cdoez2][hltdi]?|adet(ler)?|b[ao][yrg]|t[oe]p|paket|pkt|kutu|koli|rulo|takim|cift|metre|mt|litre|lt|kg)?\s*[.,]?\s*$/i;

// The size column of a list written as "32mm | Boru | 8 Ad." — no more an
// order line on its own than a bare count is.
const SIZE_ONLY_ROW = /^\s*\d{1,3}\s*(mm|cm|m|")?\s*[.,]?\s*$/i;

const isStub = (text: string) => QTY_ONLY_ROW.test(text) || SIZE_ONLY_ROW.test(text);

const centerOf = (f: OverlayFragment) => (f.top + f.bottom) / 2;

// Two fragments of one written row sit side by side — the size, the words,
// the count, each its own column. Anything that overlaps horizontally is a
// different row whose ascenders merely reach into the same band, and this
// is what keeps full-width rows from ever being joined to each other.
function sideBySide(a: OverlayFragment, b: OverlayFragment): boolean {
  const overlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  return overlap <= 0.3 * Math.min(a.right - a.left, b.right - b.left);
}

const xMid = (f: OverlayFragment) => (f.left + f.right) / 2;

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

// The vertical distance between one written row and the next, measured
// without knowing the rows yet: two fragments that overlap horizontally
// CANNOT be on the same row, so the nearest such fragment below any given
// one is exactly one row away. The median over every fragment survives
// columns that skip rows and stubs of wildly different heights.
//
// This is the scale everything else is judged against. Glyph height is not:
// on a page of short stubs ("25mm", "8 Ad.") the median height collapses,
// the tolerance with it, and a size that is merely written a little low
// splits off into a row of its own — after which the NEXT row's words join
// that stray size instead. That is how "25mm" ended up on the 20mm line
// while the 25mm line lost its size entirely.
function estimateRowPitch(frags: OverlayFragment[]): number {
  const gaps: number[] = [];
  for (const a of frags) {
    let nearest = Infinity;
    for (const b of frags) {
      if (b === a || sideBySide(a, b)) continue;
      const gap = centerOf(b) - centerOf(a);
      if (gap > 1 && gap < nearest) nearest = gap;
    }
    if (nearest < Infinity) gaps.push(nearest);
  }
  return median(gaps);
}

// Photographed pages are never square to the camera, and this writer's left
// column sits lower than the right on every row. Both show up as a constant
// slope of centre against x, so measure it inside the rows we have and take
// it back out before clustering again.
function estimateSkew(rows: { parts: OverlayFragment[] }[]): number | null {
  const slopes: number[] = [];
  for (const row of rows) {
    if (row.parts.length < 2) continue;
    const ordered = row.parts.slice().sort((a, b) => xMid(a) - xMid(b));
    const first = ordered[0];
    const last = ordered[ordered.length - 1];
    const dx = xMid(last) - xMid(first);
    if (dx < 40) continue;
    slopes.push((centerOf(last) - centerOf(first)) / dx);
  }
  if (!slopes.length) return null;
  const slope = median(slopes);
  return Math.abs(slope) < 0.25 ? slope : null;
}

function clusterRows(frags: OverlayFragment[], tolerance: number, slope: number) {
  const key = (f: OverlayFragment) => centerOf(f) - slope * xMid(f);
  const sorted = frags.slice().sort((a, b) => key(a) - key(b) || a.left - b.left);
  const rows: { parts: OverlayFragment[]; key: number }[] = [];

  for (const f of sorted) {
    const row = rows[rows.length - 1];
    // Against the running mean of the row's members, not the last one seen:
    // the count is written slightly above the words it belongs to, and
    // measuring from whatever came last hands it to the row above.
    if (row && Math.abs(key(f) - row.key) <= tolerance && row.parts.every(p => sideBySide(p, f))) {
      row.parts.push(f);
      row.key = row.parts.reduce((sum, p) => sum + key(p), 0) / row.parts.length;
    } else {
      rows.push({ parts: [f], key: key(f) });
    }
  }
  return rows;
}

function assembleRows(frags: OverlayFragment[]): string[] {
  if (frags.length < 2) return frags.map(f => f.text);

  const pitch = estimateRowPitch(frags);
  const medianHeight = median(frags.map(f => Math.max(1, f.bottom - f.top)));
  const tolerance = pitch > 0 ? 0.35 * pitch : 0.55 * medianHeight;

  // Clustering needs the skew, and measuring the skew needs the rows, so
  // start with none and let it settle — two passes is enough in practice.
  let slope = 0;
  let rows = clusterRows(frags, tolerance, slope);
  for (let pass = 0; pass < 2; pass++) {
    const measured = estimateSkew(rows);
    if (measured == null || Math.abs(measured - slope) < 0.002) break;
    slope = measured;
    rows = clusterRows(frags, tolerance, slope);
  }

  // A fragment that is only a count or only a size cannot be an order line by
  // itself — the writer put it just far enough from its row to miss. Give it
  // to the nearest row carrying words that does not already have one of its
  // own; past a row's pitch it would be stealing from further down the page.
  const reach = pitch > 0 ? pitch : 1.5 * medianHeight;
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    if (row.parts.length !== 1) continue;
    const stub = row.parts[0];
    const isCount = QTY_ONLY_ROW.test(stub.text);
    const isSize = SIZE_ONLY_ROW.test(stub.text);
    if (!isCount && !isSize) continue;

    let best = -1;
    let bestDistance = reach;
    rows.forEach((other, j) => {
      // Another stub is no home for this one — the target has to be a row
      // carrying words, even if those words are its only fragment.
      if (j === i || other.parts.every(p => isStub(p.text))) return;
      const taken = other.parts.some(p =>
        isCount ? QTY_ONLY_ROW.test(p.text) : SIZE_ONLY_ROW.test(p.text));
      if (taken || !other.parts.every(p => sideBySide(p, stub))) return;
      const distance = Math.abs(other.key - row.key);
      if (distance < bestDistance) { best = j; bestDistance = distance; }
    });

    if (best >= 0) {
      rows[best].parts.push(stub);
      rows.splice(i, 1);
    }
  }

  return rows.map(r => r.parts.slice().sort((a, b) => a.left - b.left).map(p => p.text).join(' '));
}

// What OCR handed back before any row assembly, kept so a bad read can be
// told apart from bad assembly without having to guess from the results.
let lastFragments: string[] = [];

export function rebuildLinesFromOverlay(parsedResults: any[]): string | null {
  const lines: string[] = [];
  lastFragments = [];

  parsedResults.forEach((r: any) => {
    if (!r.TextOverlay?.Lines?.length) return;
    const frags = r.TextOverlay.Lines
      .map(fragmentFromOverlayLine)
      .filter(Boolean) as OverlayFragment[];
    if (!frags.length) return;
    lastFragments.push(...frags.map(f =>
      `[x${Math.round(f.left)}-${Math.round(f.right)} y${Math.round(f.top)}-${Math.round(f.bottom)}] ${f.text}`));
    lines.push(...assembleRows(frags));
  });

  return lines.length >= 2 ? lines.join('\n') : null;
}

// What the last read actually produced, so a thin result can be told apart
// from a matching problem without guessing. Surfaced in the review panel.
export interface OcrDiagnostics {
  engine: string;
  attempts: { engine: string; lines: number; error?: string }[];
  lines: string[];
  fragments: string[];
}
let lastDiagnostics: OcrDiagnostics | null = null;
export const getOcrDiagnostics = (): OcrDiagnostics | null => lastDiagnostics;

export async function callOcrSpaceLines(source: File | HTMLCanvasElement, apiKey: string): Promise<string[]> {
  let blob: Blob | null;
  if (source instanceof HTMLCanvasElement) {
    blob = await new Promise<Blob | null>(res => source.toBlob(b => res(b), 'image/jpeg', 0.88));
  } else {
    blob = await compressForOcrSpace(source);
  }
  if (!blob) throw new Error('Görsel hazırlanamadı');

  // Engine 3 is the handwriting model and normally wins, but it sometimes
  // comes back with two lines of a full page. Taking the first non-empty
  // answer meant that thin read was final and engine 1 never got asked —
  // a whole list silently reduced to a couple of items. So a thin result
  // costs one more request instead, and the fuller read wins.
  const attempts: OcrDiagnostics['attempts'] = [];
  let best: { engine: string; lines: string[]; fragments: string[] } | null = null;

  for (const engine of ['3', '1']) {
    try {
      const text = await callOcrSpaceEngine(blob, engine, apiKey);
      const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);
      attempts.push({ engine, lines: lines.length });
      if (!best || lines.length > best.lines.length) {
        best = { engine, lines, fragments: lastFragments.slice() };
      }
      if (lines.length >= 5 && ocrResultIsMeaningful(text)) break;
    } catch (err: any) {
      attempts.push({ engine, lines: 0, error: String(err?.message || err) });
      console.warn('[OCR.space] Engine', engine, 'error:', err);
    }
  }

  lastDiagnostics = {
    engine: best?.engine || '-',
    attempts,
    lines: best?.lines || [],
    fragments: best?.fragments || [],
  };
  return best?.lines || [];
}

export function ocrResultIsMeaningful(text: string): boolean {
  const letters = (text.match(/[a-zA-ZğüşıöçĞÜŞİÖÇ]/g) || []).length;
  return letters >= 12;
}

export async function compressForOcrSpace(source: File | Blob): Promise<Blob | null> {
  const MAX_BYTES = 900 * 1024;
  return new Promise(resolve => {
    const img = new Image();
    let url: string | null = null;

    const drawAndExport = () => {
      const origW = img.naturalWidth, origH = img.naturalHeight;
      const estBytes = origW * origH * 0.25;
      const scale = estBytes > MAX_BYTES ? Math.sqrt(MAX_BYTES / estBytes) : 1;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(origW * scale);
      canvas.height = Math.round(origH * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);

      let quality = 0.88;
      const tryBlob = () => {
        canvas.toBlob(blob => {
          if (!blob) { resolve(null); return; }
          if (blob.size <= MAX_BYTES || quality <= 0.40) { resolve(blob); return; }
          quality -= 0.10;
          tryBlob();
        }, 'image/jpeg', quality);
      };
      tryBlob();
    };

    img.onload = () => { if (url) URL.revokeObjectURL(url); drawAndExport(); };
    img.onerror = () => { if (url) URL.revokeObjectURL(url); resolve(null); };
    url = URL.createObjectURL(source);
    img.src = url;
  });
}

export async function callOcrSpaceEngine(blob: Blob, engine: string, apiKey: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', blob, 'image.jpg');
  formData.append('apikey', apiKey);
  formData.append('language', 'tur');
  formData.append('isOverlayRequired', 'true');
  formData.append('detectOrientation', 'false');
  formData.append('scale', 'true');
  formData.append('OCREngine', engine);

  const resp = await fetch('https://api.ocr.space/parse/image', { method: 'POST', body: formData });
  if (!resp.ok) throw new Error('HTTP ' + resp.status);
  const data = await resp.json();
  if (import.meta.env.DEV) console.log('[OCR.space] raw response, engine', engine, data);
  if (data.IsErroredOnProcessing) throw new Error((data.ErrorMessage || []).toString() || 'OCR error');
  if (!data.ParsedResults?.length) return '';

  const rebuilt = rebuildLinesFromOverlay(data.ParsedResults);
  return rebuilt ?? data.ParsedResults.map((r: any) => r.ParsedText || '').join('\n');
}

export async function callOcrSpace(source: File | HTMLCanvasElement, apiKey: string): Promise<string> {
  let blob: Blob | null;
  if (source instanceof HTMLCanvasElement) {
    blob = await new Promise<Blob | null>(res => source.toBlob(b => res(b), 'image/jpeg', 0.88));
  } else {
    blob = await compressForOcrSpace(source);
  }
  if (!blob) throw new Error('Görsel hazırlanamadı');

  for (const engine of ['3', '1']) {
    try {
      const text = await callOcrSpaceEngine(blob, engine, apiKey);
      if (ocrResultIsMeaningful(text)) return text;
    } catch (err) {
      console.warn('[OCR.space] Engine', engine, 'error:', err);
    }
  }
  return '';
}

export async function runOcrOnPdf(
  file: File,
  apiKey: string,
  onProgress?: (p: number) => void
): Promise<string> {
  if (typeof pdfjsLib === 'undefined') {
    console.warn('pdf.js not loaded');
    return '';
  }
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageCount = Math.min(pdf.numPages, 2);
    let allText = '';

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;

      const pageText = await callOcrSpace(canvas, apiKey);
      allText += pageText + '\n';
      if (onProgress) onProgress(pageNum / pageCount);
    }
    return allText;
  } catch (err) {
    console.error('PDF OCR error:', err);
    return '';
  }
}
