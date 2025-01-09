import Images from "./Images";

export default function Home(){
return (
    <>
        <img className="main_image" src="./images/kanca_insaat.jpg"></img>
        <div className="main_page_wrapper">
        <Images />
        <div className="google_maps">
        <iframe className="map" width="300" height="300" src="https://maps.google.com/maps?width=520&amp;height=500&amp;hl=en&amp;q=Kanca%20%C4%B0n%C5%9Faat+(Kanca%20%C4%B0n%C5%9Faat)&amp;t=&amp;z=14&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"><a href="https://www.gps.ie/">gps trackers</a></iframe>
        </div>
        </div>
    </>
  );
}