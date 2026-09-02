import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { callOcrSpaceLines } from '../ocr/ocrUtils';
import { correctOcrLine } from '../ocr/ocrMatch';

const API_KEY = import.meta.env.VITE_OCR_SPACE_KEY as string | undefined;

// ── Types ─────────────────────────────────────────────────────────────────

type ListRow = { id: number; code: string; name: string };

let nextId = 1;
function mkRow(line = ''): ListRow {
  // Dimensions like "100×3000" belong in the name; strip trailing quantity only
  const name = line.trim()
    .replace(/\s+\d+\s*(adet(?:ler)?|adeti?|ad|mt|metre)\s*$/i, '')
    .trim();
  return { id: nextId++, code: '', name };
}

// ── Component ───────────────────────────────────────────────────────────────

export default function AdminProductOcr() {
  const navigate = useNavigate();

  const [status, setStatus]         = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [statusText, setStatusText] = useState('');
  const [dragOver, setDragOver]     = useState(false);

  const [rows, setRows]             = useState<ListRow[]>([]);
  const [saving, setSaving]         = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  // ── OCR flow ────────────────────────────────────────────────────────────
  const runListOcr = useCallback(async (file: File) => {
    if (!API_KEY) { setStatus('error'); setStatusText('VITE_OCR_SPACE_KEY eksik.'); return; }
    setStatus('running'); setRows([]); setSavedCount(null);
    try {
      setStatusText('Satırlar okunuyor...');
      const rawLines = await callOcrSpaceLines(file, API_KEY);
      if (!rawLines.length) { setStatus('error'); setStatusText('Hiç satır bulunamadı. Daha net bir görsel deneyin.'); return; }
      const lines = rawLines.map(l => correctOcrLine(l));
      setRows(lines.map(mkRow));
      setStatus('done');
      setStatusText('');
    } catch (err: any) {
      setStatus('error'); setStatusText('Hata: ' + (err.message || 'Bilinmeyen hata'));
    }
  }, []);

  const handleFile = (file: File) => {
    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp|heic)$/i.test(file.name);
    const isPdf   = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isImage && !isPdf) { alert('Sadece görsel veya PDF yükleyebilirsiniz.'); return; }
    if (file.size > 20 * 1024 * 1024) { alert("Dosya boyutu 20MB'dan küçük olmalıdır."); return; }
    runListOcr(file);
  };

  // ── Row helpers ───────────────────────────────────────────────────────────
  const updateRow = (id: number, field: 'code' | 'name', value: string) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  const removeRow = (id: number) => setRows(prev => prev.filter(r => r.id !== id));
  const addRow    = () => setRows(prev => [...prev, mkRow()]);

  const saveAll = async () => {
    const valid = rows.filter(r => r.code.trim() || r.name.trim());
    if (!valid.length) return;
    setSaving(true);
    let count = 0;
    for (const r of valid) {
      await addDoc(collection(db, 'products'), {
        productCode: r.code.trim(),
        productName: r.name.trim(),
        productType: '',
        brand: '',
        depth: '', width: '', height: '',
        listTitle: [], listValue: [],
        img: '', logo: '', price: 0,
        isActive: false,
        createdAt: serverTimestamp(),
      });
      count++;
    }
    setSaving(false);
    setSavedCount(count);
  };

  const reset = () => {
    setStatus('idle');
    setRows([]); setSavedCount(null); setStatusText('');
  };

  // ── Shared UI ─────────────────────────────────────────────────────────────
  const UploadArea = (
    <div className="admin-form" style={{ marginBottom: 20 }}>
      <div
        className={`admin-upload-area${dragOver ? ' drag-over' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
        onClick={() => document.getElementById('ocrFileInput')?.click()}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
        <h3 style={{ margin: '0 0 6px' }}>Ürün Listesi Görseli Yükleyin</h3>
        <p style={{ color: '#888', margin: '0 0 6px', fontSize: 14 }}>Her satır ayrı bir ürün girişi olarak işlenir</p>
        <p style={{ color: '#aaa', fontSize: 12 }}>JPG, PNG, WEBP, PDF · Maksimum 20 MB</p>
        <input id="ocrFileInput" type="file" accept="image/*,.pdf" style={{ display: 'none' }}
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>
      {status === 'error' && <p className="admin-error" style={{ marginTop: 12 }}>{statusText}</p>}
    </div>
  );

  const RunningState = (
    <div className="admin-form" style={{ textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
      <p style={{ color: '#555', margin: 0 }}>{statusText}</p>
      <div style={{ height: 6, background: '#eee', borderRadius: 3, marginTop: 20, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: '60%', background: 'rgb(255,82,82)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
    </div>
  );

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Görsel ile Ürün Ekle</h2>
        <button className="admin-btn" onClick={() => navigate('/admin/products')}>İptal</button>
      </div>

      {(status === 'idle' || status === 'error') && UploadArea}
      {status === 'running' && RunningState}

      {status === 'done' && rows.length > 0 && !savedCount && (
        <div className="admin-form">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <p style={{ margin: 0, fontSize: 14, color: '#444' }}>
              <strong>{rows.length}</strong> satır bulundu. Düzenleyin ve kaydedin.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="admin-btn" onClick={reset}>Yeniden Yükle</button>
              <button className="admin-btn" onClick={addRow}>+ Satır Ekle</button>
              <button className="admin-btn admin-btn-primary" onClick={saveAll} disabled={saving}>
                {saving ? 'Kaydediliyor...' : `Toplu Kaydet (${rows.filter(r => r.code || r.name).length})`}
              </button>
            </div>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}>#</th>
                  <th>Ürün Kodu</th>
                  <th>Ürün Adı</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.id}>
                    <td className="admin-mono" style={{ color: '#999' }}>{i + 1}</td>
                    <td>
                      <input value={row.code} onChange={e => updateRow(row.id, 'code', e.target.value)}
                        placeholder="—"
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }} />
                    </td>
                    <td>
                      <input value={row.name} onChange={e => updateRow(row.id, 'name', e.target.value)}
                        placeholder="—"
                        style={{ width: '100%', padding: '5px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }} />
                    </td>
                    <td>
                      <button className="admin-btn admin-btn-danger admin-btn-sm"
                        onClick={() => removeRow(row.id)} title="Sil">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="admin-btn" onClick={addRow}>+ Satır Ekle</button>
            <button className="admin-btn admin-btn-primary" onClick={saveAll} disabled={saving}>
              {saving ? 'Kaydediliyor...' : `Toplu Kaydet (${rows.filter(r => r.code || r.name).length})`}
            </button>
          </div>
        </div>
      )}

      {savedCount !== null && (
        <div className="admin-form" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
          <h3 style={{ margin: '0 0 8px' }}>{savedCount} ürün taslak olarak kaydedildi</h3>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
            Ürünler <em>pasif</em> olarak eklendi. Admin → Ürünler sayfasından detayları tamamlayın.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="admin-btn" onClick={reset}>Yeni Liste Yükle</button>
            <button className="admin-btn admin-btn-primary" onClick={() => navigate('/admin/products')}>
              Ürünlere Git
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
