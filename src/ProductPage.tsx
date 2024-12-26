import Showcase from "./Showcase.js";
import products from "./products"
import Header from "./Header.js";
export default function Products(){
    
  const elements = products.map((prod, index) => {
    return (
      <>
      <Showcase
        key={index}
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
   
    <div className="showcase-container">
      {elements}
    </div>
    </>
  );
}