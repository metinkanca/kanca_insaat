export default function Showcase(props) {
    return (
        <div className="product-tab">
            <div className="product-container"
            style={{
                backgroundImage: `url(${props.img})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}>
                <h1 className="product-name">{props.title}</h1>
            </div>
            {props.link.map((link, index) => (
                <a href={link} key={index}>
                    <span className="brand-name">{props.brand[index]}</span>
                </a>
            ))}
        </div>
    );
}
