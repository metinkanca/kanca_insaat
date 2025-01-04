import { Link } from 'react-router-dom'
export default function Header(props){
    return(
        <header>
            <Link to = "/">
            <img className="header_logo"  src="../images/kanca.png"></img>
            </Link>
            <div className="dropdown">
            <Link to = "/products">
            <button className="dropbtn">Ürünler</button>
            <button className='dropbtn'>Hakkımızda</button>
            </Link></div>
        </header>
    )
}