
import { Link } from 'react-router-dom'
export default function PopularProduct(){

return(
    <>
    <div className="popular-pages">
        <div className='popular-animation'>
            <Link to={'/detailspage/kaloriferli_pelet_sobasi/Daiwa/DP-30F'}>
            <img width={250} height={300} src="/images/brands_page_images/kaloriferli_pelet_sobalari/DP-30.jpg"></img>
                <p className="popular-name">
                    DP-30F
                </p>
    </Link>
    </div>
        <div className='popular-animation'>
            <Link to={'/detailspage/kaloriferli_pelet_sobasi/Daiwa/DP-22F'}>
            <img width={250} height={300}  src="/images/brands_page_images/kaloriferli_pelet_sobalari/DP-22.jpg"></img>
                <p className="popular-name">
                    DP-22F
                </p>
            </Link>
        </div>
    </div>
    </>
)
}   