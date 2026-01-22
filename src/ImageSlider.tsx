import { useState, useEffect, useCallback } from "react"

type ImageSliderProps = {
    imageUrls: string[]
}

export default function ImageSlider({ imageUrls }: ImageSliderProps) {
    const [imageIndex, setImageIndex] = useState(0)
    const [showPreview, setShowPreview] = useState(false)
    const [visibleImages, setVisibleImages] = useState(5)

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 480) {
                setVisibleImages(2)
            } else if (window.innerWidth <= 768) {
                setVisibleImages(3)
            } else if (window.innerWidth <= 992) {
                setVisibleImages(4)
            } else {
                setVisibleImages(5)
            }
        }

        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const showNextImage = useCallback(() => {
        setImageIndex(index => {
            if (index === imageUrls.length - 1) return 0
            return index + 1
        })
    }, [imageUrls.length])

    const showPreviousImage = useCallback(() => {
        setImageIndex(index => {
            if (index === 0) return imageUrls.length - 1
            return index - 1
        })
    }, [imageUrls.length])

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                showPreviousImage()
            } else if (e.key === 'ArrowRight') {
                showNextImage()
            } else if (e.key === 'Escape' && showPreview) {
                setShowPreview(false)
            }
        }

        if (showPreview) {
            window.addEventListener('keydown', handleKeyPress)
            return () => window.removeEventListener('keydown', handleKeyPress)
        }
    }, [showPreviousImage, showNextImage, showPreview])

    const startIndex = Math.max(0, Math.min(
        imageIndex - Math.floor(visibleImages / 2),
        imageUrls.length - visibleImages
    ))

    return (
        <>
            <div className="image-slider-container">
                <button 
                    onClick={showPreviousImage} 
                    className="img-slider-button prev"
                    disabled={imageIndex === 0}
                    aria-label="Previous image"
                >
                    ←
                </button>
                <div className="thumbnail-container">
                    <div className="thumbnail-wrapper">
                        {imageUrls
                            .slice(startIndex, startIndex + visibleImages)
                            .map((url, idx) => {
                                const actualIndex = startIndex + idx;
                                return (
                                    <div
                                        key={url}
                                        className={`thumbnail ${actualIndex === imageIndex ? 'active' : ''}`}
                                        onClick={() => {
                                            setImageIndex(actualIndex);
                                            setShowPreview(true);
                                        }}
                                    >
                                        <img
                                            src={url}
                                            alt={`Thumbnail ${actualIndex + 1}`}
                                            className="thumbnail-img"
                                        />
                                    </div>
                                );
                            })}
                    </div>
                </div>
                <button 
                    onClick={showNextImage} 
                    className="img-slider-button next"
                    disabled={imageIndex === imageUrls.length - 1}
                    aria-label="Next image"
                >
                    →
                </button>
            </div>
            
            {showPreview && (
                <div className="image-preview-overlay" onClick={() => setShowPreview(false)}>
                    <div className="image-preview-container" onClick={(e) => e.stopPropagation()}>
                        <button 
                            className="preview-close-button"
                            onClick={() => setShowPreview(false)}
                            aria-label="Close preview"
                        >
                            ×
                        </button>
                        <button 
                            className="preview-nav-button prev"
                            onClick={showPreviousImage}
                            disabled={imageIndex === 0}
                            aria-label="Previous image"
                        >
                            ←
                        </button>
                        <img 
                            src={imageUrls[imageIndex]} 
                            alt={`Preview ${imageIndex + 1}`}
                            className="preview-image"
                            onClick={showNextImage}
                            style={{ cursor: 'pointer' }}
                        />
                        <button 
                            className="preview-nav-button next"
                            onClick={showNextImage}
                            disabled={imageIndex === imageUrls.length - 1}
                            aria-label="Next image"
                        >
                            →
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
