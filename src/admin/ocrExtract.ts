export interface OcrExtractResult {
  productCode: string;
  productName: string;
  brand: string;
  price: number;
  depth: string;
  width: string;
  height: string;
  specRows: { title: string; value: string }[];
  rawText: string;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/İ/g, 'i').replace(/I/g, 'i')
    .replace(/Ş/g, 's').replace(/ş/g, 's')
    .replace(/Ğ/g, 'g').replace(/ğ/g, 'g')
    .replace(/Ü/g, 'u').replace(/ü/g, 'u')
    .replace(/Ö/g, 'o').replace(/ö/g, 'o')
    .replace(/Ç/g, 'c').replace(/ç/g, 'c');
}

export function extractFromOcrText(text: string, knownBrands: string[]): OcrExtractResult {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Product code: alphanumeric model code pattern
  let productCode = '';
  const codeRegex = /\b([A-Z]{1,4}[-/]?\d{2,4}[-/]?[A-Z0-9]{0,4})\b/;
  for (const line of lines) {
    const m = line.match(codeRegex);
    if (m) { productCode = m[1]; break; }
  }

  // Dimensions: "NNN × NNN × NNN" or "NNNmm" near dimension keywords
  let depth = '', width = '', height = '';
  const dimTriple = /(\d{3,4})\s*[×xX*]\s*(\d{3,4})\s*[×xX*]\s*(\d{3,4})/;
  for (const line of lines) {
    const m = line.match(dimTriple);
    if (m) { depth = m[1]; width = m[2]; height = m[3]; break; }
  }
  if (!depth) {
    for (const line of lines) {
      const norm = normalize(line);
      const mmMatch = line.match(/(\d{3,4})\s*mm/i);
      if (mmMatch) {
        if (norm.includes('derin')) depth = mmMatch[1];
        else if (norm.includes('genislik') || norm.includes('en ')) width = mmMatch[1];
        else if (norm.includes('yukseklik') || norm.includes('boy')) height = mmMatch[1];
      }
    }
  }

  // Price: line containing currency keywords, first number > 50
  let price = 0;
  const priceKeywords = /tl|try|₺|lira|fiyat/i;
  const numberRegex = /[\d.,]+/g;
  for (const line of lines) {
    if (priceKeywords.test(line)) {
      const nums = line.match(numberRegex);
      if (nums) {
        for (const n of nums) {
          const v = parseFloat(n.replace(',', '.'));
          if (v > 50) { price = v; break; }
        }
        if (price) break;
      }
    }
  }
  if (!price) {
    let max = 0;
    for (const line of lines) {
      const nums = line.match(numberRegex);
      if (nums) {
        for (const n of nums) {
          const v = parseFloat(n.replace(',', '.'));
          if (v > 100 && v > max) max = v;
        }
      }
    }
    price = max;
  }

  // Brand: case-insensitive substring match against knownBrands
  let brand = '';
  for (const line of lines) {
    const normLine = normalize(line);
    for (const b of knownBrands) {
      if (normLine.includes(normalize(b))) { brand = b; break; }
    }
    if (brand) break;
  }

  // Specs: lines with ":" or "|" where both sides are non-empty and left side ≤ 40 chars
  const specRows: { title: string; value: string }[] = [];
  const dimKeywords = /mm|cm|\d{3,4}\s*[×xX]/;
  for (const line of lines) {
    const sep = line.includes(':') ? ':' : line.includes('|') ? '|' : null;
    if (!sep) continue;
    const idx = line.indexOf(sep);
    const left = line.slice(0, idx).trim();
    const right = line.slice(idx + 1).trim();
    if (!left || !right || left.length > 40) continue;
    if (dimKeywords.test(line)) continue;
    if (/^\d+$/.test(left)) continue;
    specRows.push({ title: left, value: right });
  }

  // Product name: longest meaningful line (5–80 chars), not a spec, not a code line
  let productName = '';
  const specTitles = new Set(specRows.map(r => r.title));
  for (const line of lines) {
    if (line.length < 5 || line.length > 80) continue;
    if (specTitles.has(line.split(':')[0].trim())) continue;
    if (dimTriple.test(line)) continue;
    if (codeRegex.test(line) && line.length < 15) continue;
    if (/^\d[\d.,\s]*$/.test(line)) continue;
    if (line.length > productName.length) productName = line;
  }

  return { productCode, productName, brand, price, depth, width, height, specRows, rawText: text };
}
