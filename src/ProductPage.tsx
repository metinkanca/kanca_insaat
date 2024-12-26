import Showcase from "./Showcase.js";
import products from "./products"
import Header from "./Header.js";
export default function Products(){
    
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
    <Header />
    <div className="showcase-container">
      {elements}
    </div>
    </>
  );
}