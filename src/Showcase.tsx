export default function Showcase(props) {
    return (
        <>
            <h1>{props.title}</h1>
            {props.link.map((link, index) => (
                <a href={link} key={index}>
                    <span className="brandName">{props.brand[index]}</span>
                </a>
            ))}
        </>
    );
}
