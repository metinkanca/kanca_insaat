import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { slugify } from "./searchFold.ts";

type ViewMode = 'grid' | 'list';

export default function BrandShowcase(props: any){
    const navigate = useNavigate();
    const [view, setView] = useState<ViewMode>(() =>
        localStorage.getItem('publicProductView') === 'list' ? 'list' : 'grid'
    );

    const changeView = (v: ViewMode) => {
        setView(v);
        localStorage.setItem('publicProductView', v);
    };

    const hasPrices = (props.price || []).some((p: number) => p > 0);
    // Code-less products link via their name slug (the import builds their
    // doc IDs the same way, and DetailsPage resolves it).
    const detailLink = (index: number) =>
        `/products/${props.productType}/${props.brand}/${props.productCode[index] || slugify(props.names?.[index] || '')}`;
    const cardLabel = (index: number) =>
        props.names?.[index] || props.productCode[index] || '';

    return(
        <>

            <div className="brand-page-title">
                <p className="products-page-title">{props.brand} {props.productName}</p>
            </div>
            <div className="brand-margin page-enter">
                <div className="public-products-toolbar">
                    <span className="public-result-count">{props.productCode.length} ürün</span>
                    <div className="public-view-toggle">
                        <button
                            className={view === 'grid' ? 'active' : ''}
                            onClick={() => changeView('grid')}
                            title="Kart görünümü"
                            aria-label="Kart görünümü"
                        >▦</button>
                        <button
                            className={view === 'list' ? 'active' : ''}
                            onClick={() => changeView('list')}
                            title="Liste görünümü"
                            aria-label="Liste görünümü"
                        >☰</button>
                    </div>
                </div>
                {view === 'grid' ? (
                    <div className="brand-product-container">
                        {props.productCode.map((_: any, index: number) => (
                            <Link
                                key={index}
                                to={detailLink(index)}
                                className="product-card"
                            >
                                <div className="product-image-container">
                                    {props.img[index]
                                        ? <img
                                            className="brand-product-img"
                                            src={props.img[index]}
                                            alt={cardLabel(index)}
                                          />
                                        : <div className="img-placeholder">Görsel Yok</div>
                                    }
                                </div>
                                <div className="product-title-overlay">
                                    <h3 className="brand-product-text">{cardLabel(index)}</h3>
                                </div>

                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="public-product-table-wrapper">
                        <table className="public-product-table">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>Ürün Adı</th>
                                    {hasPrices && <th className="public-cell-right">Fiyat</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {props.productCode.map((_: any, index: number) => (
                                    <tr key={index} onClick={() => navigate(detailLink(index))}>
                                        <td className="public-cell-thumb">
                                            {props.img[index] && (
                                                <img src={props.img[index]} alt={cardLabel(index)} />
                                            )}
                                        </td>
                                        <td>{cardLabel(index)}</td>
                                        {hasPrices && (
                                            <td className="public-cell-price public-cell-right">
                                                {props.price?.[index] > 0
                                                    ? `${props.price[index].toLocaleString('tr-TR')} ₺`
                                                    : '—'}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    )
}
