import ImageSlider from './ImageSlider';

export default function About(){
    return(
        <>
        <div className="page-title"><p className="products-page-title">HAKKIMIZDA</p></div>
        <div className='about-page'>
        <p>
            Kanca İnşaat olarak, 1991 yılından bu yana Trabzon'da inşaat ve yapı malzemeleri alanında faaliyet gösteriyoruz. Kurulduğumuz günden bu yana, kaliteli ürün anlayışımız ve güvenilir hizmet yaklaşımımızla bölge halkının ve sektörün ihtiyaçlarına çözüm sunmaya devam ediyoruz.
        </p>
        <p>
            İnşaat sektöründeki deneyimimizle, sadece malzeme tedarik eden bir firma olmanın ötesine geçiyor; projelerinize değer katacak ürün ve hizmetleri en doğru şekilde sunmayı amaçlıyoruz. Müşteri memnuniyetini işimizin merkezine koyuyor, her işimizi titizlikle ve özenle yürütüyoruz.
        </p>
        <p>
            Kanca İnşaat, yerel değerlere bağlı bir aile şirketi olarak, Trabzon’un gelişimine katkı sağlamaktan ve uzun soluklu iş birliklerine imza atmaktan gurur duyar. Geçmişten gelen bilgi birikimimizle, bugünü güçlendiriyor; yarının yapılarına sağlam temeller atıyoruz.
        </p>
        </div>
        <div className="gallery-section">
            <h1 className="gallery-title">Galeri</h1>
            <div className="gallery-slider">
                <ImageSlider 
                    imageUrls={
                        Array.from({ length: 39 }, (_, index) => {
                            const imageNumber = index + 1;
                            return `/images/gallery_images/${imageNumber}.jpg`;
                        })
                    } 
                />
            </div>
        </div>
        </>
    )
}