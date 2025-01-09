
import daiwa from "../images/daiwa_isi_pompasi.webp"
import ImageSlider from "./ImageSlider"
import kombi from "../images/main_page_slider_images/eca_kombi.png"

const images = [kombi,daiwa]

export default function Images(){
    return <div style={{maxWidth: "500px",width: "100%",height: "500px"}}><ImageSlider imageUrls={images}/>
    </div>
}