import BrandShowcase from "./BrandShowcase";
import brands from "./brands.ts"
import { useParams } from "react-router-dom";

export default function BrandPage(){
    const {productType,brand} = useParams();
    console.log("Params:", productType, brand);
    
    const brPage = brands.find(item => item.productType === productType && item.brand.includes(brand));
    if (!brPage) {
        return <h1>Product not found</h1>;
    }
    return(
        <>
        <BrandShowcase
            brand = {brPage.brand}
            productName = {brPage.productName}
            productType={brPage.productType}
            productCode={brPage.productCode}
            img={brPage.img}
            />
        </>
    )
}