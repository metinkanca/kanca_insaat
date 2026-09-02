import { Navigate, Outlet } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useDealer } from './DealerContext';

function StatusPage({ icon, title, message, sub }: { icon: string; title: string; message: string; sub?: string }) {
  const { logout } = useDealer();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/bayi/giris'); };
  return (
    <div className="dealer-status-wrapper">
      <div className="dealer-status-card">
        <div className="dealer-status-icon">{icon}</div>
        <h2>{title}</h2>
        <p>{message}</p>
        {sub && <p className="dealer-status-company">{sub}</p>}
        <button className="dealer-btn" onClick={handleLogout}>Çıkış Yap</button>
      </div>
    </div>
  );
}

export default function DealerProtectedRoute() {
  const { dealer, dealerLoading } = useDealer();

  if (dealerLoading) return <div className="dealer-loading"><p>Yükleniyor...</p></div>;
  if (!dealer) return <Navigate to="/bayi/giris" replace />;

  if (dealer.status === 'pending') {
    return (
      <StatusPage
        icon="⏳"
        title="Başvurunuz İnceleniyor"
        message="Hesabınız yönetici onayı bekliyor. Onaylandığında portala erişebileceksiniz."
        sub={dealer.companyName}
      />
    );
  }

  if (dealer.status === 'rejected') {
    return (
      <StatusPage
        icon="✕"
        title="Başvurunuz Reddedildi"
        message="Hesabınız onaylanmadı. Daha fazla bilgi için bizimle iletişime geçin."
      />
    );
  }

  return <Outlet />;
}
