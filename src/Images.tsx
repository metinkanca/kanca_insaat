

import SingleImageSlider from "./SingleImageSlider"
import kombi from "/images/main_page_slider_images/eca_kombi.png"
import pelet_kazani from "/images/main_page_slider_images/pelet_kazani.png"
import kalorifer_sobasi from "/images/main_page_slider_images/kalorifer_sobasi.png"
import rubini from "/images/main_page_slider_images/kas_rubini_botti.png"
const images = [kombi, pelet_kazani, kalorifer_sobasi, rubini]

export default function Images() {
    return (
        <div style={{ width: "100%", maxWidth: "450px", aspectRatio: "1/1", margin: "0 auto" }}>
            <SingleImageSlider imageUrls={images} />
        </div>
    )
}