import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { read, utils } from 'xlsx';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Product } from '../types/firestore';

// Fixes productCode only, for products already sitting in the database from a
// past Excel İçe Aktar run. Unlike Fiyat Güncelle, this never touches price or
// listeAdi — the Excel's per-row Liste Adı is what tells different price lists
// apart, and forcing one list tag onto every matched row here would blur that.

type CodeField = 'brand' | 'productName' | 'productCode';

const FIELD_LABELS: Record<CodeField, string> = {
  brand: 'Marka *',
  productName: 'Ürün Adı *',
  productCode: 'Kod *',
};

const KEYWORDS: Record<CodeField, string[]> = {
  brand: ['marka', 'brand', 'firma'],
  productName: ['ürün adı', 'urun adi', 'isim', 'name', 'productname'],
  productCode: ['kod', 'ürün kodu', 'urun kodu', 'sku', 'code', 'model', 'productcode'],
};

function normalize(s: string): string {
  return String(s || '').toLowerCase()
    .replace(/İ/g, 'i').replace(/I/g, 'i')
    .replace(/ş/g, 's').replace(/Ş/g, 's')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/Ü/g, 'u')
    .replace(/ö/g, 'o').replace(/Ö/g, 'o')
    .replace(/ç/g, 'c').replace(/Ç/g, 'c')
    .trim();
}

function autoDetect(headers: string[]): Record<string, CodeField> {
  const mapping: Record<string, CodeField> = {};
  for (const header of headers) {
    const n = normalize(header);
    for (const [field, kws] of Object.entries(KEYWORDS) as [CodeField, string[]][]) {
      if (kws.some(k => n.includes(k))) { mapping[header] = field; break; }
    }
  }
  return mapping;
}

// A plain "Kod" column is the real code — prefer it over any other column
// mapped to the same field (e.g. a mostly-blank "Ürün Kodu" column) instead of
// letting whichever column comes last silently overwrite it with blank.
function pickMappedValue(row: Record<string, any>, mapping: Record<string, CodeField>, field: CodeField): string {
  const cols = Object.keys(mapping).filter(c => mapping[c] === field);
  const exactKod = cols.find(c => normalize(c) === 'kod');
  if (exactKod) return String(row[exactKod] ?? '').trim();
  let value = '';
  for (const c of cols) {
    const v = String(row[c] ?? '').trim();
    if (v) value = v;
  }
  return value;
}

function nameKey(productName: string, brand: string) {
  return `${normalize(productName)}__${normalize(brand)}`;
}

type ExcelRow = { brand: string; productName: string; productCode: string; _row: number };
type CodeUpdate = { productId: string; brand: string; productName: string; oldCode: string; newCode: string };

type Step = 1 | 2 | 3;

