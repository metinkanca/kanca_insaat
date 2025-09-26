import Breadcrumbs from "./Breadcrumbs.tsx";
import Showcase from "./Showcase.tsx";
import products from "./products.ts"

export default function Products(){
    
  const elements = products.map((prod :any) => {
    return (
      <>
      <Showcase
        id={prod.id}
        img={prod.img}
        title={prod.title}
        link={prod.link}
        brand={prod.brand}
        productType={prod.productType}
        brandImg={prod.brandImg}
      />
      </>
    );
  });
  return (
    <>
    <div className="page-title"><p className="products-page-title">ÜRÜNLER</p></div>
    <Breadcrumbs />
    <div className="showcase-container">
      {elements}
    </div>

    </>
  );
}