import { useState } from 'react';
import { Link } from 'react-router-dom'
export default function Showcase(props) {
    const [showElements,setShowElements] = useState(false);
    return (
        <div className="product-tab">
            <div className='full-container'>
                <div className="product-container"
                style={{
                    backgroundImage: `url(${props.img})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}>
                    <h1 className="product-name">{props.title}</h1>
                </div>

                <div className="brand-container">
                    {props.link.map((link, index) => (
                    <div key={props.id} className="brand-wrapper">
                        <Link to ={`/brandpage/${props.productType}/${props.brand[index]}`}>
                            <img className="brand-name" src={props.brandImg[index]}></img>
                        </Link>
                    </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
