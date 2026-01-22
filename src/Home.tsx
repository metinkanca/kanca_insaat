import { MdLocationOn } from "react-icons/md";
import Images from "./Images";
import PopularProduct from "./PopularProduct";
export default function Home(){
return (
    <>
        <img className="main_image" src="/images/kanca_insaat.jpg"></img>
        <div className="main_page_wrapper">
        <div className="img_product_wrapper">
          <div className="slider">
        <Images />
        </div>
        <div className="popular-tab">
          <h1 className="mini-title">&nbsp;Popüler Ürünler</h1>
          <PopularProduct />
        </div>
        </div>
        <div className="google_maps">
          <span className="location"><MdLocationOn className="location-icon" /> İskender Paşa Mah, Merkez, Devlet Sahil Yolu Cd. 11/A, 61100 Ortahisar/Trabzon, Türkiye</span>
        <iframe className="map" width="100%" height="450" style={{border:0}} loading="lazy" src="https://maps.google.com/maps?width=100%25&amp;height=600&amp;hl=en&amp;q=Kanca%20%C4%B0n%C5%9Faat%20Trabzon&amp;t=&amp;z=15&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"></iframe>
        </div>
        </div>
    </>
  );
}