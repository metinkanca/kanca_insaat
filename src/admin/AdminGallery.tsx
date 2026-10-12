import { useEffect, useRef, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { compressImage } from './imageUtils';

interface GalleryItem {
  id: string;
  img: string;
}

// Firestore caps a document at 1 MiB; stay well under it for the base64 string.
const MAX_IMG_CHARS = 900_000;

// Gallery photos open full-size in a lightbox, so keep more detail than the
// 800px used for product images; fall back to a smaller size if it is too big.
async function compressForGallery(file: File): Promise<string> {
  let img = await compressImage(file, 1400, 0.8);
  if (img.length > MAX_IMG_CHARS) img = await compressImage(file, 1000, 0.65);
  if (img.length > MAX_IMG_CHARS) throw new Error('Görsel çok büyük, sıkıştırılamadı.');
  return img;
}

export default function AdminGallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [progress, setProgress] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getDocs(query(collection(db, 'galleryImages'), orderBy('createdAt')))
      .then(snap => setItems(snap.docs.map(d => ({ id: d.id, img: d.data().img as string }))))
      .catch(e => setLoadError(e.message || 'Görseller yüklenemedi.'))
      .finally(() => setLoading(false));
  }, []);

  const handleFiles = async (files: File[]) => {
    setErrors([]);
    const failed: string[] = [];
    // One at a time: keeps memory low and gives each photo a distinct
    // createdAt, which is what fixes the order they appear in.
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress(`Yükleniyor ${i + 1}/${files.length}: ${file.name}`);
      try {
        const img = await compressForGallery(file);
        const ref = await addDoc(collection(db, 'galleryImages'), { img, createdAt: serverTimestamp() });
        setItems(prev => [...prev, { id: ref.id, img }]);
      } catch (e: any) {
        failed.push(`${file.name}: ${e.message || 'yüklenemedi'}`);
      }
    }
    setProgress('');
    setErrors(failed);
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = async (item: GalleryItem) => {
    if (!confirm('Bu görsel galeriden silinsin mi?')) return;
    try {
      await deleteDoc(doc(db, 'galleryImages', item.id));
      setItems(prev => prev.filter(x => x.id !== item.id));
    } catch (e: any) {
      alert(e.message || 'Silinemedi.');
    }
  };

  const uploading = progress !== '';

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Hakkımızda Galerisi</h2>
      </div>

      <div className="admin-home-section">
        <h3 className="admin-home-section-title">Eklenen Görseller</h3>
        <p className="admin-home-section-hint">
          Hakkımızda sayfasındaki galeride mevcut fotoğrafların ardından, buraya eklediğiniz
          görseller eklenme sırasıyla gösterilir. Aynı anda birden fazla görsel seçebilirsiniz.
        </p>

        <div className="admin-home-add-row" style={{ marginBottom: 16 }}>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={e => { const f = Array.from(e.target.files ?? []); if (f.length) handleFiles(f); }}
          />
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Yükleniyor...' : '📁 Görsel Ekle'}
          </button>
          {uploading && <span style={{ fontSize: 13, color: '#666' }}>{progress}</span>}
        </div>

        {errors.length > 0 && (
          <div className="admin-error" style={{ marginBottom: 12 }}>
            {errors.map(m => <p key={m} style={{ margin: 0 }}>{m}</p>)}
          </div>
        )}

        {loading ? (
          <p className="admin-empty">Yükleniyor...</p>
        ) : loadError ? (
          <p className="admin-error">{loadError}</p>
        ) : items.length === 0 ? (
          <p className="admin-empty">Henüz görsel eklenmedi.</p>
        ) : (
          <div className="admin-home-gallery-grid admin-gallery-grid">
            {items.map(item => (
              <div key={item.id} className="admin-home-gallery-item admin-gallery-item">
                <img src={item.img} alt="" />
                <button
                  type="button"
                  className="admin-btn admin-btn-sm admin-btn-danger admin-gallery-delete"
                  onClick={() => remove(item)}
                >
                  Sil
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
