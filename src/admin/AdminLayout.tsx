import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import {
  collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, updateDoc, writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { AdminNotification } from '../types/firestore';
import type { NoticeContext, NoticeWithId } from './notices';
import { NOTICE_LABELS } from './notices';

// How many notices the panel keeps on screen. Older ones stay in Firestore but
// are not interesting — the point of the page is "what happened lately".
const NOTICE_LIMIT = 60;

export default function AdminLayout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notices, setNotices] = useState<NoticeWithId[]>([]);
  // Ids already on screen, so a Windows/tarayıcı toast only fires for genuinely
  // new arrivals and not for the first snapshot after the panel opens.
  const seen = useRef<Set<string> | null>(null);

  // Desktop notification while the panel is open. In the Electron shell this
  // shows up as a normal Windows toast; in a browser it needs permission,
  // which we ask for once on mount.
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const toast = (notice: NoticeWithId) => {
    try {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      const n = new Notification(notice.title || NOTICE_LABELS[notice.type], {
        body: notice.body.split('\n').slice(0, 3).join('\n'),
        tag: notice.id,
      });
      n.onclick = () => {
        window.focus();
        navigate(notice.link || '/admin/notifications');
      };
    } catch {
      // Notifications are a nicety; never let them break the panel.
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(NOTICE_LIMIT));
    const unsub = onSnapshot(q, snap => {
      const rows: NoticeWithId[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as AdminNotification) }));
      if (seen.current === null) {
        seen.current = new Set(rows.map(r => r.id));
      } else {
        for (const row of rows) {
          if (!seen.current.has(row.id)) {
            seen.current.add(row.id);
            if (!row.read) toast(row);
          }
        }
      }
      setNotices(rows);
    }, err => console.error('Bildirimler okunamadı:', err));
    return unsub;
  }, []);

  const unread = notices.filter(n => !n.read).length;

  const markRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  };

  const markAllRead = async () => {
    const pending = notices.filter(n => !n.read);
    if (pending.length === 0) return;
    const batch = writeBatch(db);
    pending.forEach(n => batch.update(doc(db, 'notifications', n.id), { read: true }));
    await batch.commit();
  };

  const removeNotice = async (id: string) => {
    await deleteDoc(doc(db, 'notifications', id));
  };

  const noticeContext: NoticeContext = { notices, unread, markRead, markAllRead, removeNotice };

  const logout = async () => {
    await signOut(auth);
    navigate('/admin/login');
  };

  const close = () => setOpen(false);

  const link = (to: string, label: string, end?: boolean, badge?: number) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}
    >
      {label}
      {!!badge && <span className="admin-nav-badge">{badge > 99 ? '99+' : badge}</span>}
    </NavLink>
  );

  return (
    <div className="admin-shell">
      {/* Mobile top bar */}
      <div className="admin-topbar">
        <button className="admin-hamburger" onClick={() => setOpen(true)} aria-label="Menüyü aç">
          ☰
          {unread > 0 && <span className="admin-hamburger-dot" />}
        </button>
        <span className="admin-topbar-brand">Kanca İnşaat</span>
        {unread > 0 && (
          <button
            className="admin-topbar-bell"
            onClick={() => navigate('/admin/notifications')}
            aria-label={`${unread} okunmamış bildirim`}
          >
            🔔<span className="admin-nav-badge">{unread > 99 ? '99+' : unread}</span>
          </button>
        )}
      </div>

      {/* Backdrop */}
      {open && <div className="admin-sidebar-backdrop" onClick={close} />}

      <aside className={`admin-sidebar${open ? ' open' : ''}`}>
        <div className="admin-sidebar-header">
          <p className="admin-sidebar-brand">Kanca İnşaat</p>
          <p className="admin-sidebar-label">Admin Panel</p>
        </div>
        <nav className="admin-nav" onClick={close}>
          {link('/admin', 'Genel Bakış', true)}
          {link('/admin/notifications', 'Bildirimler', true, unread)}
          {link('/admin/home', 'Ana Sayfa')}
          {link('/admin/products', 'Ürünler')}
          {link('/admin/orders', 'Siparişler')}
          {link('/admin/categories', 'Kategoriler')}
          {link('/admin/brands', 'Markalar')}
          {link('/admin/products/import', 'Excel İçe Aktar')}
          {link('/admin/products/price-update', 'Fiyat Güncelle')}
          {link('/admin/products/code-fix', 'Kod Düzelt')}
          {link('/admin/products/ocr-import', 'Görsel ile Ürün Ekle')}
          {link('/admin/products/bulk-images', 'Toplu Görsel')}
          {link('/admin/products/brand-swap', 'Marka Değiştir')}
          {link('/admin/products/unit', 'Birim Ayarla')}
          {link('/admin/dealers', 'Bayiler')}
          {link('/admin/quotes', 'Teklifler', true)}
          {link('/admin/quotes/new', 'Teklif Ekle')}
          {link('/admin/ledger', 'Cari Hesaplar')}
        </nav>
        <button className="admin-logout-btn" onClick={logout}>Çıkış Yap</button>
      </aside>

      <main className="admin-main">
        <Outlet context={noticeContext} />
      </main>
    </div>
  );
}
