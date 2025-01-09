import { MdEmail, MdLocalPhone, MdLocationOn } from "react-icons/md";

export default function Footer(){
    return(
        <footer>
        <h3 className="test-footer">Kanca İnşaat</h3>
        <p><MdLocalPhone />+90 462 322 14 48</p>
        <p><MdEmail /></p>
        <p><MdLocationOn />Merkez, İskender Paşa Mah, Devlet Sahil Yolu Cd. 11/A, 61100 Ortahisar/Trabzon, Türkiye</p>
        </footer>
       )
}