import { useRef, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from './contexts/CartContext'
import { useDealer } from './dealer/DealerContext'

export default function Header() {
    const { items } = useCart();
    const { dealer, logout } = useDealer();
    const navigate = useNavigate();
    const count = items.reduce((s, i) => s + i.qty, 0);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        setMenuOpen(false);
        await logout();
        navigate('/');
    };

    useEffect(() => {
        if (!menuOpen) return;
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [menuOpen]);

    return (
        <header>
            <div className='header_kanca'>
                <Link to="/">
                    <img className="header_logo" src="/images/kanca-1.png" alt="Kanca İnşaat" />
                </Link>
                <Link to="/" className="header_company_wrap">
                    <h1 className='header_company'>KANCA</h1>
                    <span className='header_company_sub'>İNŞAAT</span>
                </Link>
            </div>
            <div className="dropdown">
                <Link to="/products">
                    <button className="dropbtn">Ürünler</button>
                </Link>
                <Link to="/about">
                    <button className='dropbtn'>Hakkımızda</button>
                </Link>
                <Link to="/cart">
                    <button className='dropbtn cart-nav-btn'>
                        Sepet
                        {count > 0 && (
                            <span key={count} className="cart-nav-badge">{count > 99 ? '99+' : count}</span>
                        )}
                    </button>
                </Link>
                {dealer ? (
                    <div className="dealer-account-menu" ref={menuRef}>
                        <button className="dropbtn dealer-account-btn" onClick={() => setMenuOpen(o => !o)}>
                            {dealer.companyName} ▾
                        </button>
                        {menuOpen && (
                            <div className="dealer-account-dropdown">
                                <Link to="/bayi" className="dealer-account-item" onClick={() => setMenuOpen(false)}>Hesabım</Link>
                                <Link to="/bayi/teklifler" className="dealer-account-item" onClick={() => setMenuOpen(false)}>Tekliflerim</Link>
                                <Link to="/bayi/siparisler" className="dealer-account-item" onClick={() => setMenuOpen(false)}>Siparişlerim</Link>
                                <Link to="/bayi/cari" className="dealer-account-item" onClick={() => setMenuOpen(false)}>Cari Hesap</Link>
                                <button className="dealer-account-item dealer-account-logout" onClick={handleLogout}>Çıkış</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link to="/bayi/giris">
                        <button className='dropbtn'>Bayi Girişi</button>
                    </Link>
                )}
            </div>
        </header>
    )
}
