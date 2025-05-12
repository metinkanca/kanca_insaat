import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState } from 'react';
import Showcase from './Showcase';
import Header from './Header.tsx';
import Home from './Home.tsx';
import './App.css';
import Products from './ProductPage.tsx';
import About from './About.tsx';
import Footer from './Footer.tsx';
import Dealers from './Dealers.tsx';
import DetailsPage from './DetailsPage.tsx';
import BrandPage from './BrandPage.tsx';
function App() {
  return(
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/about" element={<About />} />
        <Route path="/detailspage" element={<DetailsPage />} />
        <Route path="/detailspage/:productType/:brand/:productCode" element={<DetailsPage />} />
        <Route path='/brandpage/:productType/:brand' element={<BrandPage />} />
      </Routes>
      <div className='end-of-page'>
      <Dealers />
      <Footer />
      </div>
    </Router>
  )


}



export default App;
