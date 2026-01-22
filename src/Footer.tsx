import { MdEmail, MdLocalPhone, MdLocationOn } from "react-icons/md";

export default function Footer(){
    return(
        <footer>
        <h3 className="test-footer">Kanca İnşaat Ticaret Kollektif Şirketi</h3>
        <p><MdLocalPhone /> +90 462 322 14 48 & +90 462 323 15 03</p>
        <span><MdEmail /> </span><a href="https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=kancainsaattesisat@gmail.com" target="_blank">kancainsaattesisat@gmail.com</a>
        <p><MdLocationOn /> Merkez, İskender Paşa Mah, Devlet Sahil Yolu Cd. 11/A, 61100 Ortahisar/Trabzon, Türkiye</p>
        </footer>
       )
}