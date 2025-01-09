import { useState } from "react"
import {ArrowBigLeft, ArrowBigRight, Circle, CircleDot} from "lucide-react"
type DealerSliderProps ={
    dealerUrls: string[]
}
export default function dealerSlider({ dealerUrls }: DealerSliderProps){
    const [dealerIndex,setdealerIndex] = useState(0)

    return (
        <div style={{width: "100%", height: "100%", position: "relative"}}>
        <div style={{width: "100%", height: "100%", display: "flex"}}>
            {dealerUrls.map(url => (
                <img 
                    key = {url} 
                    src={url} 
                    className="dealer-slider-img"
                />
            ))}
        </div>  
    </div>
    )
}