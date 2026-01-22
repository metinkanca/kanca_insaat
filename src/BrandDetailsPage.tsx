import { Link } from "react-router-dom";

export default function BrandDetailsPage(props: any) {
    if (!props.link) {
        return null;
    }

    return (
        <div className="showcase-container">
            {props.link.map((_: any, index: number) => (
                <Link key={`${props.id}-${index}`} to={`/products/${props.productType}/${props.brand[index]}`} style={{ textDecoration: 'none' }}>
                    <div className="product-card">
                        <img 
                            src={props.img[index]} 
                            alt={props.brand[index]}
                            className="brand-product-img" 
                            style={{ height: '200px', padding: '20px' }}
                        />
                        <div className="brand-product-text" style={{ backgroundColor: '#1a1a1a', padding: '15px' }}>
                            {props.brand[index]}
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}