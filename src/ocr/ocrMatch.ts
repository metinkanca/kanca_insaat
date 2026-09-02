export interface MatchProduct {
  id: string;
  productName: string;
  productCode: string;
  brand: string;
}

export interface MatchedItem {
  productId: string;
  productName: string;
  brand: string;
  score: number;
  quantity: number;
  ocrLine: string;
  lineNumber: number;
}

export interface UnmatchedLine {
  ocrLine: string;
  quantity: number;
  candidates: { productId: string; productName: string; brand: string; score: number }[];
  lineNumber: number;
}

export interface MatchResult {
  matched: MatchedItem[];
  unmatched: UnmatchedLine[];
}

const MIN_SCORE = 13;

// ── OCR word correction ────────────────────────────────────────────────────

const DOMAIN_VOCABULARY = [
  // Pipe / fitting types
  'boru', 'dirsek', 'manson', 'reduksiyon', 'conta', 'vana',
  'kapak', 'spiral', 'inegal', 'havalandirma', 'parca', 'kavis',
  // Clamps / accessories
  'kelepce', 'trifonlu', 'kisa', 'uzun', 'suzgec', 'acik', 'kapali',
  'dubel', 'vida', 'roket', 'klips',
  // Size descriptor
  'parmak',
  // Connectors / hardware
  'rakor', 'nipel', 'flanş', 'baglanti', 'valf', 'musluk',
  'kollektor', 'kuresel', 'kendinden', 'dolabi', 'kilifli',
  // Materials
  'pvc', 'celik', 'demir', 'bakir', 'galvaniz', 'kaucuk',
  // Units / common list words
  'adet', 'metre', 'kapasite', 'paket',
];

// Words the fuzzy corrector may snap an OCR token to, harvested from the
// catalog itself. The hand-written words on a dealer's list are, by
// definition, product names — so the catalog is a far better dictionary
// than any hard-coded list can be ("Kollektör", "Küresel", "Dübel" all
// live there already). Ambiguous snaps are rejected by correctOcrLine, so
// a bigger vocabulary makes it more conservative, not more reckless.
export function buildVocabulary(products: MatchProduct[]): string[] {
  const words = new Set<string>();
  for (const p of products) {
    const tokens = normalizeOcrText(`${p.brand || ''} ${p.productName || ''}`).split(' ');
    for (const t of tokens) {
      if (t.length >= 4 && t.length <= 14 && !/\d/.test(t)) words.add(t);
    }
  }
  return [...words];
}

// Last resort for a badly mangled word, once letter-by-letter distance has
// given up: match on consonants alone. "Kalkktär" is four edits from
// "kollektör" — far beyond any safe letter threshold — but their consonant
// skeletons (klkktr / kllktr) are one apart, and no other catalog word comes
// close. Deliberately narrow, because at this distance a wrong correction
// would be invisible: the word must be long, its first letter must survive
// (OCR rarely loses that), the skeletons must be nearly identical, and one
// candidate must stand alone. Anything less and the token is left as it was.
function skeletonMatch(norm: string, vocab: Set<string>): string | null {
  if (norm.length < 6) return null;
  const skeleton = vowelSkeleton(norm);
  if (skeleton.length < 3) return null;

  let best: string | null = null;
  let bestSkeleton = Infinity;
  let bestDist = Infinity;
  let ambiguous = false;

  for (const v of vocab) {
    if (v[0] !== norm[0] || Math.abs(v.length - norm.length) > 3) continue;
    const s = editDistance(skeleton, vowelSkeleton(v));
    // One consonant may differ only in a long word, where the rest of the
    // skeleton still pins it down. In a short one a single consonant is too
    // much of the evidence — "kılçık" and "kauçuk" are one consonant apart
    // and completely different products.
    if (s > (norm.length >= 8 ? 1 : 0)) continue;
    const d = editDistance(norm, v);
    // Half the word turning into something else is not a misread any more.
    if (d > Math.ceil(norm.length / 2)) continue;
    if (s < bestSkeleton || (s === bestSkeleton && d < bestDist)) {
      bestSkeleton = s; bestDist = d; best = v; ambiguous = false;
    } else if (s === bestSkeleton && d === bestDist && v !== best) {
      ambiguous = true;
    }
  }

  return ambiguous ? null : best;
}

