import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useLayoutEffect, lazy, Suspense } from 'react';
import Header from './Header.tsx';
import Home from './Home.tsx';
import './App.css';
import './dealer/dealer.css';
import Products from './ProductPage.tsx';
import About from './About.tsx';
import Footer from './Footer.tsx';
import Dealers from './Dealers.tsx';
import DetailsPage from './DetailsPage.tsx';
import BrandPage from './BrandPage.tsx';
import CartPage from './pages/CartPage';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import { DealerProvider } from './dealer/DealerContext';
import DealerProtectedRoute from './dealer/DealerProtectedRoute';
import DealerLogin from './dealer/DealerLogin';
import DealerRegister from './dealer/DealerRegister';
import DealerHome from './dealer/DealerHome';
import DealerOrders from './dealer/DealerOrders';
import DealerQuotes from './dealer/DealerQuotes';
import DealerLedger from './dealer/DealerLedger';

// Admin panel is only bundled in local builds (`npm run admin`).
// In the deployed public build __ADMIN__ is false and this entire
// branch — including the dynamic import — is eliminated from the bundle.
const AdminApp = __ADMIN__ ? lazy(() => import('./admin/AdminApp')) : null;

const Wrapper = ({ children }: any) => {
  const location = useLocation();
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);
  return children;
};

const isAdmin = (pathname: string) => pathname.startsWith('/admin');

function PublicLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  if (isAdmin(location.pathname)) return <>{children}</>;
  return (
    <div className="app-layout">
      <Header />
      <main className="app-main">{children}</main>
      <div className="end-of-page">
        <Dealers />
        <Footer />
      </div>
    </div>
  );
}

function App() {
  return (
    <DealerProvider>
      <Router>
        <Wrapper>
          <PublicLayout>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/about" element={<About />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout-success" element={<CheckoutSuccess />} />
              {/* Old category page removed — same URL now opens the products
                  catalog pre-filtered to that category */}
              <Route path="/products/:productType" element={<Products />} />
              <Route path="/products/:productType/:brand/:productCode" element={<DetailsPage />} />
              <Route path="/products/:productType/:brand" element={<BrandPage />} />

              {/* Admin panel — local builds only */}
              {AdminApp && (
                <Route
                  path="/admin/*"
                  element={
                    <Suspense fallback={<div className="admin-loading"><p>Yükleniyor...</p></div>}>
                      <AdminApp />
                    </Suspense>
                  }
                />
              )}

              {/* Dealer portal routes — use the same public layout */}
              <Route path="/bayi/giris" element={<DealerLogin />} />
              <Route path="/bayi/kayit" element={<DealerRegister />} />
              <Route element={<DealerProtectedRoute />}>
                <Route path="/bayi" element={<DealerHome />} />
                {/* /bayi/urunler removed — dealers use the public /products catalog */}
                <Route path="/bayi/siparisler" element={<DealerOrders />} />
                <Route path="/bayi/teklifler" element={<DealerQuotes />} />
                <Route path="/bayi/cari" element={<DealerLedger />} />
              </Route>
            </Routes>
          </PublicLayout>
        </Wrapper>
      </Router>
    </DealerProvider>
  );
}

export default App;
