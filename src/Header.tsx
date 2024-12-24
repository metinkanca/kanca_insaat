
export default function Header(props){
    return(
        <header>
            <img className="header_logo"  src="../images/kanca.png"></img>
            
            <div className="dropdown">
            <button className="dropbtn">Ürünler</button>
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