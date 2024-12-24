import { useState } from 'react';
import Showcase from './Showcase';
import products from './products.js';
import Header from './Header.tsx';
import './App.css';

function App() {
  const elements = products.map((prod, index) => {
    return (
      <>
      <Showcase
        key={index}
        title={prod.title}
        link={prod.link}
        brand={prod.brand}
      />
      </>
    );
  });

  return (
    <>
      <Header/>
      <main>
        {<img className="main_image" src="./images/kanca_insaat.jpg"></img>}
        {elements}
      </main>
    </>
  );
}

export default App;
