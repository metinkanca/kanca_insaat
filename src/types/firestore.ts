export interface Category {
  slug: string;
  title: string;
  img: string[];
  brand: string[];
  brandImg: string[];
  link: string[];
  order: number;
}

// One tile in the home page showcase grid. Admins pick the tiles (and their
// order) from the panel; a tile points either at a catalog category or at a
// single product, and may override the label/image shown on the tile.
export interface HomeShowcaseTile {
  kind: 'category' | 'product';
  // categories/{id} (slug) for 'category', products/{id} for 'product'.
  refId: string;
  // Blank falls back to the referenced document's own title/image.
  label?: string;
  img?: string;
}

export interface HomeConfig {
  sliderImages: string[];
  popularProductIds: string[];
  showcaseTiles?: HomeShowcaseTile[];
}

export interface BrandGroup {
  brand: string;
  productName: string;
  productType: string;
  productCode: string[];
  img: string[];
}

export interface Product {
  productType: string;
  productCode: string;
  productName: string;
  depth: string;
  width: string;
  height: string;
  listTitle: string[];
  listValue: string[];
  logo?: string;
  dealerLink?: string;
  listeAdi?: string;
  brand: string;
  img: string;
  price: number;
  isActive: boolean;
  // How this product's price/quantity is expressed on quotes and orders — most
  // products are sold per piece, but some (e.g. pipes) are sold per meter.
  // Holds a unit slug: 'adet'/'metre' or one added from the Birim Ayarla page.
  unit?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

export interface Dealer {
  companyName: string;
  email: string;
  phone: string;
  taxNumber: string;
  address: string;
  status: 'pending' | 'approved' | 'rejected';
  // 'manual' = created by an admin from the panel; otherwise self-registered.
  source?: 'manual' | 'portal';
  createdAt: any;
}

export interface QuoteItem {
  productId: string;
  productName: string;
  productCode: string;
  qty: number;
  unitPrice?: number;
}

export interface QuoteRequest {
  dealerId: string;
  dealerName: string;
  items: QuoteItem[];
  // 'answered' is legacy (old price-only flow); new flow: pending → confirmed/rejected
  status: 'pending' | 'answered' | 'confirmed' | 'rejected';
  // 'list' = built from an OCR-read photo/PDF; 'manual' = product picker
  source?: 'manual' | 'list';
  total?: number;
  notes: string;
  createdAt: any;
  answeredAt?: any;
  confirmedAt?: any;
  // Confirming a quote only stages it on the dealer's cari hesap — it does
  // NOT touch the balance. A separate "Faturalandır" step posts the actual
  // borç movement; invoiced flips true at that point.
  invoiced?: boolean;
  invoicedAt?: any;
}

export interface DealerPayment {
  dealerId: string;
  dealerName: string;
  description: string;
  debt: number;
  credit: number;
  paymentType: 'Nakit / Havale' | 'Tek Çekim' | 'Kredi Kartı (Taksitli)' | 'Sipariş';
  pdfData?: string;
  pdfFileName?: string;
  orderId?: string;
  quoteId?: string;
  createdAt: any;
}

export interface Order {
  id?: string;
  customerName: string;
  email: string;
  phone: string;
  total: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: any;
  items: OrderItem[];
  dealerId?: string;
  dealerName?: string;
}
