import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import BrandShowcase from './BrandShowcase';
import PageLoader from './PageLoader.tsx';
import type { BrandGroup } from './types/firestore';

interface ProductSlot { productCode: string; img: string; productName: string; price: number; }

export default function BrandPage() {
  const { productType, brand } = useParams();
  const [group, setGroup] = useState<BrandGroup | null>(null);
  const [products, setProducts] = useState<ProductSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productType || !brand) return;

    // Keep brandGroups for the page title (productName)
    getDocs(query(collection(db, 'brandGroups'),
      where('productType', '==', productType),
      where('brand', '==', brand)
    )).then(snap => {
      if (!snap.empty) setGroup(snap.docs[0].data() as BrandGroup);
    });

    // Use products collection as the authoritative source for individual cards
    getDocs(query(collection(db, 'products'),
      where('productType', '==', productType),
      where('brand', '==', brand)
    )).then(snap => {
      const prods = snap.docs
        .filter(d => d.data().isActive !== false)
        .map(d => ({
          productCode: d.data().productCode as string,
          img: d.data().img as string,
          productName: (d.data().productName as string) || '',
          price: (d.data().price as number) || 0,
        }));
      setProducts(prods);
      setLoading(false);
    });
  }, [productType, brand]);

  if (loading) return <PageLoader />;
  if (!products.length && !group) return <h1>Ürün grubu bulunamadı.</h1>;

  return (
    <div>
      <BrandShowcase
        brand={brand}
        productName={group?.productName ?? ''}
        productType={productType}
        productCode={products.map(p => p.productCode)}
        img={products.map(p => p.img)}
        names={products.map(p => p.productName)}
        price={products.map(p => p.price)}
      />
    </div>
  );
}
