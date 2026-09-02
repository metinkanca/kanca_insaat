import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useCart } from './contexts/CartContext';

export default function DetailsShowcase(props: any) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const prodId = props.id || props.productCode || props.productName;
  const price = props.price ?? 0;

  const handleAdd = () => {
    addItem({ id: String(prodId), name: props.productName, image: props.img, price, unit: props.unit }, qty);
    setAdded(true);
    setQty(1);
    window.setTimeout(() => setAdded(false), 2000);
  };

  const hasSizes = props.depth && props.width && props.height;
  const specs = (props.listTitle || [])
    .map((title: string, i: number) => ({ title, value: props.listValue?.[i] }))
    .filter((s: { title: string }) => s.title);
  const hasSpecs = hasSizes || specs.length > 0;

  return (
    <div>
      <div className="details-page">
        <div className="details-image-panel">
          {props.img
            ? <img className="details-img" src={props.img} alt={props.productName} />
            : <div className="img-placeholder details-img-placeholder">Görsel Yok</div>}
        </div>

        <div className="details-info">
          <div className="details-head">
            {props.brand && <span className="details-brand">{props.brand}</span>}
            <h1 className="details-title">{props.productName}</h1>
          </div>

          {hasSpecs && (
            <div className="details-specs">
              <h2 className="details-specs-title">Özellikler</h2>
              {hasSizes && (
                <div className="details-size-row">
                  <div className="details-size-item">
                    <span>Derinlik</span><strong>{props.depth} mm</strong>
                  </div>
                  <div className="details-size-item">
                    <span>Genişlik</span><strong>{props.width} mm</strong>
                  </div>
                  <div className="details-size-item">
                    <span>Yükseklik</span><strong>{props.height} mm</strong>
                  </div>
                </div>
              )}
              {specs.length > 0 && (
                <table className="details-spec-table">
                  <tbody>
                    {specs.map((s: { title: string; value: string }, i: number) => (
                      <tr key={i}>
                        <th>{s.title}</th>
                        <td>{s.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          <div className="details-buy">
            <div className="details-price-box">
              <span className="details-price-label">Fiyat</span>
              <strong className="details-price-value">
                {price > 0 ? `${price.toLocaleString('tr-TR')} ₺` : '—'}
              </strong>
            </div>
            <div className="details-qty" aria-label="Adet seçimi">
              <button
                type="button"
                aria-label="Azalt"
                onClick={() => setQty(q => Math.max(1, q - 1))}
                disabled={qty <= 1}
              >
                <Minus size={16} />
              </button>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={e => setQty(Math.max(1, Number(e.target.value) || 1))}
              />
              <button
                type="button"
                aria-label="Artır"
                onClick={() => setQty(q => q + 1)}
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              className={`details-add-btn${added ? ' is-added' : ''}`}
              onClick={handleAdd}
            >
              {added ? '✓ Sepete eklendi' : 'Sepete Ekle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
