import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import DetailsShowcase from './DetailsShowcase.tsx';
import PageLoader from './PageLoader.tsx';
import { slugify } from './searchFold.ts';
import type { Product } from './types/firestore';

export default function DetailsPage() {
  const { productType, brand, productCode } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productType || !brand || !productCode) return;
    (async () => {
      // Fast path: doc ID follows the type__brand__code convention.
      const id = `${productType}__${brand}__${productCode}`;
      const snap = await getDoc(doc(db, 'products', id));
      if (snap.exists()) {
        setProduct(snap.data() as Product);
        setLoading(false);
        return;
      }
      // Imported products can have sanitized IDs (spaces/'/' replaced),
      // so fall back to matching by fields.
      const q = await getDocs(query(collection(db, 'products'),
        where('productType', '==', productType),
        where('brand', '==', brand),
        where('productCode', '==', productCode),
      ));
      if (!q.empty) {
        setProduct(q.docs[0].data() as Product);
        setLoading(false);
        return;
      }
      // Code-less products are linked by their name slug — match against
      // the brand's products.
      const all = await getDocs(query(collection(db, 'products'),
        where('productType', '==', productType),
        where('brand', '==', brand),
      ));
      const hit = all.docs.find(d => slugify((d.data() as Product).productName || '') === productCode);
      setProduct(hit ? (hit.data() as Product) : null);
      setLoading(false);
    })();
  }, [productType, brand, productCode]);

  if (loading) return <PageLoader />;
  if (!product) return <h1>Ürün bulunamadı.</h1>;

  return (
    <div className="page-enter">
      <DetailsShowcase
        productType={product.productType}
        productCode={product.productCode}
        productName={product.productName}
        depth={product.depth}
        width={product.width}
        height={product.height}
        listTitle={product.listTitle}
        listValue={product.listValue}
        logo={product.logo}
        dealerLink={product.dealerLink}
        brand={product.brand}
        img={product.img}
        price={product.price}
        unit={product.unit}
      />
    </div>
  );
}
