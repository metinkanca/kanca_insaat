

import ImageSlider from "./ImageSlider"
import kombi from "../images/main_page_slider_images/eca_kombi.png"
import pelet_kazani from "../images/main_page_slider_images/pelet_kazani.png"
import kalorifer_sobasi from "../images/main_page_slider_images/kalorifer_sobasi.png"
const images = [kombi,pelet_kazani,kalorifer_sobasi]

export default function Images(){
    return <div style={{maxWidth: "400px",width: "100%",height: "400px",marginRight: "30px"}}><ImageSlider imageUrls={images}/>
    </div>
}