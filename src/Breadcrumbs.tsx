// Breadcrumbs.tsx
import { Link, useLocation } from "react-router-dom";

export default function Breadcrumbs() {
  const location = useLocation();

  // Don't show breadcrumbs on home page
  if (location.pathname === '/') {
    return null;
  }

  const pathNames: { [key: string]: string } = {
    'products': 'Ürünler',
    'about': 'Hakkımızda',
    'isi_pompasi': 'Isı Pompaları',
    'pelet_kazani': 'Pelet Kazanları',
    'kaloriferli_pelet_sobasi': 'Kaloriferli Pelet Sobaları',
    'uflemeli_pelet_sobasi': 'Üflemeli Pelet Sobaları',
    'kati_yakitli_kalorifer_sobasi': 'Katı Yakıtlı Kalorifer Sobaları',
    'kati_yakitli_kazan' : 'Katı Yakıtlı Kazanları',
    'kati_yakitli_soba' : 'Katı Yakıtlı Sobaları',
    'boyler' : 'Boylerler',
    'termoboyler' : 'Termoboylerler',
    'buffer_tanki' : 'Buffer Tankları',
    'elektrikli_termosifon' : 'Elektrikli Termosifonlar',
    'sirkulasyon_pompasi' : 'Sirkülasyon Pompaları',
    'kombi' : 'Kombiler',
    'hidrofor' : 'Hidroforlar',
    'koruyucu_malzeme' : 'Koruyucu Malzemeler'
  };

  const pathnames = location.pathname.split('/').filter(x => x);
  
  return (
    <nav className="breadcrumbs">
      <Link to="/" className="breadcrumb-link">Ana Sayfa</Link>
      
      {pathnames.map((pathname, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const displayName = pathNames[pathname] || pathname;
        return (
          <span key={index}>
            <span className="breadcrumb-separator"> / </span>
            {isLast ? (
              <span className="breadcrumb-current">{displayName}</span>
            ) : (
              <Link to={routeTo} className="breadcrumb-link">{displayName}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}