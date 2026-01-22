import { useState, useEffect } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"

type SingleImageSliderProps = {
    imageUrls: string[]
    autoPlay?: boolean
}

export default function SingleImageSlider({ imageUrls, autoPlay = true }: SingleImageSliderProps) {
    const [imageIndex, setImageIndex] = useState(0)

    useEffect(() => {
        if (!autoPlay) return;
        const interval = setInterval(() => {
            showNextImage();
        }, 5000);
        return () => clearInterval(interval);
    }, [imageIndex, autoPlay]);

    const showNextImage = () => {
        setImageIndex(index => {
            if (index === imageUrls.length - 1) return 0
            return index + 1
        })
    }

    const showPreviousImage = () => {
        setImageIndex(index => {
            if (index === 0) return imageUrls.length - 1
            return index - 1
        })
    }

    // Using translateX for the sliding animation
    const sliderStyle = {
        transform: `translateX(${-100 * imageIndex}%)`,
        transition: 'transform 0.5s ease-in-out',
        width: '100%',
        height: '100%',
        display: 'flex',
    }

    return (
        <div className="single-slider-container">
            <div className="single-slider-window">
                 <div style={sliderStyle}>
                    {imageUrls.map((url, index) => (
                        <div key={index} className="single-slide">
                            <img src={url} alt={`Slide ${index + 1}`} className="single-slide-img" />
                        </div>
                    ))}
                </div>
            </div>
            
            <button onClick={showPreviousImage} className="single-slider-btn prev" aria-label="Previous">
                <ArrowLeft size={24} />
            </button>
            <button onClick={showNextImage} className="single-slider-btn next" aria-label="Next">
                <ArrowRight size={24} />
            </button>
            
            <div className="slider-dots">
                {imageUrls.map((_, index) => (
                    <button 
                        key={index}
                        className={`slider-dot ${index === imageIndex ? 'active' : ''}`}
                        onClick={() => setImageIndex(index)}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    )
}
