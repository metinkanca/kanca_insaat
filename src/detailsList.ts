
const detailsList:{
    id: number;
    productName: string;
    depth: string;
    width: string;
    height: string;
    listTitle: string[];
    listValue: string[];
    logo?: string;
    dealerLink?: string;
    img: string;
}[]
 = [
    {
        id : 0,
        productName : "Isı Pompası",
        depth: "765",
        width: "565",
        height: "1410",
        listTitle: ["Yakıt Cinsi","Isı Gücü","Kazan Giriş - Çıkışı İnç","İşletme Basıncı","Duman Borusu Çapı","Yüklenebilir Yakıt Miktarı","Isı Verimi","Elektrik",
            "Toplam Ağırlık","Kazan Su Miktarı","Radyatör Miktarı"
        ],
        listValue: ["6 MM Pelet","40 KW","1\"","1-2 bar","100 mm","100 Kg","% 92","230V - 50 Hz","240 Kg","60 Lt","11-16m"],
        logo: "./images/daiwa_logo.png",
        dealerLink: "https://www.daiwa.com.tr/projects/pelet-kazanlari",
        img: "../images/products_page_images/baymak_isi_pompasi.jpg"
    },

    {
        id : 1,
        productName : "DP-40 Pelet Kazanı",
        depth: "765",
        width: "565",
        height: "1410",
        listTitle: ["Yakıt Cinsi","Isı Gücü","Kazan Giriş - Çıkışı İnç","İşletme Basıncı","Duman Borusu Çapı","Yüklenebilir Yakıt Miktarı","Isı Verimi","Elektrik",
            "Toplam Ağırlık","Kazan Su Miktarı","Radyatör Miktarı"
        ],
        listValue: ["6 MM Pelet","40 KW","1\"","1-2 bar","100 mm","100 Kg","% 92","230V - 50 Hz","240 Kg","60 Lt","11-16m"],
        img: "../images/products_page_images/daiwa_pelet_kazani.png"
    },

];
export default detailsList;