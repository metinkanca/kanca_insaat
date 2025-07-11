

type DealerSliderProps = {
    dealerUrls: string[]
}

export default function DealerSlider({ dealerUrls }: DealerSliderProps) {
    return (
        <div style={{width: "100%", height: "100%", position: "relative"}}>
            <div className="dealer-logos-container">
                {dealerUrls.map(url => (
                    <img 
                        key={url} 
                        src={url} 
                        className="dealer-slider-img"
                    />
                ))}
            </div>  
        </div>
    )
}