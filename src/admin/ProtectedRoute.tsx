import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Navigate, Outlet } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

type Status = 'loading' | 'auth' | 'unauth' | 'dealer';

export default function ProtectedRoute() {
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) { setStatus('unauth'); return; }
      try {
        // Only accounts carrying the `admin: true` custom claim may enter.
        // Firestore rules enforce the same claim server-side; this check
        // just keeps non-admins out of the UI.
        const token = await user.getIdTokenResult();
        if (token.claims.admin === true) { setStatus('auth'); return; }
        const snap = await getDoc(doc(db, 'dealers', user.uid));
        setStatus(snap.exists() ? 'dealer' : 'unauth');
      } catch {
        setStatus('unauth');
      }
    });
    return unsub;
  }, []);

  if (status === 'loading') {
    return <div className="admin-loading"><p>Yükleniyor...</p></div>;
  }
  if (status === 'dealer') return <Navigate to="/bayi" replace />;
  return status === 'auth' ? <Outlet /> : <Navigate to="/admin/login" replace />;
}
