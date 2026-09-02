import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function DealerRegister() {
  const [form, setForm] = useState({
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    if (form.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await setDoc(doc(db, 'dealers', cred.user.uid), {
        companyName: form.companyName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        // Not collected on the signup form for now; admins fill it in from
        // the panel when the account is set up.
        taxNumber: '',
        address: form.address.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      await auth.signOut();
      setSuccess(true);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Bu e-posta adresi zaten kullanımda.');
      } else {
        setError(err.message || 'Kayıt başarısız.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="dealer-auth-wrapper">
        <div className="dealer-auth-card">
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <h2>Başvurunuz Alındı</h2>
          <p style={{ color: '#555', marginBottom: 24 }}>
            Hesabınız yönetici onayına gönderildi. Onaylandıktan sonra giriş yapabileceksiniz.
          </p>
          <Link to="/bayi/giris" className="dealer-btn dealer-btn-primary" style={{ display: 'inline-block', textAlign: 'center' }}>
            Giriş Sayfasına Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dealer-auth-wrapper">
      <div className="dealer-auth-card dealer-auth-card--wide">
        <h1 className="dealer-auth-title">Bayi Başvurusu</h1>
        <p className="dealer-auth-subtitle">Kanca İnşaat Bayi Portalı</p>

        <form onSubmit={handleSubmit} className="dealer-auth-form">
          <div className="dealer-auth-grid">
            <label>
              Firma Adı *
              <input value={form.companyName} onChange={e => set('companyName', e.target.value)} required placeholder="ABC İnşaat Ltd." />
            </label>
            <label>
              E-posta *
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="firma@ornek.com" />
            </label>
            <label>
              Şifre *
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} required placeholder="En az 6 karakter" />
            </label>
            <label>
              Şifre Tekrar *
              <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required placeholder="Şifrenizi tekrar girin" />
            </label>
            <label>
              Telefon *
              <input value={form.phone} onChange={e => set('phone', e.target.value)} required placeholder="0532 000 00 00" />
            </label>
          </div>
          <label>
            Adres
            <textarea
              value={form.address}
              onChange={e => set('address', e.target.value)}
              placeholder="Firma adresi..."
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </label>

          {error && <p className="dealer-auth-error">{error}</p>}
          <button type="submit" className="dealer-btn dealer-btn-primary" disabled={loading}>
            {loading ? 'Başvuru gönderiliyor...' : 'Başvuru Yap'}
          </button>
        </form>

        <p className="dealer-auth-footer">
          Zaten hesabınız var mı? <Link to="/bayi/giris">Giriş Yapın</Link>
        </p>
      </div>
    </div>
  );
}
