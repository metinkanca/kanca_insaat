// Shared between AdminQuotes.tsx and AdminLedger.tsx: posting a confirmed
// quote's total to the dealer's cari hesap as an actual borç movement.
// Kept in one place so both screens agree on the description format and
// on what "invoiced" means.
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { QuoteRequest, QuoteItem } from '../types/firestore';

type QuoteWithId = QuoteRequest & { id: string };

export const quoteNo = (id: string) => `#${id.slice(-6).toUpperCase()}`;

export const totalOf = (items: QuoteItem[]) =>
  items.reduce((s, i) => s + (i.unitPrice ?? 0) * i.qty, 0);

// Posts the borç movement for a confirmed-but-not-yet-invoiced quote and
// marks it invoiced. Returns the new dealerPayments doc id.
export async function invoiceQuote(q: QuoteWithId): Promise<string> {
  const total = q.total ?? totalOf(q.items);
  const ref = await addDoc(collection(db, 'dealerPayments'), {
    dealerId: q.dealerId,
    dealerName: q.dealerName,
    description: `Sipariş — Teklif ${quoteNo(q.id)}`,
    paymentType: 'Sipariş',
    debt: total,
    credit: 0,
    quoteId: q.id,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'quoteRequests', q.id), {
    invoiced: true,
    invoicedAt: serverTimestamp(),
  });
  return ref.id;
}
