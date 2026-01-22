import { Link } from 'react-router-dom'
export default function Header(){
    return(
        <header>
            <div className='header_kanca'>
            <Link to = "/">
            <img className="header_logo"  src="../images/kanca-1.png"></img>
            </Link>
            <Link to = "/">
            <h1 className='header_company' >KANCA</h1>
            </Link>
            </div>
            <div className="dropdown">
            <Link to = "/products">
            <button className="dropbtn">Ürünler</button>
            </Link>
            <Link to = "/about">
            <button className='dropbtn'>Hakkımızda</button>
            </Link></div>
        </header>
    )
}