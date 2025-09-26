import { Link } from "react-router-dom";

export default function BrandDetailsPage(props: any){
    if (!props.link) {
        return null;
    }

    return (
        <>
            {props.link.map((_: any, index: number) => (
                <div key={`${props.id}-${index}`} className="product-tab">
                    <Link to={`/products/${props.productType}/${props.brand[index]}`}>
                        <div className='full-container'>
                            <div className="product-container"
                                style={{
                                    height: '300px',
                                    width: '300px',
                                    backgroundImage: `url(${props.img[index]})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
                                }}>
                                <h1 className="product-name">{props.brand[index]}</h1>
                            </div>
                        </div>
                    </Link>
                </div>
            ))}
        </>
    );
}