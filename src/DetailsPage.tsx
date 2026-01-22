import DetailsShowcase from "./DetailsShowcase.tsx";
import detailsList from "./detailsList.ts"
import { useParams } from "react-router-dom";

export default function DetailsPage(){
    const {productType, brand, productCode} = useParams();
    
    if (!productType || !brand || !productCode) {
        return <h1>Invalid parameters</h1>;
    }
    
    const infoPage = detailsList.find(item => 
        item.productType === productType && 
        item.brand.includes(brand) && 
        item.productCode.includes(productCode)
    );
    
    return(
        <div>
        {infoPage && (
        <DetailsShowcase 
            key={infoPage.id}
            productType={infoPage.productType}
            productCode={infoPage.productCode}
            productName={infoPage.productName}
            depth={infoPage.depth}
            width={infoPage.width}
            height={infoPage.height}
            listTitle={infoPage.listTitle}
            listValue={infoPage.listValue}
            logo={infoPage.logo}
            dealerLink={infoPage.dealerLink}
            brand={infoPage.brand}
            img={infoPage.img[infoPage.brand.indexOf(brand)]}
        />)}
        </div>
    );
}