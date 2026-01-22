import Breadcrumbs from "./Breadcrumbs";


export default function DetailsShowcase(props :any){
    return(
        <div key={props.id}>
            <Breadcrumbs />
            <div className="details-page" key={props.id}>
            <img className="details-img" src={props.img} alt={props.productName}></img>
            <div className="details-info">
                <h1 className="details-product-name" >{props.productName}</h1>
                <h3 className="features">Özellikler</h3>
                {props.depth && props.width && props.height && (
                    <>
                        <div className="sizes-title">
                        <span>Derinlik(mm)</span>
                        <span>Genişlik(mm)</span>
                        <span>Yükseklik(mm)</span>
                        </div>
                        <div className="sizes">
                        <span>{props.depth}</span>
                        <span>{props.width}</span>
                        <span>{props.height}</span>
                        </div>
                    </>
                )}
        
                <div className="list-wrapper" key={props.id}>
                        {props.listTitle.map((title :string, index: number) => (
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