import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    await signOut(auth);
    navigate('/admin/login');
  };

  const close = () => setOpen(false);

  const link = (to: string, label: string, end?: boolean) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}
    >
      {label}
    </NavLink>
  );

  return (
    <div className="admin-shell">
      {/* Mobile top bar */}
      <div className="admin-topbar">
        <button className="admin-hamburger" onClick={() => setOpen(true)} aria-label="Menüyü aç">
          ☰
        </button>
        <span className="admin-topbar-brand">Kanca İnşaat</span>
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
          {link('/admin/quotes', 'Teklifler')}
          {link('/admin/ledger', 'Cari Hesaplar')}
        </nav>
        <button className="admin-logout-btn" onClick={logout}>Çıkış Yap</button>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
