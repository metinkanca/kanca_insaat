import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from './firebase';
import ImageSlider from './ImageSlider';

const STATIC_GALLERY = Array.from({ length: 39 }, (_, index) => `/images/gallery_images/${index + 1}.jpg`);

export default function About(){
    const [extraImages, setExtraImages] = useState<string[]>([]);

    // Photos the admin added from the panel; shown after the static ones. A
    // failed read just leaves the original gallery in place.
    useEffect(() => {
        getDocs(query(collection(db, 'galleryImages'), orderBy('createdAt')))
            .then(snap => setExtraImages(snap.docs.map(d => d.data().img as string).filter(Boolean)))
            .catch(() => {});
    }, []);

    return(
        <>
        <div className="page-title"><p className="products-page-title">HAKKIMIZDA</p></div>
        <article className='about-page'>
        <p>
            Kanca İnşaat olarak, 1991 yılından bu yana Trabzon'da inşaat ve yapı malzemeleri alanında faaliyet gösteriyoruz. Kurulduğumuz günden bu yana, kaliteli ürün anlayışımız ve güvenilir hizmet yaklaşımımızla bölge halkının ve sektörün ihtiyaçlarına çözüm sunmaya devam ediyoruz.
        </p>
        <p>
            İnşaat sektöründeki deneyimimizle, sadece malzeme tedarik eden bir firma olmanın ötesine geçiyor; projelerinize değer katacak ürün ve hizmetleri en doğru şekilde sunmayı amaçlıyoruz. Müşteri memnuniyetini işimizin merkezine koyuyor, her işimizi titizlikle ve özenle yürütüyoruz.
        </p>
        <p>
            Kanca İnşaat, yerel değerlere bağlı bir aile şirketi olarak, Trabzon’un gelişimine katkı sağlamaktan ve uzun soluklu iş birliklerine imza atmaktan gurur duyar. Geçmişten gelen bilgi birikimimizle, bugünü güçlendiriyor; yarının yapılarına sağlam temeller atıyoruz.
        </p>
        </article>
        <div className="gallery-section">
            <h2 className="gallery-title">Galeri</h2>
            <div className="gallery-slider">
                <ImageSlider imageUrls={[...STATIC_GALLERY, ...extraImages]} />
            </div>
        </div>
        </>
    )
}
