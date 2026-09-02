import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function DealerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, 'dealers', cred.user.uid));
      if (!snap.exists()) {
        setError('Bu hesap bir bayi hesabı değil.');
        await auth.signOut();
        return;
      }
      const status = snap.data().status;
      if (status === 'pending') {
        navigate('/bayi', { replace: true });
      } else if (status === 'rejected') {
        navigate('/bayi', { replace: true });
      } else {
        navigate('/bayi', { replace: true });
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('E-posta veya şifre hatalı.');
      } else {
        setError(err.message || 'Giriş başarısız.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dealer-auth-wrapper">
      <div className="dealer-auth-card">
        <h1 className="dealer-auth-title">Bayi Girişi</h1>
        <p className="dealer-auth-subtitle">Kanca İnşaat Bayi Portalı</p>

        <form onSubmit={handleSubmit} className="dealer-auth-form">
          <label>
            E-posta
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="firma@ornek.com"
            />
          </label>
          <label>
            Şifre
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </label>
          {error && <p className="dealer-auth-error">{error}</p>}
          <button type="submit" className="dealer-btn dealer-btn-primary" disabled={loading}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <p className="dealer-auth-footer">
          Hesabınız yok mu? <Link to="/bayi/kayit">Başvuru Yapın</Link>
        </p>
      </div>
    </div>
  );
}
