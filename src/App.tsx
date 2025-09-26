import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import {useLayoutEffect} from 'react';
import Header from './Header.tsx';
import Home from './Home.tsx';
import './App.css';
import Products from './ProductPage.tsx';
import About from './About.tsx';
import Footer from './Footer.tsx';
import Dealers from './Dealers.tsx';
import DetailsPage from './DetailsPage.tsx';
import BrandPage from './BrandPage.tsx';
import BrandDetails from './BrandDetails.tsx';

const Wrapper = ({ children }: any) => {
  const location = useLocation();
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  return children;
};
function App() {
  return(
    <>
    <div></div>
    <Router>
      <Wrapper>
      <Header />
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/about" element={<About />} />
        <Route path="/detailspage" element={<DetailsPage />} />
        <Route path="/products/:productType" element={<BrandDetails />} />
        <Route path="/products/:productType/:brand/:productCode" element={<DetailsPage />} />
        <Route path='/products/:productType/:brand' element={<BrandPage />} />
      </Routes>
      <div className='end-of-page'>
      <Dealers />
      <Footer />
      </div>
      </Wrapper>
    </Router>
    </>
  )


}



export default App;
