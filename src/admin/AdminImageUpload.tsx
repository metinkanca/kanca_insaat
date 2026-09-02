import { useRef, useState } from 'react';
import { compressImage } from './imageUtils';

interface Props {
  onUploaded: (url: string) => void;
  label?: string;
  // Accepted from callers; unused while images are stored inline as base64.
  folder?: string;
}

export default function AdminImageUpload({ onUploaded, label = 'Cihazdan Yükle' }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const base64 = await compressImage(file);
      onUploaded(base64);
      if (inputRef.current) inputRef.current.value = '';
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      <button
        type="button"
        className="admin-btn"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? 'Sıkıştırılıyor...' : `📁 ${label}`}
      </button>
    </>
  );
}
