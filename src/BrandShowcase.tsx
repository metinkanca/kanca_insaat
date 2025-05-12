import { Link } from "react-router-dom";
import { LuArrowBigLeft } from "react-icons/lu";
export default function BrandShowcase(props){
    return(
        <>
        <div className="page-title">
            <span className="products-page-title">{props.brand} {props.productName}</span>
        </div>

        <div className="brand-product-container">
            {props.productCode.map((productCode,index) => (
                <Link key={index} 
                    to ={`/detailspage/${props.productType}/${props.brand}/${props.productCode[index]}`} 
                    style={{ textDecoration: 'none' }}> 
                        <img className="brand-product-img" src={props.img[index]}></img>
                        <span className="brand-product-text">{props.productCode[index]}</span>
                </Link>
            ))}
        </div>
        </>
    )
}