export default function AdminCodeFix() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState('');

  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [mapping, setMapping] = useState<Record<string, CodeField>>({});

  const [proceeding, setProceeding] = useState(false);
  const [updates, setUpdates] = useState<CodeUpdate[]>([]);
  const [alreadyCorrect, setAlreadyCorrect] = useState(0);
  const [unmatchedCount, setUnmatchedCount] = useState(0);
  const [noCodeCount, setNoCodeCount] = useState(0);

  const [updating, setUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState<{ updated: number; failed: number } | null>(null);

  const parseFile = useCallback(async (file: File) => {
    setParseError('');
    try {
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
      setFileName(file.name);
      setMapping(autoDetect(hdrs));
      setStep(2);
    } catch {
      setParseError('Dosya okunamadı. Lütfen geçerli bir Excel veya CSV dosyası seçin.');
    }
  }, []);

  const handleFile = (file: File) => {
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setParseError('Sadece .xlsx, .xls veya .csv dosyaları desteklenir.');
      return;
    }
    parseFile(file);
  };

  const proceed = async () => {
    const mapped = Object.values(mapping);
    const missing = (['brand', 'productName', 'productCode'] as CodeField[]).filter(f => !mapped.includes(f));
    if (missing.length) {
      alert('Zorunlu alanlar eşleştirilmedi: ' + missing.map(f => FIELD_LABELS[f]).join(', '));
      return;
    }
    setProceeding(true);
    try {
      const excelRows: ExcelRow[] = rawRows.map((row, i) => ({
        brand: pickMappedValue(row, mapping, 'brand'),
        productName: pickMappedValue(row, mapping, 'productName'),
        productCode: pickMappedValue(row, mapping, 'productCode'),
        _row: i + 2,
      })).filter(r => r.brand && r.productName);

      const prodSnap = await getDocs(collection(db, 'products'));
      const byKey = new Map<string, { id: string; productCode: string }>();
      prodSnap.docs.forEach(d => {
        const p = d.data() as Product;
        byKey.set(nameKey(p.productName || '', p.brand || ''), { id: d.id, productCode: p.productCode || '' });
      });

      const seen = new Set<string>();
      const toUpdate: CodeUpdate[] = [];
      let correct = 0, unmatched = 0, noCode = 0;

      for (const r of excelRows) {
        if (!r.productCode) { noCode++; continue; }
        const key = nameKey(r.productName, r.brand);
        const match = byKey.get(key);
        if (!match) { unmatched++; continue; }
        if (match.productCode === r.productCode) { correct++; continue; }
        if (seen.has(match.id)) continue; // duplicate row targeting the same product — first one wins
        seen.add(match.id);
        toUpdate.push({ productId: match.id, brand: r.brand, productName: r.productName, oldCode: match.productCode, newCode: r.productCode });
      }

      setUpdates(toUpdate);
      setAlreadyCorrect(correct);
      setUnmatchedCount(unmatched);
      setNoCodeCount(noCode);
      setStep(3);
    } finally {
      setProceeding(false);
    }
  };

  const doUpdate = async () => {
    if (!updates.length) return;
    if (!confirm(`${updates.length} ürünün kodu düzeltilecek. Fiyat ve Liste Adı bilgileri değişmeyecek. Devam edilsin mi?`)) return;

    setUpdating(true);
    setProgress(0);
    let updated = 0, failed = 0;
    for (let i = 0; i < updates.length; i++) {
      const u = updates[i];
      try {
        await updateDoc(doc(db, 'products', u.productId), { productCode: u.newCode });
        updated++;
      } catch {
        failed++;
      }
      setProgress(Math.round(((i + 1) / updates.length) * 100));
      if (i < updates.length - 1) await new Promise(r => setTimeout(r, 50));
    }
    setDone({ updated, failed });
    setUpdating(false);
  };

  if (done) {
    return (
      <div className="admin-page">
        <h2 className="admin-page-title">Kod Düzelt</h2>
        <div className="admin-form" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 48 }}>{done.failed === 0 ? '✅' : '⚠️'}</p>
          <h3 style={{ margin: '0 0 8px' }}>{done.failed === 0 ? 'Tamamlandı!' : 'Tamamlandı (uyarılarla)'}</h3>
          <p style={{ color: '#555' }}>
            {done.updated} ürünün kodu düzeltildi
            {done.failed > 0 ? `, ${done.failed} ürün başarısız` : ''}.
          </p>
          <button className="admin-btn admin-btn-primary" onClick={() => navigate('/admin/products')}>
            Ürünlere Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Kod Düzelt</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#888' }}>Adım {step}/3</span>
          <button className="admin-btn" onClick={() => navigate('/admin/products')}>İptal</button>
        </div>
      </div>

      {step === 1 && (
        <div className="admin-form">
          <p style={{ marginTop: 0, color: '#555', fontSize: 14 }}>
            Daha önce Excel İçe Aktar ile eklenen ürünlerin kodunu (Kod sütunu) düzeltir.
            Sadece <strong>Kod</strong> alanı güncellenir — Fiyat ve Liste Adı bilgileri değişmez.
            Ürün adı ve markaya göre eşleştirme yapılır.
          </p>
          <div
            className={`admin-upload-area${dragOver ? ' drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            onClick={() => document.getElementById('codeFixFileInput')?.click()}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔧</div>
            <h3 style={{ margin: '0 0 6px' }}>Excel Dosyası Seçin</h3>
            <p style={{ color: '#888', margin: '0 0 16px', fontSize: 14 }}>Sürükleyip bırakın veya tıklayın</p>
            <p style={{ color: '#aaa', fontSize: 12 }}>.xlsx, .xls, .csv desteklenir</p>
            <input id="codeFixFileInput" type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
          {parseError && <p className="admin-error" style={{ marginTop: 12 }}>{parseError}</p>}
        </div>
      )}

      {step === 2 && (
        <div className="admin-form" style={{ maxWidth: 900 }}>
          <p style={{ marginTop: 0, color: '#555', fontSize: 14 }}>
            <strong>{fileName}</strong> — {rawRows.length} satır, {headers.length} sütun. Sütunları aşağıdaki alanlara eşleştirin.
          </p>
          <div className="admin-table-wrapper" style={{ marginBottom: 20 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Excel Sütunu</th><th>Alan</th><th>Örnek Veri</th>
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
                          if (e.target.value) next[header] = e.target.value as CodeField;
                          else delete next[header];
                          return next;
                        })}
                        style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ddd', fontSize: 13 }}
                      >
                        <option value="">— Eşleştirme —</option>
                        {(Object.entries(FIELD_LABELS) as [CodeField, string][]).map(([k, v]) => (
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
          <div className="admin-form-actions">
            <button className="admin-btn" onClick={() => setStep(1)}>Geri</button>
            <button className="admin-btn admin-btn-primary" onClick={proceed} disabled={proceeding}>
              {proceeding ? 'Kontrol ediliyor...' : 'Devam Et →'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="admin-form" style={{ maxWidth: 900 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            <div style={{ background: '#d4edda', borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#155724' }}>{updates.length}</div>
              <div style={{ fontSize: 13, color: '#155724' }}>Düzeltilecek</div>
            </div>
            <div style={{ background: '#e2e3ff', borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#3730a3' }}>{alreadyCorrect}</div>
              <div style={{ fontSize: 13, color: '#3730a3' }}>Zaten Doğru</div>
            </div>
            <div style={{ background: '#fff3cd', borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#856404' }}>{unmatchedCount}</div>
              <div style={{ fontSize: 13, color: '#856404' }}>Eşleşmeyen</div>
            </div>
            <div style={{ background: '#f8d7da', borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#721c24' }}>{noCodeCount}</div>
              <div style={{ fontSize: 13, color: '#721c24' }}>Excel'de Kod Yok</div>
            </div>
          </div>

          {updates.length > 0 && (
            <div className="admin-table-wrapper" style={{ marginBottom: 20 }}>
              <table className="admin-table">
                <thead>
                  <tr><th>Marka</th><th>Ürün Adı</th><th>Eski Kod</th><th>Yeni Kod</th></tr>
                </thead>
                <tbody>
                  {updates.slice(0, 50).map(u => (
                    <tr key={u.productId}>
                      <td>{u.brand}</td>
                      <td>{u.productName}</td>
                      <td className="admin-mono" style={{ color: '#ccc', textDecoration: u.oldCode ? 'line-through' : 'none' }}>
                        {u.oldCode || '—'}
                      </td>
                      <td className="admin-mono" style={{ fontWeight: 600, color: '#155724' }}>{u.newCode}</td>
                    </tr>
                  ))}
                  {updates.length > 50 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: '#888', fontStyle: 'italic' }}>...ve {updates.length - 50} ürün daha</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {updates.length === 0 && (
            <p style={{ color: '#888', textAlign: 'center', padding: 20 }}>Düzeltilecek kod bulunamadı.</p>
          )}

          {updating && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'rgb(255,82,82)', transition: 'width 0.2s' }} />
              </div>
              <p style={{ fontSize: 13, color: '#555', margin: '6px 0 0' }}>Güncelleniyor... {progress}%</p>
            </div>
          )}

          <div className="admin-form-actions">
            <button className="admin-btn" onClick={() => setStep(2)} disabled={updating}>Geri</button>
            <button
              className="admin-btn admin-btn-primary"
              onClick={doUpdate}
              disabled={updating || updates.length === 0}
            >
              {updating ? 'Güncelleniyor...' : `${updates.length} Ürünün Kodunu Düzelt`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
