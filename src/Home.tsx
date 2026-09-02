import { Link } from 'react-router-dom';
import { MdLocationOn } from "react-icons/md";
import Images from "./Images";
import PopularProduct from "./PopularProduct";
import HomeShowcase from "./HomeShowcase";

export default function Home() {
  return (
    <div>
      {/* Category / product showcase — tiles chosen in the admin panel */}
      <HomeShowcase />

      {/* Hero */}
      <section className="home-hero">
        <img className="home-hero-img" src="/images/kanca_insaat.jpg" alt="Kanca İnşaat" />
      </section>

      {/* Products section */}
      <section className="home-products">
        <div className="home-products-inner">
          <div className="home-products-grid">
            <div className="home-card home-slider-wrap">
              <Images />
            </div>
            <div className="home-popular-col">
              <div className="home-section-header">
                <h2 className="home-section-title">Popüler Ürünler</h2>
                <Link to="/products" className="home-see-all">Tümünü Gör →</Link>
              </div>
              <div className="home-card home-popular-wrap">
                <PopularProduct />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map section */}
      <section className="home-map">
        <div className="home-map-inner">
          <p className="home-map-address">
            <MdLocationOn className="home-map-addr-icon" />
            İskender Paşa Mah, Merkez, Devlet Sahil Yolu Cd. 11/A, 61100 Ortahisar/Trabzon
          </p>
          <iframe
            className="home-map-frame"
            width="100%"
            height="400"
            style={{ border: 0 }}
            loading="lazy"
            src="https://maps.google.com/maps?width=100%25&height=600&hl=en&q=Kanca%20%C4%B0n%C5%9Faat%20Trabzon&t=&z=15&ie=UTF8&iwloc=B&output=embed"
          />
        </div>
      </section>
    </div>
  );
}