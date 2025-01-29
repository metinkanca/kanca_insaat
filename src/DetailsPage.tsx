import DetailsShowcase from "./DetailsShowcase.tsx";
import detailsList from "./detailsList.ts"
import { useParams } from "react-router-dom";
export default function DetailsPage(){
    const {id} = useParams();
    const infoId = parseInt(id,10);
    const infoPage = detailsList.find(item => item.id === infoId);
        return(
            <>
            {infoPage && (
            <DetailsShowcase 
                key={infoPage.id}
                productName={infoPage.productName}
                depth={infoPage.depth}
                width={infoPage.width}
                height={infoPage.height}
                listTitle={infoPage.listTitle}
                listValue={infoPage.listValue}
                logo={infoPage.logo}
                dealerLink={infoPage.dealerLink}
                img={infoPage.img}
            />)}
            </>
        );
    
        
        /*
        <>
        <div className="details-page">
            <img src="./images/products_page_images/daiwa_pelet_kazani.png"></img>
            <div>
                <h1 className="details-product-name">DP-40 Pelet Kazanı</h1>
                <h3 className="features">Özellikler</h3>
                <div className="sizes-title">
                    <span>Derinlik(mm)</span>
                    <span>Genişlik(mm)</span>
                    <span>Yükseklik(mm)</span>
                </div>
                <div className="sizes">
                    <span>765</span>
                    <span>565</span>
                    <span>1410</span>
                </div>
                <img src="daiwa_logo.png"></img>
                <div className="list-wrapper">
                    <ul>
                        <li>Yakıt Cinsi</li>
                        <li>Isı Gücü</li>
                        <li>Kazan Giriş - Çıkışı İnç</li>
                        <li>İşletme Basıncı</li>
                        <li>Duman Borusu Çapı</li>
                        <li>Yüklenebilir Yakıt Miktarı</li>
                        <li>Isı Verimi</li>
                        <li>Elektrik</li>
                        <li>Toplam Ağırlık</li>
                        <li>Kazan Su Miktarı</li>
                        <li>Radyatör Miktarı</li>
                    </ul>
                    <ul>
                        <li>6 MM Pelet</li>
                        <li>40 KW</li>
                        <li>1 "</li>
                        <li>1-2 bar</li>
                        <li>100 mm</li>
                        <li>100 Kg</li>
                        <li>% 92</li>
                        <li>230V - 50 Hz</li>
                        <li>240 Kg</li>
                        <li>60 Lt</li>
                        <li>11-16m</li>
                    </ul>
                </div>
            </div>
            
        </div>
        <div>
      <h1> Ayrıntılar</h1>
      <p> Türkiye‘nin yeni tercihi Çevre dostu (Pelet) yakıt tüketimi.<br></br>
    Elektronik kontrol sistemi.<br></br>
    Otomatik ateşleme .<br></br>
    6 kademeli yanma hızı.<br></br>
    Ayarlanabilir kazan suyu sıcaklığı.<br></br>
    Kapalı devre çalışma.<br></br>
    Radyatör bağlanabilme.<br></br>
    Oda termostat ile kontrol. (Opsiyonel)<br></br>
    Wifi ( Opsiyonel )<br></br>
    Otomatik duman borusu ve yanma potası temizleme<br></br>
    Pelet Çapı 6 mm olmalıdır.<br></br>
    Doğal pelet kullanınız.<br></br>
    Paslanmayı geciktirmek ve daha iyi verim almak 
    için 1/4 oranında antifriz kullanılmalıdır.<br></br>
    Isı kaybına ve iklim şartlarına göre radyatör miktarı 
    değişkenlik gösterebilir. <br></br>
    ELEKTRİK GİTTİĞİNDE SORUN OLMAMASI 
    iÇiN GÜÇ KAYNAĞI KULLANILMALIDIR.</p>
      </div>
      </>*/
    
}