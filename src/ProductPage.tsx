import Showcase from "./Showcase.tsx";
import products from "./products"
import Header from "./Header.js";
export default function Products(){
    
  const elements = products.map((prod) => {
    return (
      <>
      <Showcase
        id={prod.id}
        img={prod.img}
        title={prod.title}
        link={prod.link}
        brand={prod.brand}
      />
      </>
    );
  });
  return (
    <>
    <div className="page-title"><p className="products-page-title">ÜRÜNLER</p></div>
    <div className="showcase-container">
      {elements}
    </div>
    </>
  );
}