import { Routes, Route } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import AdminLayout from './AdminLayout';
import AdminDashboard from './AdminDashboard';
import AdminProducts from './AdminProducts';
import AdminProductForm from './AdminProductForm';
import AdminOrders from './AdminOrders';
import AdminCategories from './AdminCategories';
import AdminBrandGroups from './AdminBrandGroups';
import AdminProductImport from './AdminProductImport';
import AdminPriceUpdate from './AdminPriceUpdate';
import AdminCodeFix from './AdminCodeFix';
import AdminProductOcr from './AdminProductOcr';
import AdminBulkImages from './AdminBulkImages';
import AdminBrandSwap from './AdminBrandSwap';
import AdminProductUnit from './AdminProductUnit';
import AdminHome from './AdminHome';
import AdminDealers from './AdminDealers';
import AdminQuotes from './AdminQuotes';
import AdminLedger from './AdminLedger';
import ProtectedRoute from './ProtectedRoute';
import './admin.css';

// Mounted at /admin/* — only bundled when Vite runs in `admin` mode
// (npm run admin). The deployed public build contains none of this code.
export default function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AdminProductForm />} />
          <Route path="products/:productId/edit" element={<AdminProductForm />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="brands" element={<AdminBrandGroups />} />
          <Route path="products/import" element={<AdminProductImport />} />
          <Route path="products/price-update" element={<AdminPriceUpdate />} />
          <Route path="products/code-fix" element={<AdminCodeFix />} />
          <Route path="products/ocr-import" element={<AdminProductOcr />} />
          <Route path="products/bulk-images" element={<AdminBulkImages />} />
          <Route path="products/brand-swap" element={<AdminBrandSwap />} />
          <Route path="products/unit" element={<AdminProductUnit />} />
          <Route path="home" element={<AdminHome />} />
          <Route path="dealers" element={<AdminDealers />} />
          <Route path="quotes" element={<AdminQuotes />} />
          <Route path="ledger" element={<AdminLedger />} />
        </Route>
      </Route>
    </Routes>
  );
}
