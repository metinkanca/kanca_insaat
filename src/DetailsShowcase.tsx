

export default function DetailsShowcase(props){
    return(
        <div key={props.id}>
            <div className="details-page" key={props.id}>
            <img className="details-img" src={props.img} key={props.id}></img>
            <div>
                <h1 className="details-product-name" key={props.id}>{props.productName}</h1>
                <h3 className="features">Özellikler</h3>
                <div className="sizes-title">
                    <span>Derinlik(mm)</span>
                    <span>Genişlik(mm)</span>
                    <span>Yükseklik(mm)</span>
                </div>
                <div className="sizes">
                    <span key={props.id}>{props.depth}</span>
                    <span key={props.id}>{props.width}</span>
                    <span key={props.id}>{props.height}</span>
                </div>
        
                <div className="list-wrapper" key={props.id}>
                        {props.listTitle.map((title, index) => (
                            
                            <div className="list-pair">
                                <ul className="listTitle">
                                    <li>{title}</li>
                                </ul>
                                <ul className="listValue">
                                    <li>{props.listValue[index]}</li>
                                </ul>
                            </div>
                        ))}
                    </div>
            </div>
            
            </div>
        </div>
    )}