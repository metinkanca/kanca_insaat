import { Link } from 'react-router-dom'

export default function Showcase(props: any) {
    return (
        <>
        <div className="product-tab">
            <Link to ={`/products/${props.productType}`} style={{ textDecoration: 'none' }}>
            <div key={props.id} className='full-container'>
                
                    <div className="product-container"
                    style={{
                        backgroundImage: `url(${props.img[0]})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                    }}>
                        <h1 className="product-name">{props.title}</h1>
                    </div>
                
                {/*<div className="brand-container">
                    {props.link.map((_: any, index: number) => (
                    <div key={props.id} className="brand-wrapper">
                        <Link to ={`/brandpage/${props.productType}/${props.brand[index]}`}>
                            <img className="brand-name" src={props.brandImg[index]}></img>
                        </Link>
                    </div>
                    ))}
                </div>*/}
            </div>
            </Link>
        </div>
        </>
    );
}