import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { slugify } from './searchFold.ts';

interface PopularItem {
  id: string;
  productName: string;
  img: string;
  productType: string;
  brand: string;
  productCode: string;
}

const FALLBACK: PopularItem[] = [
  {
    id: 'kaloriferli_pelet_sobasi__Daiwa__DP-30F',
    productName: 'DP-30F',
    img: '/images/brands_page_images/kaloriferli_pelet_sobalari/DP-30.jpg',
    productType: 'kaloriferli_pelet_sobasi',
    brand: 'Daiwa',
    productCode: 'DP-30F',
  },
  {
    id: 'kaloriferli_pelet_sobasi__Daiwa__DP-22F',
    productName: 'DP-22F',
    img: '/images/brands_page_images/kaloriferli_pelet_sobalari/DP-22.jpg',
    productType: 'kaloriferli_pelet_sobasi',
    brand: 'Daiwa',
    productCode: 'DP-22F',
  },
];

export default function PopularProduct() {
  // Start empty so the configured products are the first thing ever shown;
  // FALLBACK only appears when nothing is configured in homeConfig.
  const [items, setItems] = useState<PopularItem[]>([]);

  useEffect(() => {
    getDoc(doc(db, 'homeConfig', 'main'))
      .then(async snap => {
        const ids = snap.exists()
          ? (snap.data().popularProductIds as string[] | undefined)
          : undefined;
        if (!ids || ids.length === 0) { setItems(FALLBACK); return; }
        const results = await Promise.all(ids.map(id => getDoc(doc(db, 'products', id))));
        const loaded: PopularItem[] = results
          .filter(d => d.exists())
          .map(d => {
            const data = d.data()!;
            return {
              id: d.id,
              productName: data.productName || data.productCode || '',
              img: data.img || '',
              productType: data.productType || '',
              brand: data.brand || '',
              productCode: data.productCode || '',
            };
          });
        setItems(loaded.length > 0 ? loaded : FALLBACK);
      })
      .catch(() => setItems(FALLBACK));
  }, []);

  return (
    <div className="popular-list">
      {items.map(item => (
        <Link
          key={item.id}
          to={`/products/${item.productType}/${item.brand}/${item.productCode || slugify(item.productName)}`}
          className="popular-card"
        >
          <div className="popular-card-img">
            {item.img && <img src={item.img} alt={item.productName} />}
          </div>
          <div className="popular-card-info">
            <span className="popular-card-name">{item.productName}</span>
            <span className="popular-card-brand">{item.brand}</span>
          </div>
          <span className="popular-card-arrow">→</span>
        </Link>
      ))}
    </div>
  );
}
