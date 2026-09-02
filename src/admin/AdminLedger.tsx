import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, getDocs, addDoc, setDoc, doc, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, getSecondaryAuth } from '../firebase';
import { fold } from '../searchFold.ts';
import { quoteNo, totalOf, invoiceQuote } from './quoteLedger';
import type { Dealer, DealerPayment, QuoteRequest } from '../types/firestore';

type DealerWithId = Dealer & { id: string };
type PaymentWithId = DealerPayment & { id: string };
type QuoteWithId = QuoteRequest & { id: string };

const PAYMENT_TYPES: DealerPayment['paymentType'][] = [
  'Nakit / Havale',
  'Tek Çekim',
  'Kredi Kartı (Taksitli)',
];

const EMPTY_MOVEMENT = {
  description: '',
  paymentType: 'Nakit / Havale' as DealerPayment['paymentType'],
  debt: '',
  credit: '',
};

const EMPTY_ACCOUNT = {
  companyName: '', email: '', password: '', phone: '', taxNumber: '', address: '',
};

// Balance convention (matches the dealer's own ledger): credit raises the
// balance, debt lowers it. A negative balance means the account owes money.
const balanceOf = (payments: PaymentWithId[]) =>
  payments.reduce((s, p) => s + (p.credit || 0) - (p.debt || 0), 0);

const money = (n: number) => `${n.toLocaleString('tr-TR')} ₺`;

function authErrorMessage(code: string): string {
  if (code === 'auth/email-already-in-use') return 'Bu e-posta zaten kayıtlı.';
  if (code === 'auth/invalid-email') return 'Geçersiz e-posta adresi.';
  if (code === 'auth/weak-password') return 'Şifre en az 6 karakter olmalı.';
  return 'Hesap oluşturulamadı: ' + code;
}

function genPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export default function AdminLedger() {
  const [accounts, setAccounts] = useState<DealerWithId[]>([]);
  const [paymentsByAccount, setPaymentsByAccount] = useState<Record<string, PaymentWithId[]>>({});
  const [pendingOrdersByAccount, setPendingOrdersByAccount] = useState<Record<string, QuoteWithId[]>>({});
  const [invoicing, setInvoicing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Add-movement modal
  const [movementFor, setMovementFor] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_MOVEMENT);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState('');
  const [savingMovement, setSavingMovement] = useState(false);
  const [movementError, setMovementError] = useState('');
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // New-account modal
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [acct, setAcct] = useState(EMPTY_ACCOUNT);
  const [creating, setCreating] = useState(false);
  const [acctError, setAcctError] = useState('');
  const [createdInfo, setCreatedInfo] = useState<{ email: string; password: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const [dealerSnap, paySnap, quoteSnap] = await Promise.all([
      getDocs(query(collection(db, 'dealers'), orderBy('companyName'))),
      getDocs(collection(db, 'dealerPayments')),
      getDocs(collection(db, 'quoteRequests')),
    ]);
    const accs = dealerSnap.docs
      .map(d => ({ id: d.id, ...d.data() } as DealerWithId))
      .filter(d => d.status === 'approved');
    const byAcc: Record<string, PaymentWithId[]> = {};
    paySnap.docs.forEach(d => {
      const p = { id: d.id, ...d.data() } as PaymentWithId;
      (byAcc[p.dealerId] ||= []).push(p);
    });
    Object.values(byAcc).forEach(list =>
      list.sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0)));
    const byAccPending: Record<string, QuoteWithId[]> = {};
    quoteSnap.docs.forEach(d => {
      const q = { id: d.id, ...d.data() } as QuoteWithId;
      if (q.status === 'confirmed' && !q.invoiced) (byAccPending[q.dealerId] ||= []).push(q);
    });
    setAccounts(accs);
    setPaymentsByAccount(byAcc);
    setPendingOrdersByAccount(byAccPending);
    setLoading(false);
  };

  const doInvoice = async (q: QuoteWithId) => {
    if (!confirm(`${quoteNo(q.id)} — ${q.dealerName}\n${money(q.total ?? totalOf(q.items))} tutarı cari hesaba BORÇ olarak işlensin mi?`)) return;
    setInvoicing(q.id);
    try {
      const paymentId = await invoiceQuote(q);
      setPendingOrdersByAccount(prev => ({
        ...prev,
        [q.dealerId]: (prev[q.dealerId] || []).filter(x => x.id !== q.id),
      }));
      const total = q.total ?? totalOf(q.items);
      const local: PaymentWithId = {
        id: paymentId,
        dealerId: q.dealerId,
        dealerName: q.dealerName,
        description: `Sipariş — Teklif ${quoteNo(q.id)}`,
        paymentType: 'Sipariş',
        debt: total,
        credit: 0,
        quoteId: q.id,
        createdAt: new Date(),
      } as PaymentWithId;
      setPaymentsByAccount(prev => ({ ...prev, [q.dealerId]: [...(prev[q.dealerId] || []), local] }));
    } catch (e: any) {
      alert('Faturalandırma başarısız: ' + (e.message || e));
    } finally {
      setInvoicing(null);
    }
  };

  useEffect(() => { load(); }, []);

  const totals = useMemo(() => {
    let debt = 0, credit = 0;
    Object.values(paymentsByAccount).forEach(list =>
      list.forEach(p => { debt += p.debt || 0; credit += p.credit || 0; }));
    return { debt, credit, net: credit - debt };
  }, [paymentsByAccount]);

  const rows = useMemo(() => {
    const q = fold(search);
    return accounts
      .map(a => ({ ...a, balance: balanceOf(paymentsByAccount[a.id] || []) }))
      .filter(a => !q || fold(a.companyName).includes(q))
      .sort((a, b) => a.balance - b.balance); // most in debt first
  }, [accounts, paymentsByAccount, search]);

  // ── Movements ──────────────────────────────────────────────────────────────

  const openMovement = (accountId: string) => {
    setMovementFor(accountId);
    setForm(EMPTY_MOVEMENT);
    setPdfData(null);
    setPdfFileName('');
    setMovementError('');
  };

  const handlePdf = (file: File) => {
    if (file.size > 5 * 1024 * 1024) { alert("PDF dosyası 5MB'dan küçük olmalı."); return; }
    const reader = new FileReader();
    reader.onload = e => { setPdfData(e.target!.result as string); setPdfFileName(file.name); };
    reader.readAsDataURL(file);
  };

  const saveMovement = async () => {
    const acctId = movementFor!;
    if (!form.description.trim()) { setMovementError('Açıklama zorunludur.'); return; }
    const debt = parseFloat(form.debt) || 0;
    const credit = parseFloat(form.credit) || 0;
    if (debt === 0 && credit === 0) { setMovementError('Borç veya alacak girilmelidir.'); return; }
    const account = accounts.find(a => a.id === acctId);
    if (!account) return;
    setMovementError('');
    setSavingMovement(true);
    try {
      const data: any = {
        dealerId: acctId,
        dealerName: account.companyName,
        description: form.description.trim(),
        paymentType: form.paymentType,
        debt,
        credit,
        createdAt: serverTimestamp(),
      };
      if (pdfData) { data.pdfData = pdfData; data.pdfFileName = pdfFileName; }
      const ref = await addDoc(collection(db, 'dealerPayments'), data);
      const local = { id: ref.id, ...data, createdAt: new Date() } as PaymentWithId;
      setPaymentsByAccount(prev => ({ ...prev, [acctId]: [...(prev[acctId] || []), local] }));
      setMovementFor(null);
    } catch (e: any) {
      setMovementError(e.message || 'Kayıt başarısız.');
    } finally {
      setSavingMovement(false);
    }
  };

  // ── New account ────────────────────────────────────────────────────────────

  const createAccount = async () => {
    if (!acct.companyName.trim() || !acct.email.trim()) {
      setAcctError('Firma adı ve e-posta zorunludur.'); return;
    }
    if (acct.password.length < 6) { setAcctError('Şifre en az 6 karakter olmalı.'); return; }
    setAcctError('');
    setCreating(true);
    try {
      // Create the login on a secondary app so the admin stays signed in.
      const secAuth = getSecondaryAuth();
      const cred = await createUserWithEmailAndPassword(secAuth, acct.email.trim(), acct.password);
      const uid = cred.user.uid;
      await signOut(secAuth);

      const data = {
        companyName: acct.companyName.trim(),
        email: acct.email.trim(),
        phone: acct.phone.trim(),
        taxNumber: acct.taxNumber.trim(),
        address: acct.address.trim(),
        status: 'approved' as const,
        source: 'manual' as const,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'dealers', uid), data);
      setAccounts(prev => [...prev, { id: uid, ...data, createdAt: new Date() }]
        .sort((a, b) => a.companyName.localeCompare(b.companyName, 'tr')));
      setCreatedInfo({ email: acct.email.trim(), password: acct.password });
      setAcct(EMPTY_ACCOUNT);
    } catch (e: any) {
      setAcctError(authErrorMessage(e.code || e.message || ''));
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="admin-page"><p>Yükleniyor...</p></div>;

  const movementAccount = movementFor ? accounts.find(a => a.id === movementFor) : null;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Cari Hesaplar</h2>
        <button className="admin-btn admin-btn-primary" onClick={() => {
          setShowNewAccount(true); setAcct(EMPTY_ACCOUNT); setAcctError(''); setCreatedInfo(null);
        }}>
          + Yeni Hesap
        </button>
      </div>

      {/* Totals across all accounts */}
      <div className="ledger-totals">
        <div className="ledger-total-box">
          <span className="ledger-total-label">Toplam Alacak</span>
          <strong className="ledger-total-value" style={{ color: '#2ecc71' }}>{money(totals.credit)}</strong>
        </div>
        <div className="ledger-total-box">
          <span className="ledger-total-label">Toplam Borç</span>
          <strong className="ledger-total-value" style={{ color: '#e74c3c' }}>{money(totals.debt)}</strong>
        </div>
        <div className="ledger-total-box">
          <span className="ledger-total-label">Net Bakiye</span>
          <strong className="ledger-total-value" style={{ color: totals.net >= 0 ? '#2ecc71' : '#e74c3c' }}>
            {money(totals.net)}
          </strong>
        </div>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Hesap ara..."
        style={{ width: 320, maxWidth: '100%', marginBottom: 16, padding: '9px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }}
      />

      {rows.length === 0 ? (
        <p style={{ color: '#888' }}>Hesap bulunamadı.</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Hesap</th>
                <th style={{ textAlign: 'right' }}>Bakiye</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(a => {
                const isOpen = expandedId === a.id;
                const list = paymentsByAccount[a.id] || [];
                let running = 0;
                const movementRows = list.map(p => {
                  running += (p.credit || 0) - (p.debt || 0);
                  return { ...p, balance: running };
                });
                return (
                  <FragmentRow key={a.id}>
                    <tr
                      className={isOpen ? 'admin-row-selected' : ''}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setExpandedId(isOpen ? null : a.id)}
                    >
                      <td style={{ fontWeight: 600 }}>
                        {a.companyName}
                        {a.source === 'manual' && <span className="ledger-tag">Manuel</span>}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: a.balance >= 0 ? '#2ecc71' : '#e74c3c' }}>
                        {money(a.balance)}
                      </td>
                      <td style={{ textAlign: 'center', color: '#888' }}>{isOpen ? '▲' : '▼'}</td>
                    </tr>

                    {isOpen && (
                      <tr>
                        <td colSpan={3} style={{ background: '#f7f8fa', padding: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                            <span style={{ fontSize: 13, color: '#666' }}>
                              {a.email}{a.phone ? ` · ${a.phone}` : ''}
                            </span>
                            <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={e => { e.stopPropagation(); openMovement(a.id); }}>
                              + Hareket Ekle
                            </button>
                          </div>

                          {(pendingOrdersByAccount[a.id] || []).length > 0 && (
                            <div style={{ marginBottom: 16 }}>
                              <h4 style={{ fontSize: 13, color: '#666', margin: '0 0 8px' }}>Bekleyen Siparişler</h4>
                              <div className="admin-table-wrapper" style={{ marginBottom: 0 }}>
                                <table className="admin-table">
                                  <thead>
                                    <tr><th>Teklif</th><th>Tarih</th><th style={{ textAlign: 'right' }}>Tutar</th><th></th></tr>
                                  </thead>
                                  <tbody>
                                    {(pendingOrdersByAccount[a.id] || []).map(q => (
                                      <tr key={q.id}>
                                        <td className="admin-mono">{quoteNo(q.id)}</td>
                                        <td>{q.confirmedAt?.toDate?.().toLocaleDateString('tr-TR') ?? '—'}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{money(q.total ?? totalOf(q.items))}</td>
                                        <td style={{ textAlign: 'right' }}>
                                          <button
                                            className="admin-btn admin-btn-primary admin-btn-sm"
                                            onClick={e => { e.stopPropagation(); doInvoice(q); }}
                                            disabled={invoicing === q.id}
                                          >
                                            {invoicing === q.id ? 'İşleniyor...' : '💳 Faturalandır'}
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {movementRows.length === 0 ? (
                            <p style={{ color: '#888', margin: 0 }}>Henüz hareket bulunmuyor.</p>
                          ) : (
                            <div className="admin-table-wrapper" style={{ marginBottom: 0 }}>
                              <table className="admin-table">
                                <thead>
                                  <tr><th>Tarih</th><th>Açıklama</th><th>Ödeme Tipi</th><th>Borç</th><th>Alacak</th><th>Bakiye</th><th>Belge</th></tr>
                                </thead>
                                <tbody>
                                  {movementRows.map(p => (
                                    <tr key={p.id}>
                                      <td>{p.createdAt?.toDate?.().toLocaleDateString('tr-TR') ?? new Date().toLocaleDateString('tr-TR')}</td>
                                      <td>{p.description}</td>
                                      <td><span className="admin-badge">{p.paymentType}</span></td>
                                      <td style={{ color: p.debt ? '#e74c3c' : '' }}>{p.debt ? money(p.debt) : '—'}</td>
                                      <td style={{ color: p.credit ? '#2ecc71' : '' }}>{p.credit ? money(p.credit) : '—'}</td>
                                      <td style={{ color: p.balance >= 0 ? '#2ecc71' : '#e74c3c', fontWeight: 600 }}>{money(p.balance)}</td>
                                      <td>
                                        {p.pdfData && (
                                          <a href={p.pdfData} download={(p as any).pdfFileName || 'belge.pdf'} className="admin-btn admin-btn-sm" onClick={e => e.stopPropagation()}>PDF</a>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </FragmentRow>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add-movement modal */}
      {movementFor && (
        <div className="admin-modal-overlay" onClick={() => setMovementFor(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Hareket Ekle — {movementAccount?.companyName}</h3>
              <button className="admin-modal-close" onClick={() => setMovementFor(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-grid">
                <label style={{ gridColumn: '1/-1' }}>
                  Açıklama *
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ödeme, fatura, vb." />
                </label>
                <label>
                  Ödeme Tipi
                  <select value={form.paymentType} onChange={e => setForm(f => ({ ...f, paymentType: e.target.value as DealerPayment['paymentType'] }))}>
                    {PAYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label>
                  Borç (₺)
                  <input type="number" min={0} step={0.01} value={form.debt} onChange={e => setForm(f => ({ ...f, debt: e.target.value }))} placeholder="0" />
                </label>
                <label>
                  Alacak (₺)
                  <input type="number" min={0} step={0.01} value={form.credit} onChange={e => setForm(f => ({ ...f, credit: e.target.value }))} placeholder="0" />
                </label>
                <label style={{ gridColumn: '1/-1' }}>
                  PDF Belgesi (opsiyonel)
                  <input ref={pdfInputRef} type="file" accept=".pdf" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handlePdf(f); }} />
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
                    <button type="button" className="admin-btn admin-btn-sm" onClick={() => pdfInputRef.current?.click()}>PDF Seç</button>
                    {pdfFileName && <span style={{ fontSize: 13, color: '#888' }}>{pdfFileName}</span>}
                    {pdfData && <button type="button" className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => { setPdfData(null); setPdfFileName(''); }}>Kaldır</button>}
                  </div>
                </label>
              </div>
              {movementError && <p className="admin-error" style={{ marginTop: 8 }}>{movementError}</p>}
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn" onClick={() => setMovementFor(null)}>İptal</button>
              <button className="admin-btn admin-btn-primary" onClick={saveMovement} disabled={savingMovement}>
                {savingMovement ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New-account modal */}
      {showNewAccount && (
        <div className="admin-modal-overlay" onClick={() => setShowNewAccount(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Yeni Hesap</h3>
              <button className="admin-modal-close" onClick={() => setShowNewAccount(false)}>✕</button>
            </div>

            {createdInfo ? (
              <div className="admin-modal-body">
                <p style={{ color: '#2ecc71', fontWeight: 600, marginTop: 0 }}>✓ Hesap oluşturuldu.</p>
                <p style={{ fontSize: 13, color: '#aaa' }}>
                  Bu giriş bilgilerini müşteriye iletin. Şifre tekrar gösterilmeyecek.
                </p>
                <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: 14, fontSize: 14 }}>
                  <div><span style={{ color: '#888' }}>E-posta:</span> <strong>{createdInfo.email}</strong></div>
                  <div style={{ marginTop: 6 }}><span style={{ color: '#888' }}>Şifre:</span> <strong style={{ fontFamily: 'monospace' }}>{createdInfo.password}</strong></div>
                </div>
                <div className="admin-modal-footer" style={{ paddingLeft: 0, paddingRight: 0 }}>
                  <button className="admin-btn admin-btn-primary" onClick={() => setShowNewAccount(false)}>Kapat</button>
                </div>
              </div>
            ) : (
              <>
                <div className="admin-modal-body">
                  <div className="admin-form-grid">
                    <label style={{ gridColumn: '1/-1' }}>
                      Firma Adı *
                      <input value={acct.companyName} onChange={e => setAcct(a => ({ ...a, companyName: e.target.value }))} placeholder="Örn. Yılmaz İnşaat" />
                    </label>
                    <label>
                      E-posta * (giriş için)
                      <input type="email" value={acct.email} onChange={e => setAcct(a => ({ ...a, email: e.target.value }))} placeholder="firma@ornek.com" />
                    </label>
                    <label>
                      Şifre *
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input value={acct.password} onChange={e => setAcct(a => ({ ...a, password: e.target.value }))} placeholder="En az 6 karakter" style={{ flex: 1 }} />
                        <button type="button" className="admin-btn admin-btn-sm" onClick={() => setAcct(a => ({ ...a, password: genPassword() }))}>Oluştur</button>
                      </div>
                    </label>
                    <label>
                      Telefon
                      <input value={acct.phone} onChange={e => setAcct(a => ({ ...a, phone: e.target.value }))} placeholder="0462 ..." />
                    </label>
                    <label>
                      Vergi No
                      <input value={acct.taxNumber} onChange={e => setAcct(a => ({ ...a, taxNumber: e.target.value }))} />
                    </label>
                    <label style={{ gridColumn: '1/-1' }}>
                      Adres
                      <input value={acct.address} onChange={e => setAcct(a => ({ ...a, address: e.target.value }))} />
                    </label>
                  </div>
                  {acctError && <p className="admin-error" style={{ marginTop: 8 }}>{acctError}</p>}
                </div>
                <div className="admin-modal-footer">
                  <button className="admin-btn" onClick={() => setShowNewAccount(false)}>İptal</button>
                  <button className="admin-btn admin-btn-primary" onClick={createAccount} disabled={creating}>
                    {creating ? 'Oluşturuluyor...' : 'Hesap Oluştur'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Table bodies can't take a keyed fragment directly in TSX without a wrapper
// element, so group the main row and its detail row through this helper.
function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
