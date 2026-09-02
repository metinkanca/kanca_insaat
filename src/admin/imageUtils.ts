const MAX = 800;

// Compresses an image file to a base64 JPEG data URL (max 800px, q0.80).
// Images are stored inline in Firestore docs, so size discipline matters
// (1 MB per-document limit).
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const isImage =
      file.type.startsWith('image/') ||
      /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif)$/i.test(file.name) ||
      file.type === '';
    if (!isImage) { reject(new Error('Lütfen bir resim dosyası seçin.')); return; }
    if (file.size > 5 * 1024 * 1024) { reject(new Error("Dosya 5MB'dan küçük olmalı.")); return; }

    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, MAX / img.width, MAX / img.height);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.80));
      };
      img.onerror = () => reject(new Error('Görsel okunamadı.'));
      img.src = e.target!.result as string;
    };
    reader.onerror = () => reject(new Error('Dosya okunamadı.'));
    reader.readAsDataURL(file);
  });
}
