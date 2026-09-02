// Turkish-aware search normalization. Plain toLowerCase() turns 'İ' into
// 'i̇' (i + combining dot), so "dirsek" never matches "DİRSEK". Folding also
// maps ş/ğ/ü/ö/ç/ı to ASCII so queries typed without a Turkish keyboard
// ("kirmizi") still match Turkish text ("KIRMIZI").
export function fold(s: string): string {
  return (s || '')
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// URL/ID-safe slug — matches the Excel import's slugify, which builds doc IDs
// for code-less products from their name.
export function slugify(s: string): string {
  return fold(s).trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}
