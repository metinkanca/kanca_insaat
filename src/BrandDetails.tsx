import { useParams } from "react-router-dom";
import BrandDetailsPage from "./BrandDetailsPage.tsx";
import products from "./products.ts";
import Breadcrumbs from "./Breadcrumbs.tsx";
export default function BrandDetails(){
  const { productType } = useParams();
  const filteredProducts = products.filter(prod => prod.productType === productType);
  
  const pageTitle = filteredProducts[0].title;
  
  const brands = filteredProducts.map((prod: any) => {
    return (
      <BrandDetailsPage
        key={prod.id}
        id={prod.id}
        img={prod.img}
        title={prod.title}
        link={prod.link}
        brand={prod.brand}
        productType={prod.productType}
        brandImg={prod.brandImg}
      />
    );
  });

  return (
    <>
      <div className="page-title">
        <p className="products-page-title">{pageTitle}</p>
      </div>
      <Breadcrumbs />
      <div className="showcase-container">
        {brands}
      </div>
    </>
  );
}