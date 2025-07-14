import { Link } from "react-router-dom";


export default function BrandShowcase(props :any){
    return(
        <>
            <div className="page-title">
                <p className="products-page-title">{props.brand} {props.productName}</p>
            </div>
            <div className="brand-margin">
                <div className="brand-product-container">
                    {props.productCode.map((productCode: any, index: number) => (
                        <Link 
                            key={index} 
                            to={`/detailspage/${props.productType}/${props.brand}/${props.productCode[index]}`} 
                            className="product-card"
                        > 
                            <div className="product-image-container">
                                <img 
                                    className="brand-product-img" 
                                    src={props.img[index]} 
                                    alt={props.productCode[index]} 
                                />
                            </div>
                            <div className="product-title-overlay">
                                <h3 className="brand-product-text">{props.productCode[index]}</h3>
                            </div>
                            
                        </Link>
                    ))}
                </div>
            </div>
        </>
    )
}