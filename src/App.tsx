import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState } from 'react';
import Showcase from './Showcase';
import Header from './Header.tsx';
import Home from './Home.tsx';
import './App.css';
import Products from './ProductPage.tsx';
function App() {
  return(
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
      </Routes>
    </Router>
  )


}



export default App;
