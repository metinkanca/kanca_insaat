import { MdEmail, MdLocalPhone, MdLocationOn } from "react-icons/md";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <h3 className="site-footer-title">Kanca İnşaat Ticaret Kollektif Şirketi</h3>
        <ul className="site-footer-list">
          <li>
            <MdLocalPhone className="site-footer-icon" />
            <span>+90 462 322 14 48 &nbsp;&amp;&nbsp; +90 462 323 15 03</span>
          </li>
          <li>
            <MdEmail className="site-footer-icon" />
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=kancainsaattesisat@gmail.com"
              target="_blank"
              rel="noreferrer"
            >
              kancainsaattesisat@gmail.com
            </a>
          </li>
          <li>
            <MdLocationOn className="site-footer-icon" />
            <span>Merkez, İskender Paşa Mah, Devlet Sahil Yolu Cd. 11/A, 61100 Ortahisar/Trabzon, Türkiye</span>
          </li>
        </ul>
      </div>
    </footer>
  );
}