export function correctOcrLine(line: string, extraWords: string[] = []): string {
  // ── Step 1: structural / digit-letter preprocessing ────────────────────
  let processed = line
    // Standalone "I" at start or mid-line → "1" (OCR confuses uppercase I with digit 1)
    .replace(/(?<![A-ZÇĞİÖŞÜa-zçğışöşü])I(?![A-ZÇĞİÖŞÜa-zçğışöşü])/g, '1')
    // Fraction cleanup: "21/2" → "2 1/2", "11/2" → "1 1/2"  (handwritten ½ read as 1/2)
    .replace(/\b([12])(1\/2)\b/g, '$1 $2')
    // Apostrophe-style fractions: "1'12" / "2`12" → "1 1/2" / "2 1/2"
    .replace(/\b([12])[''`]\s*12\b/g, '$1 1/2')
    // Comma-as-fraction: "1,314" → "1 3/4", "1,12" → "1 1/2", "2,12" → "2 1/2"
    .replace(/\b1,314\b/g, '1 3/4')
    .replace(/\b([12]),12\b/g, '$1 1/2')
    // "SU adet" / "so adet" → "50 adet"  (OCR: S≈5, U/o≈0)
    .replace(/\bsu\b(\s+adet)/gi, '50$1')
    .replace(/\bso\b(\s+adet)/gi, '50$1')
    // "az" / "a2" / "aa" → "ad" (short for adet) when adjacent to a number — handwriting
    // misread of 'd' (its loop gets read as 'z', '2', or a second 'a')
    .replace(/\b(\d+)\s+a[az2]\b/gi, (_, n) => `${n} ad`)
    .replace(/\ba[az2]\b(\s*[:\-]?\s*)(\d+)/gi, (_, sep, n) => `ad${sep}${n}`)
    // "Te" — the fitting — is too short for any fuzzy rule to reach, and its
    // "e" is the first thing OCR loses: it comes back as "T2", "Tz", or just
    // "T". Left alone the line matches on its size alone, which ties every
    // product of that diameter and lets an unrelated one win. A lone "t" is
    // not a word in Turkish and no catalog entry is spelled that way, so
    // there is nothing else it could have been.
    .replace(/\bt[2z]?\b/gi, 'Te')
    // "parmak" split: "bar mak" / "par mak" → inch symbol
    .replace(/\b[bp]ar\s+mak\b/gi, '"')
    // "parmak" / garbled variants → inch symbol
    .replace(/\bparmak\b/gi, '"')
    .replace(/\bb[ae]rn[ao]k\b/gi, '"')
    .replace(/\bbarm[oa]k\b/gi, '"')
    // A digit followed by a lone "x" is this trade's shorthand for the
    // diameter in mm ("32x dirsek" = 32 mm dirsek); catalog names spell it
    // out, so expand it or the size never matches. An "x" *between* digits
    // is a real multiplication ("32x20x32") and is left alone.
    .replace(/\bg([o0])x\b/gi, '60 mm')   // handwritten 6 read as G, 0 as o
    .replace(/(\d{1,3})\s*x\b(?!\s*\d)/gi, '$1 mm')
    // Word-shape misreads for common fitting terms
    .replace(/\bkaris\b/gi, 'kavis')   // v misread as r
    .replace(/\bvaris\b/gi, 'kavis')   // K→V and v→r
    .replace(/\bmasorlu\b/gi, 'manşonlu')  // nş cluster dropped, n→r
    .replace(/\bmasonlu\b/gi, 'manşonlu')  // nş cluster dropped
    // "manşon" loses its nş cluster in almost every handwriting sample
    .replace(/\bma[jnsrz]{1,2}on\b/gi, 'manşon')
    // Restore Turkish diacritics stripped by OCR on known domain words
    .replace(/\bkelepce\b/gi, 'kelepçe')
    .replace(/\breduksiyon\b/gi, 'redüksiyon')
    .replace(/\bmanson\b/gi, 'manşon')
    .replace(/\bsuzgec\b/gi, 'süzgeç')
    .replace(/\bparca\b/gi, 'parça')
    .replace(/\bcelik\b/gi, 'çelik')
    .replace(/\bkaucuk\b/gi, 'kauçuk')
    .replace(/\bacik\b/gi, 'açık')
    .replace(/\bkapali\b/gi, 'kapalı')
    .replace(/\bhavalandirma\b/gi, 'havalandırma')
    .replace(/\bflans\b/gi, 'flanş')
    .replace(/\bbaglanti\b/gi, 'bağlantı')
    .replace(/\bbakir\b/gi, 'bakır');

  // ── Step 2: word-level fuzzy correction ───────────────────────────────
  const vocabSet = new Set(
    [...DOMAIN_VOCABULARY, ...extraWords]
      .map(w => normalizeOcrText(w))
      .filter(w => w.length >= 4)
  );

  return processed.split(/(\s+)/).map(token => {
    if (/^\s+$/.test(token)) return token;
    const norm = normalizeOcrText(token);
    if (!norm || /^\d+$/.test(norm) || norm.length <= 3) return token;
    if (vocabSet.has(norm)) return token;

    // Distance 1 for 4-5 char words; distance 2 for 6+ char words
    const maxDist = norm.length >= 6 ? 2 : 1;
    const skeleton = vowelSkeleton(norm);

    let bestMatch = '';
    let bestDist = Infinity;
    let bestSkeleton = Infinity;
    let ambiguous = false;

    for (const v of vocabSet) {
      if (Math.abs(v.length - norm.length) > maxDist) continue;
      const d = editDistance(norm, v);
      if (d > maxDist) continue;
      // Consonants carry the word; vowels are what handwriting OCR gets
      // wrong. So when two candidates are equally close by letters, the one
      // whose consonants agree is the real word — "bora" is one edit from
      // both "boru" and "boya", a tie that used to abandon the correction
      // entirely, but only "boru" has the same consonant skeleton.
      const s = editDistance(skeleton, vowelSkeleton(v));
      if (d < bestDist || (d === bestDist && s < bestSkeleton)) {
        bestDist = d;
        bestSkeleton = s;
        bestMatch = v;
        ambiguous = false;
      } else if (d === bestDist && s === bestSkeleton && v !== bestMatch) {
        ambiguous = true;
      }
    }

    let corrected = (!ambiguous && bestMatch) ? bestMatch : token;
    if (corrected === token) corrected = skeletonMatch(norm, vocabSet) ?? token;
    // Fuzzy-corrected "parmak" → inch symbol
    return corrected === 'parmak' ? '"' : corrected;
  }).join('');
}

// Unit words a dealer writes next to a count. Deliberately fuzzy on the
// "Ad." family: the abbreviation's full stop is routinely read as a letter,
// so "Ad." comes back as "Ach", "Acl", "Adl". Same for "Boy" → "Bay".
const QTY_UNIT = 'adetler|adet|a[cdoe][hltdi]?|b[ao][yrg]|t[oe]p|paket|pkt|kutu|koli|rulo|takim|cift|metre|mt|litre|lt|kg';
const LEADING_QTY = new RegExp(`^(\\d+)\\s*(?:${QTY_UNIT})\\b`, 'i');
const TRAILING_QTY = new RegExp(`(\\d+)\\s*(?:${QTY_UNIT})\\b\\s*$`, 'i');

// "32mm çiftli kelepçe 30" — lists written as "product => 30 Ad." lose the
// abbreviation whenever OCR eats it (it comes back as "ΑΣ", "A2", "ゆと"),
// leaving the count as a bare number after the last word. Only the last
// word being real text keeps this from firing on a trailing size.
const TRAILING_COUNT = /[a-z]{3,}\S*\s+(\d{1,3})\s*$/i;

// ── Ditto marks ────────────────────────────────────────────────────────────

// A quote mark standing on its own is handwriting shorthand for "same as the
// line above" — three boru lines in a row where only the first spells out
// "(kompozitli)" and the rest just ditto it. Left alone, normalizeOcrText
// strips the mark as punctuation and the line loses that qualifier, which is
// usually the one word telling two catalog variants apart.
//
// An inch mark is the same character but never stands alone: it always hugs
// the digit it measures (`1"`, `1/2"`). So the test is what precedes the
// quote — whitespace or an opening paren means ditto, a digit means inches.
// The closing paren is optional because OCR loses it constantly.
const DITTO_PATTERN = /[(\s]\s*["'’‘“”′″]{1,3}\s*\)?\s*$/;

const PARENTHESIZED_QUALIFIER = /\([^()]+\)\s*$/;

// The same qualifier with its parentheses eaten by OCR — "(kompozitli)"
// routinely comes back as a bare "kompozit". What identifies it anyway is
// its position: this list format is "<product> => <count> <unit> <note>",
// so anything still standing after the count is the note. Requiring text
// before the count keeps quantity-first lists ("50 Ad. Vida") out of it —
// there, the trailing word is the product itself, not an annotation.
const BARE_QUALIFIER = new RegExp(
  `\\S\\s+\\d+\\s*(?:${QTY_UNIT})\\b[.,]?\\s+([a-zçğıöşü]{4,}(?:\\s+[a-zçğıöşü]{2,})*)\\s*$`, 'i');

export function applyDittoMarks(lines: string[]): string[] {
  let lastQualifier: string | null = null;
  return lines.map(line => {
    const dittoMatch = line.match(DITTO_PATTERN);
    if (dittoMatch && dittoMatch.index != null) {
      // Drop the mark either way — as punctuation it is only noise to the
      // matcher, and keeping it can only mislead.
      const head = line.slice(0, dittoMatch.index).trimEnd();
      return lastQualifier ? `${head} ${lastQualifier}` : head;
    }

    const parenthesized = line.match(PARENTHESIZED_QUALIFIER);
    const bare = parenthesized ? null : line.match(BARE_QUALIFIER);
    // A ditto refers to the run of lines it directly follows, so a line that
    // carries no qualifier of its own ends that run rather than letting a
    // stale one leak down the page.
    lastQualifier = parenthesized ? parenthesized[0] : bare ? bare[1] : null;
    return line;
  });
}

// True when the line carries a count and nothing else — no product on it.
export function isQuantityFragment(line: string): boolean {
  const n = normalizeOcrText(line);
  if (!n) return false;
  return new RegExp(`^\\d+(\\s*(?:${QTY_UNIT}))?$`, 'i').test(n);
}

// True when the line is only a size — the left column of a list written as
// "32mm | Boru | 8 Ad.", stranded on its own.
export function isSizeFragment(line: string): boolean {
  const n = normalizeOcrText(line);
  return !!n && /^\d{1,3}\s*(mm|cm|m)?$/.test(n);
}

const startsWithNumber = (line: string) => /^\s*\d/.test(normalizeOcrText(line));

const carriesCount = (line: string) => {
  const n = normalizeOcrText(line);
  return LEADING_QTY.test(n) || TRAILING_QTY.test(n) ||
    new RegExp(`\\d+\\s*(?:${QTY_UNIT})\\b`, 'i').test(n) || TRAILING_COUNT.test(n);
};

// Geometry-free counterpart to the overlay row rebuild, for when OCR
// returns no coordinates at all: a lone size or a lone count is never an
// order line, so it has to be given back to the row it came off.
//
// Which neighbour gets it is decidable from the text, without coordinates:
// it belongs to whichever adjacent line is MISSING that piece. A stray
// "25mm" sitting above a line that already starts with its own size, and
// below one that has none, came off the line below — and the same stray one
// row further down goes the other way. Position in the list says nothing
// (OCR emits the stray above its row as readily as below), which is why
// always attaching forward shifted half the page.
export function mergeStubLines(lines: string[]): string[] {
  const out: string[] = [];
  let pending = '';

  lines.forEach((raw, i) => {
    const line = ((pending ? pending + ' ' : '') + raw).trim();
    pending = '';
    if (!line) return;

    const isSize = isSizeFragment(line);
    const isCount = !isSize && isQuantityFragment(line);
    if ((isSize || isCount) && i < lines.length - 1) {
      const has = isSize ? startsWithNumber : carriesCount;
      const previous = out[out.length - 1];
      if (previous && !has(previous) && has(lines[i + 1])) {
        // Put it back where it was written: the size opens the row, the
        // count closes it. Tacking a size onto the end would push a
        // trailing ditto mark out of final position, and the ditto is only
        // recognised there — one misplaced token silently unhooks the
        // qualifier for every line below it.
        out[out.length - 1] = isSize ? `${line} ${previous}` : `${previous} ${line}`;
      } else {
        pending = line;
      }
      return;
    }
    out.push(line);
  });

  if (pending) out.push(pending);
  return out;
}

// Strip the count so it can't be scored as if it were a product attribute:
// "12 Boy 20 mm boru" must be matched on "20 mm boru" alone, or the 12
// happily matches some unrelated product whose name contains a 12.
function stripQuantityTokens(normalized: string): string {
  let out = normalized.replace(LEADING_QTY, '').replace(TRAILING_QTY, '');
  // A bare trailing count is only dropped when the line opens with a number
  // of its own: that leading number is the size, so removing the trailing
  // one costs the match nothing. Without it, the trailing number may be the
  // only size on the line and has to stay.
  if (/^\s*\d/.test(out)) out = out.replace(/([a-z]{3,}\S*)\s+\d{1,3}\s*$/i, '$1');
  return out.replace(/\s+/g, ' ').trim();
}

// Tokens that say nothing about *which* product a line means.
const NON_CONTENT_TOKENS = new Set([
  'adet', 'adetler', 'ad', 'mt', 'metre', 'litre', 'kg', 'kutu', 'koli',
  'rulo', 'paket', 'pkt', 'top', 'boy', 'takim', 'cift', 'mm', 'cm',
]);

const ANCHOR_WORDS = [
  'boru', 'dirsek', 'manson', 'reduksiyon', 'conta', 'vana',
  'kapak', 'spiral', 'inegal', 'havalandirma', 'parca',
];

export function normalizeOcrText(text: string): string {
  return String(text || '')
    // Must run before toLowerCase(): JS's default-locale toLowerCase() turns
    // 'İ' into 'i' + a combining dot above (two code points), not plain 'i',
    // so replacing 'İ' after lowercasing never matches and silently leaves
    // an invisible character in the output.
    .replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i')
    .toLowerCase()
    .replace(/ş/g, 's').replace(/Ş/g, 's')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/Ü/g, 'u')
    .replace(/ö/g, 'o').replace(/Ö/g, 'o')
    .replace(/ç/g, 'c').replace(/Ç/g, 'c')
    // Whatever accents are left are OCR's, not the writer's: reading Turkish
    // handwriting it reaches for ä, é, ô, ñ and the like. Decomposing and
    // dropping the marks folds them all to the plain letter. Without this
    // the next line turns the accent into a space and splits the word in
    // two, which no amount of fuzzy matching can recover from — "Kalkktär"
    // became "kalkkt r" and never stood a chance of reaching "kollektör".
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractQuantity(line: string): number {
  // Normalize first: "50. Acl." → "50 acl", so one unit list covers every
  // punctuation variant the writer used.
  const n = normalizeOcrText(line);
  const m =
    // The count is written in the left margin far more often than at the
    // end, so the leading form wins over anything later on the line.
    n.match(LEADING_QTY) ||
    n.match(TRAILING_QTY) ||
    n.match(new RegExp(`(\\d+)\\s*(?:${QTY_UNIT})\\b`, 'i')) ||
    n.match(new RegExp(`(?:${QTY_UNIT})\\s*[:\\-]?\\s*(\\d+)`, 'i')) ||
    n.match(TRAILING_COUNT);
  return m ? Math.max(1, parseInt(m[1], 10)) : 1;
}

function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  let curr: number[] = new Array(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      curr[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1]
        : 1 + Math.min(prev[j - 1], prev[j], curr[j - 1]);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

function stripTurkishSuffix(word: string): string {
  if (word.length < 5) return word;
  const suffixes = [
    'lerden', 'lardan', 'lerin', 'larin', 'lere', 'lara',
    'nden', 'ndan', 'nde', 'nda',
    'den', 'dan', 'ten', 'tan',
    'de', 'da', 'te', 'ta',
    'ler', 'lar', 'lu', 'li',
  ];
  for (const s of suffixes) {
    if (word.length > s.length + 2 && word.endsWith(s)) {
      return word.slice(0, -s.length);
    }
  }
  return word;
}

function vowelSkeleton(word: string): string {
  return word.replace(/[aeiou]/g, '');
}

function ocrDigitNorm(word: string): string {
  return word.replace(/0/g, 'o').replace(/1/g, 'l').replace(/5/g, 's').replace(/8/g, 'b');
}

function splitBoundaries(s: string): string {
  const split = s
    .replace(/([0-9])([a-z])/g, '$1 $2')
    .replace(/([a-z])([0-9])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();

  // The Turkish "-li/-lik" suffix also kept glued to its number, as an
  // extra token. In "8'li kollektör" the 8 IS the product — it is what
  // separates that manifold from the 2'li and the 12'li — but alone it is a
  // single character, which scores nothing, so every variant tied and
  // catalog order picked the winner. As "8li" it has weight, and no other
  // variant can claim it. Added rather than substituted: a line saying
  // "60 mm" still has to match a catalog entry spelling it "60'LIK".
  const glued = (split.match(/\b\d+\s+l[iu]k?\b/g) || []).map(m => m.replace(/\s+/g, ''));
  return glued.length ? `${split} ${glued.join(' ')}` : split;
}

function detectAnchor(normalizedLine: string): string | null {
  const words = normalizedLine.split(' ');
  for (const aw of ANCHOR_WORDS) {
    if (normalizedLine.includes(aw)) return aw;
    if (aw.length >= 6) {
      for (const w of words) {
        if (Math.abs(w.length - aw.length) <= 2 && editDistance(w, aw) <= 1) return aw;
      }
    }
  }
  return null;
}

// `score` ranks candidates against each other; `wordScore` counts only the
// evidence that came from actual *words* agreeing. They are tracked apart
// because a score built purely from numbers is nearly always a false
// positive: "20 Ad" scoring 20 on a product whose code happens to be "20"
// says nothing about the two being the same thing, yet it outranks every
// honest candidate. Acceptance therefore requires word evidence too.
function scoreProductAgainstLine(
  product: MatchProduct,
  normalizedLine: string,
): { score: number; wordScore: number } {
  let score = 0;
  let wordScore = 0;
  const addWord = (n: number) => { score += n; wordScore += n; };

  const lineWords: Record<string, boolean> = {};
  const lineTokens = splitBoundaries(normalizedLine).split(' ').filter(Boolean);
  // The number right before a unit word ("ad", "adet", "mt", "metre") is how
  // many the dealer wants, not a product attribute. Excluding it from
  // matching stops it coincidentally matching an unrelated number elsewhere
  // in a product's name (e.g. a pressure rating like "10 ATÜ"), which would
  // otherwise inflate an irrelevant product's score for no real reason.
  const qtyIdx = lineTokens.findIndex((w, i) =>
    /^\d+$/.test(w) && ['ad', 'adet', 'mt', 'metre'].includes(lineTokens[i + 1] || ''));
  lineTokens.forEach((w, i) => {
    if (i === qtyIdx) return;
    lineWords[w] = true;
    const stemmed = stripTurkishSuffix(w);
    if (stemmed !== w) lineWords[stemmed] = true;
  });

  // Brand name match (+10)
  const brandNorm = normalizeOcrText(product.brand);
  if (brandNorm.length > 2 && normalizedLine.includes(brandNorm)) addWord(10);

  const hasLetter = (s: string) => /[a-z]/.test(s);

  // Numbers directly following a known rating-code prefix ("PN" = nominal
  // pressure, "SDR" = standard dimension ratio) describe an attribute, not
  // the pipe's diameter — e.g. "PN25" in "20 mm KOMPOZİT BORU PN25 PPRC"
  // is a 25-bar pressure rating, not a 25mm size. Left in, a line asking
  // for 25mm would coincidentally match an OTHER-diameter variant that
  // happens to share the same PN/SDR rating, stealing the match from the
  // genuinely correct size.
  const RATING_PREFIXES = new Set(['pn', 'sdr']);
  const rawNameTokens = splitBoundaries(normalizeOcrText(product.productName)).split(' ').filter(Boolean);
  const nameTokens = rawNameTokens.filter((t, i) =>
    !(/^\d+$/.test(t) && RATING_PREFIXES.has(rawNameTokens[i - 1] || '')));

  // Exact word match from product name. Deduped: a word repeated in the
  // product name (e.g. a size number appearing twice, as in a "32*25*32mm"
  // combo variant) must not multiply its own score just by recurring.
  const nameParts = [...new Set(nameTokens)];
  for (const pw of nameParts) {
    if (lineWords[pw]) {
      const points = pw.length >= 5 ? 10 : pw.length === 4 ? 7 : pw.length >= 2 ? 3 : 0;
      if (hasLetter(pw)) addWord(points); else score += points;
    }
  }

  // Fuzzy prefix match (+10) — catches garbled long words
  let fuzzyPrefixMatch: string | null = null;
  const allProductWords = splitBoundaries(
    normalizeOcrText((product.brand || '') + ' ' + (product.productName || ''))
  ).split(' ').filter(Boolean);
  for (const fw of allProductWords) {
    if (fw.length < 7 || lineWords[fw]) continue;
    if (normalizedLine.includes(fw.substring(0, 5))) {
      if (hasLetter(fw)) addWord(10); else score += 10;
      fuzzyPrefixMatch = fw;
      break;
    }
  }

  // Edit-distance fuzzy match. A word already credited by the fuzzy-prefix
  // rule above is skipped here — otherwise the same near-match (e.g. a
  // product word that's just the line's word plus a Turkish suffix, like
  // "reduksiyonlu" vs line "reduksiyon") gets counted by both mechanisms
  // and ends up scoring higher than a real exact match would.
  const ocrWds = splitBoundaries(normalizedLine).split(' ').filter(Boolean);
  for (const pw of nameParts) {
    if (pw.length < 4 || lineWords[pw] || pw === fuzzyPrefixMatch) continue;
    let minDist = Infinity;
    const pwDn = ocrDigitNorm(pw);
    for (let q = 0; q < ocrWds.length; q++) {
      const ow = ocrWds[q];
      if (Math.abs(ow.length - pw.length) <= 3) {
        const d = editDistance(pw, ow);
        if (d < minDist) minDist = d;
      }
      const owDn = ocrDigitNorm(ow);
      if (Math.abs(owDn.length - pwDn.length) <= 3) {
        const dd = editDistance(pwDn, owDn);
        if (dd < minDist) minDist = dd;
      }
      // Adjacent token concatenation (OCR split one word into two)
      if (pw.length >= 6 && q + 1 < ocrWds.length) {
        const combined = ow + ocrWds[q + 1];
        if (Math.abs(combined.length - pw.length) <= 3) {
          const dc = editDistance(pw, combined);
          if (dc < minDist) minDist = dc;
        }
      }
    }
    const credit = hasLetter(pw) ? addWord : (n: number) => { score += n; };
    if      (minDist <= 1 && pw.length >= 5) { credit(10); }
    else if (minDist <= 1 && pw.length === 4) { credit(7); }
    else if (minDist === 2 && pw.length >= 8) { credit(7); }
    else if (minDist > 2  && pw.length >= 7) {
      const pwSkel = vowelSkeleton(pw);
      if (pwSkel.length >= 3) {
        for (const ow of ocrWds) {
          if (Math.abs(ow.length - pw.length) <= 3 && vowelSkeleton(ow) === pwSkel) {
            credit(5); break;
          }
        }
      }
    }
  }

  // Model code match. A code only identifies a product when it is
  // distinctive enough to *be* an identifier: a two-digit code like "20"
  // occurs in half the lines on a plumbing list as a plain diameter, and
  // crediting it +20 handed random products the top score. Short numeric
  // codes are therefore left to the per-number logic below, and a numeric
  // code must appear as a whole token rather than as a substring of some
  // longer number.
  if (product.productCode) {
    const modelNorm = normalizeOcrText(product.productCode);
    const numericCode = /^\d+$/.test(modelNorm);
    const codeHit = numericCode
      ? modelNorm.length >= 4 && lineTokens.includes(modelNorm)
      : modelNorm.length >= 3 && normalizedLine.includes(modelNorm);
    if (codeHit) {
      score += 20;
    } else {
      const modelNums: string[] = modelNorm.match(/\d+/g) || [];
      const lineNums: string[]  = normalizedLine.match(/\d+/g) || [];
      let numMatched = 0;
      for (const n of modelNums) {
        if (n.length >= 3 && lineNums.includes(n)) numMatched++;
      }
      if (numMatched >= 2) score += 15;
      else if (numMatched === 1) score += 10;
    }
  }

  // Leading number boost (+7) — first number on line often is a dimension in the product name
  const leadMatch = normalizedLine.match(/^(\d{2,})/);
  if (leadMatch) {
    const leadNum = leadMatch[1];
    if (nameTokens.includes(leadNum)) score += 7;
  }

  // Multi-size combo match (+12) — a line like "32x25x32 Te" or "32+25
  // redüksiyon" names a specific size combination, and one of its numbers
  // often repeats (e.g. "32" appears twice in "32x25x32"). A candidate
  // whose own name repeats that number just as many times is the genuine
  // combo match; one that merely contains each number once (a same-family
  // product with a *different* combo) would otherwise tie on generic
  // per-number credit alone despite not actually matching the combo asked for.
  const lineNumCounts = new Map<string, number>();
  lineTokens.forEach((w, i) => {
    if (i === qtyIdx || !/^\d{2,}$/.test(w)) return;
    lineNumCounts.set(w, (lineNumCounts.get(w) || 0) + 1);
  });
  const repeatedLineNum = [...lineNumCounts.entries()].find(([, c]) => c >= 2);
  if (repeatedLineNum) {
    const [num, count] = repeatedLineNum;
    const nameCount = nameTokens.filter(t => t === num).length;
    if (nameCount >= count) score += 12;
  }

  // Full-coverage bonus (+8). Everything the dealer wrote is accounted for
  // by this product's name — nothing left over that would belong to some
  // other item. That is what separates the right candidate from one that
  // merely shares a common word, and it is the only signal short lines
  // ("50 Ad. Vida") have to offer at all.
  const contentTokens = lineTokens.filter(t =>
    hasLetter(t) && t.length >= 3 && !NON_CONTENT_TOKENS.has(t));
  if (contentTokens.length && contentTokens.every(t => allProductWords.some(pw =>
    pw === t ||
    (pw.length >= 5 && t.length >= 5 && editDistance(pw, t) <= 1) ||
    (pw.length >= 5 && t.length >= 5 && (pw.startsWith(t.slice(0, 5)) || t.startsWith(pw.slice(0, 5))))
  ))) {
    addWord(8);
  }

  return { score, wordScore };
}

export function matchProductsFromOcr(lines: string[], products: MatchProduct[]): MatchResult {
  const matched: MatchedItem[] = [];
  const unmatched: UnmatchedLine[] = [];

  lines.forEach((line, lineIdx) => {
    const normalizedLine = normalizeOcrText(line);

    // One written row = one order item, so scoring runs on the row with its
    // count taken off. Everything left is describing the product.
    const productLine = stripQuantityTokens(normalizedLine);

    // Drop pure-quantity noise ("10 adet", "150 mt") — but nothing else. A
    // short line is still a line the dealer wrote: dropping it outright (the
    // old rule ignored anything under five characters) makes a page that OCR
    // split into columns look like a page that read as almost nothing, which
    // hides the real problem instead of showing it.
    const contentOnly = productLine.replace(/\d+/g, '').replace(/\s+/g, '').trim();
    if (contentOnly.length < 2) return;

    const qty = extractQuantity(line);

    // Category filter by anchor word
    const anchor = detectAnchor(productLine);
    let scoringProducts = products;
    if (anchor) {
      const filtered = products.filter(p => normalizeOcrText(p.productName).includes(anchor));
      if (filtered.length > 0) scoringProducts = filtered;
    }

    const debugScores: { id: string; productName: string; brand: string; score: number }[] = [];
    let bestScore = 0;
    let bestWordScore = 0;
    let bestProduct: MatchProduct | null = null;

    for (const p of scoringProducts) {
      const { score, wordScore } = scoreProductAgainstLine(p, productLine);
      if (score > 0) debugScores.push({ id: p.id, productName: p.productName, brand: p.brand, score });
      if (score > bestScore) { bestScore = score; bestWordScore = wordScore; bestProduct = p; }
    }

    debugScores.sort((a, b) => b.score - a.score);
    const topCandidates = debugScores.slice(0, 3).map(ds => ({
      productId: ds.id,
      productName: ds.productName,
      brand: ds.brand,
      score: ds.score,
    }));

    // When the dealer wrote actual words on the line, the winning product
    // has to agree with at least one of them. Winning on numbers alone
    // while every word is ignored is a coincidence, not a match ("20 Ad"
    // taking ADAPTÖR CONTA because its code is "20"), and "eşleşmedi" —
    // which the admin prices by hand — serves the dealer better than a
    // confidently wrong product on their order.
    //
    // Lines that are pure sizes ("32x25x32 Te", where OCR dropped the one
    // word) are exempt: numbers really are all the evidence there is, and
    // the size combination is itself specific enough to identify a part.
    const lineContentWords = splitBoundaries(productLine).split(' ').filter(t =>
      /[a-z]/.test(t) && t.length >= 3 && !NON_CONTENT_TOKENS.has(t));
    const wordBacked = lineContentWords.length === 0 || bestWordScore > 0;

    if (bestProduct && bestScore >= MIN_SCORE && wordBacked) {
      matched.push({
        productId: bestProduct.id,
        productName: bestProduct.productName,
        brand: bestProduct.brand,
        score: bestScore,
        quantity: qty,
        ocrLine: line,
        lineNumber: lineIdx + 1,
      });
    } else {
      unmatched.push({ ocrLine: line, quantity: qty, candidates: topCandidates, lineNumber: lineIdx + 1 });
    }
  });

  return { matched, unmatched };
}
