// Selling units ("birim") a product's price can be expressed in. "Adet" and
// "Metre" are always available; admins can add their own from the Birim Ayarla
// page, which stores them as docs in the `units` collection.
export type UnitOption = { slug: string; label: string };

export const BUILTIN_UNITS: UnitOption[] = [
  { slug: 'adet', label: 'Adet' },
  { slug: 'metre', label: 'Metre' },
];

const isBuiltin = (slug: string) => BUILTIN_UNITS.some(u => u.slug === slug);

// Doc id for a unit: lowercased, inner spaces to underscores. Turkish letters
// are kept as-is, so "Metre Tül" becomes "metre_tül".
export const unitSlug = (label: string) =>
  label.trim().toLocaleLowerCase('tr').replace(/\s+/g, '_');

// Builtins first, then the admin's own units alphabetically. A custom doc that
// reuses a builtin slug is ignored so the list can't show duplicates.
export const mergeUnits = (custom: UnitOption[]): UnitOption[] => [
  ...BUILTIN_UNITS,
  ...custom
    .filter(u => !isBuiltin(u.slug))
    .sort((a, b) => a.label.localeCompare(b.label, 'tr')),
];

// Admin-facing label. Falls back to the slug for products whose unit doc was
// deleted, so the row still shows something meaningful.
export const unitLabel = (units: UnitOption[], slug?: string) =>
  units.find(u => u.slug === slug)?.label || (slug ? slug.replace(/_/g, ' ') : '');

// Customer-facing text ("250 ₺ / metre tül"). The public site doesn't load the
// units collection, so it renders the slug stored on the product.
export const unitText = (slug?: string) => (slug || 'adet').replace(/_/g, ' ');

export const canDeleteUnit = (slug: string) => !isBuiltin(slug);
