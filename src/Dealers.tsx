import baymak from "/images/baymak_logo.png"
import daiwa from "/images/daiwa_logo.png"
import eca from "/images/eca_logo.png"
import firat from "/images/firat_logo.jpg"
import hursan from "/images/hursan_logo.png"
import kas from "/images/kas_logo.png"
import norm from "/images/norm_logo.png"
import tema from "/images/tema_logo.png"
import trakya from "/images/trakya_logo.png"
import rush from "/images/rush_logo.png"
import kentas from "/images/kentas_logo.png"
import adey from "/images/adey_logo.webp"
import DealerSlider from "./DealerSlider"

const logos = [baymak, daiwa, eca, firat, hursan, kas, norm, tema, trakya, rush, kentas, adey]

export default function Dealers() {
    return (
        <div className="dealers-list">
            <div className="dealers-container">
                <DealerSlider dealerUrls={logos}/>
            </div>
        </div>
    )
}