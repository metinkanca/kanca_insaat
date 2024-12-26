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
            </Link>
            <div className="dropdown-content">
                <a href="#">Test1</a>
                <a href="#">Test2</a>
                <a href="#">Test3</a>
                <a href="#">Test4</a>
                <a href="#">Test5</a>

            </div></div>
        </header>
    )
}