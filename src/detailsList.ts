
const detailsList:{
    id: number;
    productType: string;
    productCode: string[]; 
    productName: string[]; 
    depth: string;
    width: string;
    height: string;
    listTitle: string[];
    listValue: string[];
    logo?: string;
    dealerLink?: string;
    brand: string[];
    img: string[];
}[]
 = [
    //////////////////// ISI POMPALARI ////////////////////

        ///////////////////// Daiwa ///////////////////// 
    {
        id : 0,
        productType: 'isi_pompasi',
        productCode : ["DW-10"],
        productName : ["DW-10 Isı Pompası"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Güç", "Nominal Isıtma(Max)(A7/6°C,W30/35°C)", " ", " ", " ", "Nominal Isıtma(Max)(A7/6°C,W47/55°C)", " ", " ", " ",
        ],
        listValue: ["220-240/1/50 V/Ph/Hz", 
            "Isıtma Kapasitesi 4.20 - 12.20 kW","Güç Girişi 0.86 - 2.88 kW", "Akım Girişi 3.82 - 12.77 A", "COP 4.23 - 5.39 W/W",
            "Isıtma Kapasitesi 3.20 - 11.20 kW","Güç Girişi 1.13 - 3.75 kW", "Akım Girişi 5.01 - 16.60 A", "COP 2.99 - 3.46 W/W"
        ],
        logo: "./images/daiwa_logo.png",
        dealerLink: "https://www.daiwa.com.tr/projects/pelet-kazanlari",
        brand: ['Daiwa'],
        img: ["/images/brands_page_images/isi_pompalari/DW-10-14.jpg"]
    },
    
    {
        id : 0,
        productType: 'isi_pompasi',
        productCode : ["DW-14"],
        productName : ["DW-14 Isı Pompası"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Güç", "Nominal Isıtma(Max)(A7/6°C,W30/35°C)", " ", " ", " ", "Nominal Isıtma(Max)(A7/6°C,W47/55°C)", " ", " ", " ",
        ],
        listValue: ["220-240/1/50 V/Ph/Hz", 
            "Isıtma Kapasitesi 5.30 - 16.50 kW","Güç Girişi 1.15 - 4.15 kW", "Akım Girişi 5.10 - 18.41 A", "COP 3.97 - 5.43 W/W",
            "Isıtma Kapasitesi 4.90 - 15.10 kW","Güç Girişi 1.65 - 5.25 kW", "Akım Girişi 7.32 - 23.30 A", "COP 2.87 - 3.38 W/W"
        ],
        logo: "./images/daiwa_logo.png",
        dealerLink: "https://www.daiwa.com.tr/projects/pelet-kazanlari",
        brand: ['Daiwa'],
        img: ["/images/brands_page_images/isi_pompalari/DW-10-14.jpg"]
    },

    {
        id : 0,
        productType: 'isi_pompasi',
        productCode : ["DW-18"],
        productName : ["DW-18 Isı Pompası"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Güç", "Nominal Isıtma(Max)(A7/6°C,W30/35°C)", " ", " ", " ", "Nominal Isıtma(Max)(A7/6°C,W47/55°C)", " ", " ", " ",
        ],
        listValue: ["220-240/1/50 V/Ph/Hz", 
            "Isıtma Kapasitesi 6.20 - 20.50 kW","Güç Girişi 1.36 - 5.28 kW", "Akım Girişi 6.10 - 23.67 A", "COP 3.88 - 5.21 W/W",
            "Isıtma Kapasitesi 6.30 - 19.90 kW","Güç Girişi 1.65 - 6.82 kW", "Akım Girişi 7.40 - 30.56 A", "COP 2.91 - 3.34 W/W"
        ],
        logo: "./images/daiwa_logo.png",
        dealerLink: "https://www.daiwa.com.tr/projects/pelet-kazanlari",
        brand: ['Daiwa'],
        img: ["/images/brands_page_images/isi_pompalari/DW-18-24.jpg"]
    },

    {
        id : 0,
        productType: 'isi_pompasi',
        productCode : ["DW-24"],
        productName : ["DW-24 Isı Pompası"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Güç", "Nominal Isıtma(Max)(A7/6°C,W30/35°C)", " ", " ", " ", "Nominal Isıtma(Max)(A7/6°C,W47/55°C)", " ", " ", " ",
        ],
        listValue: ["380-415/3/50 V/Ph/Hz", 
            "Isıtma Kapasitesi 6.50 - 26.10 kW","Güç Girişi 1.78 - 6.45 kW", "Akım Girişi 2.87 - 10.35 A", "COP 4.04 - 5.43 W/W",
            "Isıtma Kapasitesi 6.90 - 26.10 kW","Güç Girişi 1.95 - 8.55 kW", "Akım Girişi 3.15 - 13.80 A", "COP 3.05 - 3.42 W/W"
        ],
        logo: "./images/daiwa_logo.png",
        dealerLink: "https://www.daiwa.com.tr/projects/pelet-kazanlari",
        brand: ['Daiwa'],
        img: ["/images/brands_page_images/isi_pompalari/DW-18-24.jpg"]
    },
     
    //////////////////// PELET KAZANLARI ////////////////////
        ///////////////////// Daiwa ///////////////////// 
        {
            id : 1,
            productType: 'pelet_kazani',
            productCode : ["DP-25"],
            productName : ["DP-25 Kaloriferli Pelet Kazanı"],
            depth: "765",
            width: "565",
            height: "1130",
            listTitle: ["Yakıt Cinsi","Isı Gücü","Kazan Giriş - Çıkışı İnç","İşletme Basıncı","Duman Borusu Çapı","Yüklenebilir Yakıt Miktarı","Isı Verimi","Elektrik",
                "Toplam Ağırlık","Kazan Su Miktarı","Radyatör Miktarı"
            ],
            listValue: ["6 MM Pelet","25 kW","1 - 3/4\"","1-1.5 bar","80 mm","50 Kg","% 92","230V - 50 Hz","204 Kg","45 Lt","7-11m"],
            brand: ['Daiwa'],
            img: ["/images/brands_page_images/pelet_kazanlari/DP-25.jpg"]
        },
        {
            id : 1,
            productType: 'pelet_kazani',
            productCode : ["DP-35"],
            productName : ["DP-35 Kaloriferli Pelet Kazanı"],
            depth: "765",
            width: "565",
            height: "1410",
            listTitle: ["Yakıt Cinsi","Isı Gücü","Kazan Giriş - Çıkışı İnç","İşletme Basıncı","Duman Borusu Çapı","Yüklenebilir Yakıt Miktarı","Isı Verimi","Elektrik",
                "Toplam Ağırlık","Kazan Su Miktarı","Radyatör Miktarı"
            ],
            listValue: ["6 MM Pelet","35 kW","1 - 3/4\"","1-1.5 bar","100 mm","100 Kg","% 92","230V - 50 Hz","215 Kg","45 Lt","10-14m"],
            brand: ['Daiwa'],
            img: ["/images/brands_page_images/pelet_kazanlari/DP-35.jpg"]
        },
        {
        id : 1,
        productType: 'pelet_kazani',
        productCode : ["DP-40"],
        productName : ["DP-40 Kaloriferli Pelet Kazanı"],
        depth: "765",
        width: "565",
        height: "1410",
        listTitle: ["Yakıt Cinsi","Isı Gücü","Kazan Giriş - Çıkışı İnç","İşletme Basıncı","Duman Borusu Çapı","Yüklenebilir Yakıt Miktarı","Isı Verimi","Elektrik",
            "Toplam Ağırlık","Kazan Su Miktarı","Radyatör Miktarı"
        ],
        listValue: ["6 MM Pelet","40 kW","1\"","1-2 bar","100 mm","100 Kg","% 92","230V - 50 Hz","240 Kg","60 Lt","11-16m"],
        brand: ['Daiwa'],
        img: ["/images/brands_page_images/pelet_kazanlari/DP-40.jpg"]
    },
    {
        id : 1,
        productType: 'pelet_kazani',
        productCode : ["DP-60"],
        productName : ["DP-60 Kaloriferli Pelet Kazanı"],
        depth: "890",
        width: "680",
        height: "1600",
        listTitle: ["Yakıt Cinsi","Isı Gücü","Kazan Giriş - Çıkışı İnç","İşletme Basıncı","Duman Borusu Çapı","Yüklenebilir Yakıt Miktarı","Isı Verimi","Elektrik",
            "Toplam Ağırlık","Kazan Su Miktarı","Radyatör Miktarı"
        ],
        listValue: ["6 MM Pelet","60 kW","1 - 3/4\"","1-2 bar","100 mm","120 Kg","% 92","230V - 50 Hz","315 Kg","80 Lt","16-22m"],
        brand: ['Daiwa'],
        img: ["/images/brands_page_images/pelet_kazanlari/DP-60.jpg"]
    },

    //////////////////// KALORİFERLİ PELET SOBALARI ////////////////////
        ///////////////////// Daiwa ///////////////////// 
    {
        id : 2,
        productType: 'kaloriferli_pelet_sobasi',
        productCode : ["DP-16"],
        productName : ["DP-16 Kaloriferli Pelet Sobası"],
        depth: "550",
        width: "490",
        height: "1130",
        listTitle: ["Yakıt Cinsi","Isı Gücü","Kazan Giriş - Çıkışı İnç","İşletme Basıncı","Duman Borusu Çapı","Yüklenebilir Yakıt Miktarı","Isı Verimi","Elektrik",
            "Toplam Ağırlık","Kazan Su Miktarı","Radyatör Miktarı"
        ],
        listValue: ["6 MM Pelet","16 KW","1-3/4\"","1-1,5 bar","80 mm","20 Kg","% 93,8","230V - 50 Hz","185 Kg","45 Lt","5-7m"],
        brand: ['Daiwa'],
        img: ["/images/brands_page_images/kaloriferli_pelet_sobalari/DP-16.jpg"]
    },

    {
        id : 2,
        productType: 'kaloriferli_pelet_sobasi',
        productCode : ["DP-24"],
        productName : ["DP-24 Kaloriferli Pelet Sobası"],
        depth: "570",
        width: "565",
        height: "1130",
        listTitle: ["Yakıt Cinsi","Isı Gücü","Kazan Giriş - Çıkışı İnç","İşletme Basıncı","Duman Borusu Çapı","Yüklenebilir Yakıt Miktarı","Isı Verimi","Elektrik",
            "Toplam Ağırlık","Kazan Su Miktarı","Radyatör Miktarı"
        ],
        listValue: ["6 MM Pelet","24 KW","1-3/4\"","1-1,5 bar","80 mm","25 Kg","% 92","230V - 50 Hz","192 Kg","45 Lt","7-10m"],
        brand: ['Daiwa'],
        img: ["/images/brands_page_images/kaloriferli_pelet_sobalari/DP-24.jpg"]
    },

    {
        id : 2,
        productType: 'kaloriferli_pelet_sobasi',
        productCode : ["DP-28"],
        productName : ["DP-28 Kaloriferli Pelet & Odun Sobası"],
        depth: "590",
        width: "565",
        height: "1157",
        listTitle: ["Yakıt Cinsi","Isı Gücü","Kazan Giriş - Çıkışı İnç","İşletme Basıncı","Duman Borusu Çapı","Yüklenebilir Yakıt Miktarı","Isı Verimi","Elektrik",
            "Toplam Ağırlık","Kazan Su Miktarı","Radyatör Miktarı"
        ],
        listValue: ["6 MM Pelet","28 kW","1-3/4\"","1-1,5 bar","80 mm","25 Kg","% 90","230V - 50 Hz","210 Kg","45 Lt","9-12m"],
        brand: ['Daiwa'],
        img: ["/images/brands_page_images/kaloriferli_pelet_sobalari/DP-28.jpg"]
    },
    {
        id : 2,
        productType: 'kaloriferli_pelet_sobasi',
        productCode : ["DP-30F"],
        productName : ["DP-30 F Kaloriferli Pelet & Odun Sobası"],
        depth: "540",
        width: "900",
        height: "1140",
        listTitle: ["Yakıt Cinsi","Isı Gücü","Kazan Giriş - Çıkışı İnç","İşletme Basıncı","Duman Borusu Çapı","Yüklenebilir Yakıt Miktarı","Isı Verimi","Elektrik",
            "Toplam Ağırlık","Kazan Su Miktarı","Radyatör Miktarı"
        ],
        listValue: ["6 MM Pelet & Odun","30 KW","1-3/4\"","1-1,5 bar","100 mm","28 Kg / 8 Kg Odun","% 92","230V - 50 Hz","295 Kg","55 Lt","10-13m"],
        brand: ['Daiwa'],
        img: ["/images/brands_page_images/kaloriferli_pelet_sobalari/DP-30.jpg"]
    },

    {
        id : 2,
        productType: 'kaloriferli_pelet_sobasi',
        productCode : ["DP-22F"],
        productName : ["DP-22 F Kaloriferli Pelet & Odun Sobası"],
        depth: "550",
        width: "1000",
        height: "900",
        listTitle: ["Yakıt Cinsi","Isı Gücü","Kazan Giriş - Çıkışı İnç","İşletme Basıncı","Duman Borusu Çapı","Yüklenebilir Yakıt Miktarı","Isı Verimi","Elektrik",
            "Toplam Ağırlık","Kazan Su Miktarı","Radyatör Miktarı"
        ],
        listValue: ["6 MM Pelet","22 KW","1-3/4\"","1-1,5 bar","80 mm","15 Kg","% 92","230V - 50 Hz","200 Kg","21 Lt","6-9m"],
        brand: ['Daiwa'],
        img: ["/images/brands_page_images/kaloriferli_pelet_sobalari/DP-22.jpg"]
    },
    //////////////////// ÜFLEMELİ PELET SOBALARI ////////////////////
        ///////////////////// Daiwa ///////////////////// 
    {
        id : 3,
        productType: 'uflemeli_pelet_sobasi',
        productCode : ["DP-06"],
        productName : ["DP-06 Üflemeli Pelet Sobası"],
        depth: "480",
        width: "460",
        height: "820",
        listTitle: ["Yakıt Cinsi","Isı Gücü","Duman Borusu Çapı","Yüklenebilir Yakıt Miktarı","Isı Verimi","Elektrik",
            "Toplam Ağırlık"
        ],
        listValue: ["6 MM Pelet","8-10 kW", "80 mm", "12 Kg", "230 V - 50 Hz", "% 92", "72 Kg"],
        brand: ['Daiwa'],
        img: ["/images/brands_page_images/uflemeli_pelet_sobalari/DP-06.jpg"]
    },
    
    {
        id : 3,
        productType: 'uflemeli_pelet_sobasi',
        productCode : ["DP-10"],
        productName : ["DP-10 Üflemeli Pelet Sobası"],
        depth: "590",
        width: "560",
        height: "1130",
        listTitle: ["Yakıt Cinsi","Isı Gücü","Duman Borusu Çapı","Yüklenebilir Yakıt Miktarı","Isı Verimi","Elektrik",
            "Toplam Ağırlık"
        ],
        listValue: ["6 MM Pelet","10-18 kW", "80 mm", "23 Kg", "% 92", "230 V - 50 Hz", "150 Kg"],
        brand: ['Daiwa'],
        img: ["/images/brands_page_images/uflemeli_pelet_sobalari/DP-10.jpg"]
    },
    //////////////////// KATI YAKITLI KALORİFER SOBALARI ////////////////////
        ///////////////////// Daiwa ///////////////////// 
    {
        id : 4,
        productType: 'kati_yakitli_kalorifer_sobasi',
        productCode : ["DK-21"],
        productName : ["DK-21 Katı Yakıtlı Kalorifer Sobası"],
        depth: "590",
        width: "550",
        height: "1210",
        listTitle: ["Yakıt Cinsi","Isı Gücü","Kazan Giriş - Çıkışı İnç","İşletme Basıncı","Duman Borusu Çapı","Yüklenebilir Yakıt Miktarı","Isı Verimi","Elektrik",
            "Toplam Ağırlık","Kazan Su Miktarı","Radyatör Miktarı"
        ],
        listValue: ["Odun & Kömür","20000 Kcal/h + 5000 Kcal/h","1\"","1-2 bar","150 mm","15 Kg","% 80","230V - 50 Hz","200 Kg","30 Lt","6-8m"],
        brand: ['Daiwa'],
        img: ["/images/brands_page_images/kati_yakitli_kalorifer_sobalari/DK-21.jpg"]
    },

    {
        id : 4,
        productType: 'kati_yakitli_kalorifer_sobasi',
        productCode : ["DK-22"],
        productName : ["DK-22 Katı Yakıtlı Kalorifer Sobası"],
        depth: "550",
        width: "1000",
        height: "900",
        listTitle: ["Yakıt Cinsi","Isı Gücü","Kazan Giriş - Çıkışı İnç","İşletme Basıncı","Duman Borusu Çapı","Yüklenebilir Yakıt Miktarı","Isı Verimi","Elektrik",
            "Toplam Ağırlık","Kazan Su Miktarı","Radyatör Miktarı"
        ],
        listValue: ["Odun & Kömür","21000 Kcal/h + 5500 Kcal/h","1\"","1-2 bar","150 mm","15 Kg","% 82","230V - 50 Hz","185 Kg","34 Lt","7-10m"],
        brand: ['Daiwa'],
        img: ["/images/brands_page_images/kati_yakitli_kalorifer_sobalari/DK-22.jpg"]
    },
    
    {
        id : 4,
        productType: 'kati_yakitli_kalorifer_sobasi',
        productCode : ["DK-22 Plus"],
        productName : ["DK-22 Plus Katı Yakıtlı Kalorifer Sobası"],
        depth: "680",
        width: "1260",
        height: "900",
        listTitle: ["Yakıt Cinsi","Isı Gücü","Kazan Giriş - Çıkışı İnç","İşletme Basıncı","Duman Borusu Çapı","Yüklenebilir Yakıt Miktarı","Isı Verimi","Elektrik",
            "Toplam Ağırlık","Kazan Su Miktarı","Radyatör Miktarı"
        ],
        listValue: ["Odun & Kömür","25000 Kcal/h + 5500 Kcal/h","1\"","1-2 bar","150 mm","15 - 20 Kg","% 82","230V - 50 Hz","220 Kg","40 Lt","8-11m"],
        brand: ['Daiwa'],
        img: ["/images/brands_page_images/kati_yakitli_kalorifer_sobalari/DK-22PLUS.jpg"]
    },

    {
        id : 4,
        productType: 'kati_yakitli_kalorifer_sobasi',
        productCode : ["DK-25"],
        productName : ["DK-25 Katı Yakıtlı Kalorifer Sobası"],
        depth: "590",
        width: "550",
        height: "1060",
        listTitle: ["Yakıt Cinsi","Isı Gücü","Kazan Giriş - Çıkışı İnç","İşletme Basıncı","Duman Borusu Çapı","Yüklenebilir Yakıt Miktarı","Isı Verimi","Elektrik",
            "Toplam Ağırlık","Kazan Su Miktarı","Radyatör Miktarı"
        ],
        listValue: ["Odun & Kömür","26000 Kcal/h + 4000 Kcal/h","1\"","1-2 bar","150 mm","15 - 20 Kg","% 78","230V - 50 Hz","186 Kg","43 Lt","8-11m"],
        brand: ['Daiwa'],
        img: ["/images/brands_page_images/kati_yakitli_kalorifer_sobalari/DK-25.jpg"]
    },

    {
        id : 4,
        productType: 'kati_yakitli_kalorifer_sobasi',
        productCode : ["DK-29"],
        productName : ["DK-29 Katı Yakıtlı Kalorifer Sobası"],
        depth: "590",
        width: "550",
        height: "1210",
        listTitle: ["Yakıt Cinsi","Isı Gücü","Kazan Giriş - Çıkışı İnç","İşletme Basıncı","Duman Borusu Çapı","Yüklenebilir Yakıt Miktarı","Isı Verimi","Elektrik",
            "Toplam Ağırlık","Kazan Su Miktarı","Radyatör Miktarı"
        ],
        listValue: ["Odun & Kömür","30000 Kcal/h + 4500 Kcal/h","1\"","1-2 bar","150 mm","15 - 20 Kg","% 82","230V - 50 Hz","210 Kg","55 Lt","11-14m"],
        brand: ['Daiwa'],
        img: ["/images/brands_page_images/kati_yakitli_kalorifer_sobalari/DK-29.jpg"]
    },

    {
        id : 4,
        productType: 'kati_yakitli_kalorifer_sobasi',
        productCode : ["DŞ-25"],
        productName : ["DŞ-25 Katı Yakıtlı Kalorifer Sobası"],
        depth: "590",
        width: "550",
        height: "1060",
        listTitle: ["Yakıt Cinsi","Isı Gücü","Kazan Giriş - Çıkışı İnç","İşletme Basıncı","Duman Borusu Çapı","Yüklenebilir Yakıt Miktarı","Isı Verimi","Elektrik",
            "Toplam Ağırlık","Kazan Su Miktarı","Radyatör Miktarı"
        ],
        listValue: ["Odun & Kömür","26000 Kcal/h + 3500 Kcal/h","1\"","1-2 bar","150 mm","15 - 20 Kg","% 70","230V - 50 Hz","178 Kg","60 Lt","8-10m"],
        brand: ['Daiwa'],
        img: ["/images/brands_page_images/kati_yakitli_kalorifer_sobalari/DŞ-25.jpg"]
    },
    //////////////////// KATI YAKITLI KAZANLAR ////////////////////
        ///////////////////// Daiwa ///////////////////// 
    {
        id : 5,
        productType: 'kati_yakitli_kazan',
        productCode : ["DY-30"],
        productName : ["DY-30 Katı Yakıtlı Kazan"],
        depth: "640",
        width: "540",
        height: "1090",
        listTitle: ["Yakıt Cinsi","Isı Gücü","Kazan Giriş - Çıkışı İnç", "Sıcak Su Girişi - Çıkışı İnç", "İşletme Basıncı", "Duman Borusu Çapı", "Yüklenebilir Yakıt Miktarı",
            "Isı Verimi", "Elektrik", "Fan Değeri", "Toplam Ağırlık", "Kazan Su Miktarı", "Radyatör Miktarı"
        ],
        listValue: ["Odun & Kömür", "30.000 kCal/h", "1\"", "1/2\"", "1-2 bar", "150 mm", "20 Kg", "% 85", "230V - 50 Hz", "1900 d/d", "216 Kg", "67 Lt", "10-13m"],
        brand: ['Daiwa'],
        img: ["/images/brands_page_images/kati_yakitli_kazanlar/DY-30.jpg"]
    },

    {
        id : 5,
        productType: 'kati_yakitli_kazan',
        productCode : ["DY-40"],
        productName : ["DY-40 Katı Yakıtlı Kazan"],
        depth: "640",
        width: "540",
        height: "1270",
        listTitle: ["Yakıt Cinsi","Isı Gücü","Kazan Giriş - Çıkışı İnç", "Sıcak Su Girişi - Çıkışı İnç", "İşletme Basıncı", "Duman Borusu Çapı", "Yüklenebilir Yakıt Miktarı",
            "Isı Verimi", "Elektrik", "Fan Değeri", "Toplam Ağırlık", "Kazan Su Miktarı", "Radyatör Miktarı"
        ],
        listValue: ["Odun & Kömür", "40.000 kCal/h", "1\"", "1/2\"", "1-2 bar", "150 mm", "25 Kg", "% 85", "230V - 50 Hz", "1900 d/d", "247 Kg", "84 Lt", "14-16m"],
        brand: ['Daiwa'],
        img: ["/images/brands_page_images/kati_yakitli_kazanlar/DY-40.jpg"]
    },
    //////////////////// KATI YAKITLI SOBALAR ////////////////////
        ///////////////////// Daiwa ///////////////////// 
    {
        id : 6,
        productType: 'kati_yakitli_soba',
        productCode : ["DKS-12"],
        productName : ["DKS-12 Katı Yakıtlı Soba"],
        depth: "490",
        width: "610",
        height: "970",
        listTitle: ["Yakıt Cinsi","Isı Gücü","Duman Borusu Çapı","Toplam Ağırlık",
            "Isıtma Alanı"
        ],
        listValue: ["Odun", "10 kW", "150 mm", "85 Kg", "20 m² - 40 m²"],
        brand: ['Daiwa'],
        img: ["/images/brands_page_images/kati_yakitli_sobalar/DKS-12.jpg"]
    },

    {
        id : 6,
        productType: 'kati_yakitli_soba',
        productCode : ["DKS-15"],
        productName : ["DKS-15 Katı Yakıtlı Soba"],
        depth: "490",
        width: "610",
        height: "1170",
        listTitle: ["Yakıt Cinsi","Isı Gücü","Duman Borusu Çapı","Toplam Ağırlık",
            "Isıtma Alanı"
        ],
        listValue: ["Odun", "12 kW", "150 mm", "100 Kg", "20 m² - 50 m²"],
        brand: ['Daiwa'],
        img: ["/images/brands_page_images/kati_yakitli_sobalar/DKS-15.jpg"]
    },

    {
        id : 6,
        productType: 'kati_yakitli_soba',
        productCode : ["DKS-19"],
        productName : ["DKS-19 Katı Yakıtlı Soba"],
        depth: "590",
        width: "550",
        height: "1300",
        listTitle: ["Yakıt Cinsi","Isı Gücü","Duman Borusu Çapı","Toplam Ağırlık",
            "Isıtma Alanı"
        ],
        listValue: ["Odun", "12 kW", "150 mm", "160 Kg", "20 m² - 50 m²"],
        brand: ['Daiwa'],
        img: ["/images/brands_page_images/kati_yakitli_sobalar/DKS-19.jpg"]
    },

    

    //////////////////// BOYLERLER ////////////////////
    
    ////////////////// Rush ////////////////////
    {
        id : 7,
        productType: 'boyler',
        productCode : ["RSS100"],
        productName : ["RSS100 Boyler"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Hacim", "İç Çap", "Dış Çap", "Yükseklik (± 30mm)", "Anot", "Soğuk Su Girişi", "Drenaj", "Elektrik Rezistans Bağlantısı", "Sıcak Su Çıkışı", "Sirkülasyon Bağlantısı",
             "Termo. ve Sensör Bağlantısı", "Termometre (0 - 120 °C)"
        ],
        listValue: ["100 lt", "380 mm", "480 mm", "1026 mm", "1 ¼ inç"," 1 inç", "1 ¼ inç"," 1 ½ inç","1 inç"," 1/2 inç"," 1/2 inç"," STD/Ø63 mm"],
        brand: ['Rush'],
        img: ["/images/brands_page_images/boylerler/RSS.jpg"]
    },
    
    {
        id : 7,
        productType: 'boyler',
        productCode : ["RSS160"],
        productName : ["RSS160 Boyler"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Hacim", "İç Çap", "Dış Çap", "Yükseklik (± 30mm)", "Anot", "Soğuk Su Girişi", "Drenaj", "Elektrik Rezistans Bağlantısı", "Sıcak Su Çıkışı", "Sirkülasyon Bağlantısı",
             "Termo. ve Sensör Bağlantısı", "Termometre (0 - 120 °C)"
        ],
        listValue: ["160 lt", "480 mm", "580 mm", "1126 mm", "1 ¼ inç"," 1 inç", "1 ¼ inç"," 1 ½ inç","1 inç"," 1/2 inç"," 1/2 inç"," STD/Ø63 mm"],
        brand: ['Rush'],
        img: ["/images/brands_page_images/boylerler/RSS.jpg"]
    },
    
    {
        id : 7,
        productType: 'boyler',
        productCode : ["RSS200"],
        productName : ["RSS200 Boyler"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Hacim", "İç Çap", "Dış Çap", "Yükseklik (± 30mm)", "Anot", "Soğuk Su Girişi", "Drenaj", "Elektrik Rezistans Bağlantısı", "Sıcak Su Çıkışı", "Sirkülasyon Bağlantısı",
             "Termo. ve Sensör Bağlantısı", "Termometre (0 - 120 °C)"
        ],
        listValue: ["200 lt", "480 mm", "580 mm", "1276 mm", "1 ¼ inç"," 1 inç", "1 ¼ inç"," 1 ½ inç","1 inç"," 1/2 inç"," 1/2 inç"," STD/Ø63 mm"],
        brand: ['Rush'],
        img: ["/images/brands_page_images/boylerler/RSS.jpg"]
    },
    
    {
        id : 7,
        productType: 'boyler',
        productCode : ["RSS300"],
        productName : ["RSS300 Boyler"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Hacim", "İç Çap", "Dış Çap", "Yükseklik (± 30mm)", "Anot", "Soğuk Su Girişi", "Drenaj", "Elektrik Rezistans Bağlantısı", "Sıcak Su Çıkışı", "Sirkülasyon Bağlantısı",
             "Termo. ve Sensör Bağlantısı", "Termometre (0 - 120 °C)"
        ],
        listValue: ["300 lt", "480 mm", "580 mm", "1826 mm", "1 ¼ inç"," 1 inç", "1 ¼ inç"," 1 ½ inç","1 inç"," 1/2 inç"," 1/2 inç"," STD/Ø63 mm"],
        brand: ['Rush'],
        img: ["/images/brands_page_images/boylerler/RSS.jpg"]
    },
    
    {
        id : 7,
        productType: 'boyler',
        productCode : ["RSS500"],
        productName : ["RSS500 Boyler"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Hacim", "İç Çap", "Dış Çap", "Yükseklik (± 30mm)", "Anot", "Soğuk Su Girişi", "Drenaj", "Elektrik Rezistans Bağlantısı", "Sıcak Su Çıkışı", "Sirkülasyon Bağlantısı",
             "Termo. ve Sensör Bağlantısı", "Termometre (0 - 120 °C)"
        ],
        listValue: ["500 lt", "640 mm", "740 mm", "1896 mm", "1 ¼ inç"," 1 inç", "1 ¼ inç"," 1 ½ inç","1 inç"," 3/4 inç"," 1/2 inç"," STD/Ø63 mm"],
        brand: ['Rush'],
        img: ["/images/brands_page_images/boylerler/RSS.jpg"]
    },
    
    {
        id : 7,
        productType: 'boyler',
        productCode : ["RSD200"],
        productName : ["RSD200 Boyler"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Hacim", "İç Çap", "Dış Çap", "Yükseklik (± 30mm)", "Anot", "Soğuk Su Girişi", "Drenaj", "Elektrik Rezistans Bağlantısı", "Sıcak Su Çıkışı", "Sirkülasyon Bağlantısı",
             "Termo. ve Sensör Bağlantısı", "Termometre (0 - 120 °C)"
        ],
        listValue: ["200 lt", "480 mm", "580 mm", "1276 mm", "1 ¼ inç"," 1 inç", "1 ¼ inç"," 1 ½ inç","1 inç"," 1/2 inç"," 1/2 inç"," STD/Ø63 mm"],
        brand: ['Rush'],
        img: ["/images/brands_page_images/boylerler/RSD.jpg"]
    },

    {
        id : 7,
        productType: 'boyler',
        productCode : ["RSD300"],
        productName : ["RSD300 Boyler"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Hacim", "İç Çap", "Dış Çap", "Yükseklik (± 30mm)", "Anot", "Soğuk Su Girişi", "Drenaj", "Elektrik Rezistans Bağlantısı", "Sıcak Su Çıkışı", "Sirkülasyon Bağlantısı",
             "Termo. ve Sensör Bağlantısı", "Termometre (0 - 120 °C)"
        ],
        listValue: ["300 lt", "480 mm", "580 mm", "1826 mm", "1 ¼ inç"," 1 inç", "1 ¼ inç"," 1 ½ inç","1 inç"," 1/2 inç"," 1/2 inç"," STD/Ø63 mm"],
        brand: ['Rush'],
        img: ["/images/brands_page_images/boylerler/RSD.jpg"]
    },

    {
        id : 7,
        productType: 'boyler',
        productCode : ["RSD500"],
        productName : ["RSD500 Boyler"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Hacim", "İç Çap", "Dış Çap", "Yükseklik (± 30mm)", "Anot", "Soğuk Su Girişi", "Drenaj", "Elektrik Rezistans Bağlantısı", "Sıcak Su Çıkışı", "Sirkülasyon Bağlantısı",
             "Termo. ve Sensör Bağlantısı", "Termometre (0 - 120 °C)"
        ],
        listValue: ["500 lt", "640 mm", "740 mm", "1896 mm", "1 ¼ inç"," 1 inç", "1 ¼ inç"," 1 ½ inç","1 inç"," 3/4 inç"," 1/2 inç"," STD/Ø63 mm"],
        brand: ['Rush'],
        img: ["/images/brands_page_images/boylerler/RSD.jpg"]
    },

    {
        id : 7,
        productType: 'boyler',
        productCode : ["RSD800"],
        productName : ["RSD800 Boyler"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Hacim", "İç Çap", "Dış Çap", "Yükseklik (± 30mm)", "Anot", "Soğuk Su Girişi", "Drenaj", "Elektrik Rezistans Bağlantısı", "Sıcak Su Çıkışı", "Sirkülasyon Bağlantısı",
             "Termo. ve Sensör Bağlantısı", "Termometre (0 - 120 °C)"
        ],
        listValue: ["800 lt", "850 mm", "1010 mm", "1756 mm", "1 ¼ inç"," 1 ¼ inç", "1 ¼ inç"," 2 inç","1 ¼ inç"," 3/4 inç"," 1/2 inç"," STD/Ø63 mm"],
        brand: ['Rush'],
        img: ["/images/brands_page_images/boylerler/RSD.jpg"]
    },

    {
        id : 7,
        productType: 'boyler',
        productCode : ["RSE100"],
        productName : ["RSE100 Boyler"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Hacim", "İç Çap", "Dış Çap", "Yükseklik (± 30mm)", "Anot", "Soğuk Su Girişi", "Drenaj", "Elektrik Rezistans Bağlantısı", "Sıcak Su Çıkışı", "Sirkülasyon Bağlantısı",
             "Termo. ve Sensör Bağlantısı", "Termometre (0 - 120 °C)"
        ],
        listValue: ["100 lt", "380 mm", "480 mm", "1026 mm", "1 ¼ inç"," 1 inç", "1 ¼ inç"," 1½ inç (STD x2 - OP x4)","1 inç"," 1/4 inç"," 1/2 inç"," STD/Ø63 mm"],
        brand: ['Rush'],
        img: ["/images/brands_page_images/boylerler/RSE.jpg"]
    },

    {
        id : 7,
        productType: 'boyler',
        productCode : ["RSE160"],
        productName : ["RSE160 Boyler"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Hacim", "İç Çap", "Dış Çap", "Yükseklik (± 30mm)", "Anot", "Soğuk Su Girişi", "Drenaj", "Elektrik Rezistans Bağlantısı", "Sıcak Su Çıkışı", "Sirkülasyon Bağlantısı",
             "Termo. ve Sensör Bağlantısı", "Termometre (0 - 120 °C)"
        ],
        listValue: ["160 lt", "480 mm", "580 mm", "1116 mm", "1 ¼ inç"," 1 inç", "1 ¼ inç"," 1½ inç (STD x2 - OP x4)","1 inç"," 1/4 inç"," 1/2 inç"," STD/Ø63 mm"],
        brand: ['Rush'],
        img: ["/images/brands_page_images/boylerler/RSE.jpg"]
    },

    {
        id : 7,
        productType: 'boyler',
        productCode : ["RSE200"],
        productName : ["RSE200 Boyler"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Hacim", "İç Çap", "Dış Çap", "Yükseklik (± 30mm)", "Anot", "Soğuk Su Girişi", "Drenaj", "Elektrik Rezistans Bağlantısı", "Sıcak Su Çıkışı", "Sirkülasyon Bağlantısı",
             "Termo. ve Sensör Bağlantısı", "Termometre (0 - 120 °C)"
        ],
        listValue: ["200 lt", "480 mm", "580 mm", "1276 mm", "1 ¼ inç"," 1 inç", "1 ¼ inç"," 1½ inç (STD x2 - OP x4)","1 inç"," 1/4 inç"," 1/2 inç"," STD/Ø63 mm"],
        brand: ['Rush'],
        img: ["/images/brands_page_images/boylerler/RSE.jpg"]
    },

    {
        id : 7,
        productType: 'boyler',
        productCode : ["RSE300"],
        productName : ["RSE300 Boyler"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Hacim", "İç Çap", "Dış Çap", "Yükseklik (± 30mm)", "Anot", "Soğuk Su Girişi", "Drenaj", "Elektrik Rezistans Bağlantısı", "Sıcak Su Çıkışı", "Sirkülasyon Bağlantısı",
             "Termo. ve Sensör Bağlantısı", "Termometre (0 - 120 °C)"
        ],
        listValue: ["300 lt", "480 mm", "580 mm", "1826 mm", "1 ¼ inç"," 1 inç", "1 ¼ inç"," 1½ inç (STD x2 - OP x4)","1 inç"," 1/4 inç"," 1/2 inç"," STD/Ø63 mm"],
        brand: ['Rush'],
        img: ["/images/brands_page_images/boylerler/RSE.jpg"]
    },

    {
        id : 7,
        productType: 'boyler',
        productCode : ["RSE500"],
        productName : ["RSS500 Boyler"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Hacim", "İç Çap", "Dış Çap", "Yükseklik (± 30mm)", "Anot", "Soğuk Su Girişi", "Drenaj", "Elektrik Rezistans Bağlantısı", "Sıcak Su Çıkışı", "Sirkülasyon Bağlantısı",
             "Termo. ve Sensör Bağlantısı", "Termometre (0 - 120 °C)"
        ],
        listValue: ["500 lt", "640 mm", "740 mm", "1896 mm", "1 ¼ inç"," 1 inç", "1 ¼ inç"," 1½ inç (STD x2 - OP x4)","1 inç"," 3/4 inç"," 1/2 inç"," STD/Ø63 mm"],
        brand: ['Rush'],
        img: ["/images/brands_page_images/boylerler/RSE.jpg"]
    },

    
    //////////////////// TERMOBOYLERLER ////////////////////
        ///////////////////// Baymak ///////////////////// 
    {
        id : 8,
        productType: 'termoboyler',
        productCode : ["SMTK-65"],
        productName : ["SMTK 65 Termoboyler"],
        depth: "470",
        width: "444",
        height: "735",
        listTitle: ["Kapasite", "Isıtma Gücü", "Çalışma Aralığı", "Çalışma Basıncı", "Günlük Elektrik Tüketimi", "Paslanmaya Karşı Koruma",
            "Su Bağlantısı"
        ],
        listValue: ["65 I","2000 W", "35°C - 75°C"," 9 bar", "6510 kWh", "Mg Anot", "1/2\""],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/termoboylerler/SMTK65-100.jpg"]
    },

    {
        id : 8,
        productType: 'termoboyler',
        productCode : ["SMTK-80"],
        productName : ["SMTK 80 Termoboyler"],
        depth: "470",
        width: "444",
        height: "858",
        listTitle: ["Kapasite", "Isıtma Gücü", "Çalışma Aralığı", "Çalışma Basıncı", "Günlük Elektrik Tüketimi", "Paslanmaya Karşı Koruma",
            "Su Bağlantısı"
        ],
        listValue: ["80 I","2000 W", "35°C - 75°C"," 9 bar", "6540 kWh", "Mg Anot", "1/2\""],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/termoboylerler/SMTK65-100.jpg"]
    },


    {
        id : 8,
        productType: 'termoboyler',
        productCode : ["SMTK-100"],
        productName : ["SMTK 100 Termoboyler"],
        depth: "470",
        width: "444",
        height: "1025",
        listTitle: ["Kapasite", "Isıtma Gücü", "Çalışma Aralığı", "Çalışma Basıncı", "Günlük Elektrik Tüketimi", "Paslanmaya Karşı Koruma",
            "Su Bağlantısı"
        ],
        listValue: ["100 I","2000 W", "35°C - 75°C"," 9 bar", "6620 kWh", "Mg Anot", "1/2\""],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/termoboylerler/SMTK65-100.jpg"]
    },


    //////////////////// BUFFER TANKLARI ////////////////////
        ///////////////////// Baymak ///////////////////// 
    
        ///////////////////// Rush ///////////////////// 
    {
        id : 9,
        productType: 'buffer_tanki',
        productCode : ["RSB100"],
        productName : ["RSB100 Buffer Tankı"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Hacim", "İç Çap", "Dış Çap", "Yükseklik (± 30mm)", "Hava Tahliye", "Soğuk Su Giriş - Çıkış Bağlantısı", "Drenaj", "Sıcak Su Giriş - Çıkış Bağlantısı",
             "Termo. ve Sensör Bağlantısı", "Termometre (0 - 120 °C)"
        ],
        listValue: ["100 lt", "380 mm", "480 mm", "1026 mm", "1/2 inç"," 1 inç", "1 ¼ inç","1 inç","1/2 inç","OP / Ø63 mm"],
        brand: ['Rush'],
        img: ["/images/brands_page_images/buffer_tanklari/RSB.jpg"]
    },

    {
        id : 9,
        productType: 'buffer_tanki',
        productCode : ["RSB160"],
        productName : ["RSB160 Buffer Tankı"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Hacim", "İç Çap", "Dış Çap", "Yükseklik (± 30mm)", "Hava Tahliye", "Soğuk Su Giriş - Çıkış Bağlantısı", "Drenaj", "Sıcak Su Giriş - Çıkış Bağlantısı",
             "Termo. ve Sensör Bağlantısı", "Termometre (0 - 120 °C)"
        ],
        listValue: ["160 lt", "480 mm", "580 mm", "1116 mm", "1/2 inç"," 1 inç", "1 ¼ inç","1 inç","1/2 inç","OP / Ø63 mm"],
        brand: ['Rush'],
        img: ["/images/brands_page_images/buffer_tanklari/RSB.jpg"]
    },

    {
        id : 9,
        productType: 'buffer_tanki',
        productCode : ["RSB200"],
        productName : ["RSB200 Buffer Tankı"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Hacim", "İç Çap", "Dış Çap", "Yükseklik (± 30mm)", "Hava Tahliye", "Soğuk Su Giriş - Çıkış Bağlantısı", "Drenaj", "Sıcak Su Giriş - Çıkış Bağlantısı",
             "Termo. ve Sensör Bağlantısı", "Termometre (0 - 120 °C)"
        ],
        listValue: ["200 lt", "480 mm", "580 mm", "1276 mm", "1/2 inç"," 1 inç", "1 ¼ inç","1 inç","1/2 inç","OP / Ø63 mm"],
        brand: ['Rush'],
        img: ["/images/brands_page_images/buffer_tanklari/RSB.jpg"]
    },

    {
        id : 9,
        productType: 'buffer_tanki',
        productCode : ["RSB300"],
        productName : ["RSB300 Buffer Tankı"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Hacim", "İç Çap", "Dış Çap", "Yükseklik (± 30mm)", "Hava Tahliye", "Soğuk Su Giriş - Çıkış Bağlantısı", "Drenaj", "Sıcak Su Giriş - Çıkış Bağlantısı",
             "Termo. ve Sensör Bağlantısı", "Termometre (0 - 120 °C)"
        ],
        listValue: ["300 lt", "480 mm", "580 mm", "1826 mm", "1/2 inç"," 1 inç", "1 ¼ inç","1 inç","1/2 inç","OP / Ø63 mm"],
        brand: ['Rush'],
        img: ["/images/brands_page_images/buffer_tanklari/RSB.jpg"]
    },

    {
        id : 9,
        productType: 'buffer_tanki',
        productCode : ["RSB500"],
        productName : ["RSB500 Buffer Tankı"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Hacim", "İç Çap", "Dış Çap", "Yükseklik (± 30mm)", "Hava Tahliye", "Soğuk Su Giriş - Çıkış Bağlantısı", "Drenaj", "Sıcak Su Giriş - Çıkış Bağlantısı",
             "Termo. ve Sensör Bağlantısı", "Termometre (0 - 120 °C)"
        ],
        listValue: ["500 lt", "640 mm", "740 mm", "1896 mm", "1/2 inç"," 1 inç", "1 ¼ inç","1 inç","1/2 inç","OP / Ø63 mm"],
        brand: ['Rush'],
        img: ["/images/brands_page_images/buffer_tanklari/RSB.jpg"]
    },
    //////////////////// ELEKTRİKLİ TERMOSİFONLAR ////////////////////
    
    //////////////////// SİRKÜLASYON POMPALARI ////////////////////
    
    //////////////////// KOMBİLER ////////////////////
        ///////////////////// E.C.A ///////////////////// 
    {
        id : 12,
        productType: 'kombi',
        productCode : ["PROTEUS-PREMIX"],
        productName : ["Proteus Premix Kombi"],
        depth: "765",
        width: "565",
        height: "1410",
        listTitle: [""," ", "Kapasite ", " ", " ", " ", "Sistemler", "Baca Tipi", "Eşanjör", "Ekran", "Yakıt Tipi", "Verimlilik"
        ],
        listValue: ["24 kW - 20.640 kcal/h", "28 kW - 24.080 kcal/h", "30 kW - 25.800 kcal/h", "35 kW - 30.100 kcal/h", "42 kW - 36.100 kcal/h", "45 kW - 38.700 kcal/h", "HM, HCH, HST", "Hermetik", "Çift Eşanjörlü", "LCD", "Doğalgaz / LPG", "A"],
        brand: ['E.C.A'],
        img: ["/images/brands_page_images/kombiler/proteus.jpg"]
    },

    {
        id : 12,
        productType: 'kombi',
        productCode : ["CALORA-PREMIX"],
        productName : ["Calora Premix Kombi"],
        depth: "765",
        width: "565",
        height: "1410",
        listTitle: ["Kapasite","Sistemler", "Baca Tipi", "Eşanjör", "Ekran", "Yakıt Tipi", "Verimlilik"
        ],
        listValue: ["24 kW - 20.640 kcal/h", "HM", "Hermetik", "Çift Eşanjörlü", "LCD", "Doğalgaz / LPG", "A"],
        brand: ['E.C.A'],
        img: ["/images/brands_page_images/kombiler/calora.jpg"]
    },

    {
        id : 12,
        productType: 'kombi',
        productCode : ["CITIUS-PREMIX"],
        productName : ["Citius Premix Kombi"],
        depth: "765",
        width: "565",
        height: "1410",
        listTitle: ["Kapasite","Sistemler", "Baca Tipi", "Eşanjör", "Ekran", "Yakıt Tipi", "Verimlilik"
        ],
        listValue: ["24/28 kW - 20.640/24.075 kcal/h", "HM", "Hermetik", "Çift Eşanjörlü", "LCD", "Doğalgaz", "A"],
        brand: ['E.C.A'],
        img: ["/images/brands_page_images/kombiler/citius.jpg"]
    },
    
        ///////////////////// Termoteknik ///////////////////// 
    {
        id : 12,
        productType: 'kombi',
        productCode : ["LOTUS-20"],
        productName : ["Lotus 20 Kombi"],
        depth: "285",
        width: "412",
        height: "650",
        listTitle: ["Maksimum Isıl Yük", "Pmax, Maksimum Isıl Güç (50/30)","Pmin, Minimum Isıl Güç (50/30)","Enerji Sınıfları (ErP Lot1, EN15502)",
            "Sıcaklık Ayarı","Ses Seviyesi"
        ],
        listValue: ["20,7 kW", "21,9 kW", "8,5 kW", "A/A", "30-80 °C","46 dB"],
        brand: ['Termoteknik'],
        img: ["/images/brands_page_images/kombiler/lotus.jpg"]
    },   
    
    {
        id : 12,
        productType: 'kombi',
        productCode : ["LOTUS-26"],
        productName : ["Lotus 26 Kombi"],
        depth: "285",
        width: "412",
        height: "650",
        listTitle: ["Maksimum Isıl Yük", "Pmax, Maksimum Isıl Güç (50/30)","Pmin, Minimum Isıl Güç (50/30)","Enerji Sınıfları (ErP Lot1, EN15502)",
            "Sıcaklık Ayarı","Ses Seviyesi"
        ],
        listValue: ["25,1 kW", "26,6 kW", "8,5 kW", "A/A", "30-80 °C","46 dB"],
        brand: ['Termoteknik'],
        img: ["/images/brands_page_images/kombiler/lotus.jpg"]
    },   

    {
        id : 12,
        productType: 'kombi',
        productCode : ["LOTUS-36"],
        productName : ["Lotus 36 Kombi"],
        depth: "285",
        width: "412",
        height: "650",
        listTitle: ["Maksimum Isıl Yük", "Pmax, Maksimum Isıl Güç (50/30)","Pmin, Minimum Isıl Güç (50/30)","Enerji Sınıfları (ErP Lot1, EN15502)",
            "Sıcaklık Ayarı","Ses Seviyesi"
        ],
        listValue: ["33,8 kW", "35,9 kW", "8,5 kW", "A/A", "30-80 °C","46 dB"],
        brand: ['Termoteknik'],
        img: ["/images/brands_page_images/kombiler/lotus.jpg"]
    },   

    {
        id : 12,
        productType: 'kombi',
        productCode : ["LOTUS-42"],
        productName : ["Lotus 42 Kombi"],
        depth: "285",
        width: "412",
        height: "650",
        listTitle: ["Maksimum Isıl Yük", "Pmax, Maksimum Isıl Güç (50/30)","Pmin, Minimum Isıl Güç (50/30)","Enerji Sınıfları (ErP Lot1, EN15502)",
            "Sıcaklık Ayarı","Ses Seviyesi"
        ],
        listValue: ["41,1 kW", "43,6 kW", "8,5 kW", "A/A", "30-80 °C","52 dB"],
        brand: ['Termoteknik'],
        img: ["/images/brands_page_images/kombiler/lotus.jpg"]
    },
    
    {
        id : 12,
        productType: 'kombi',
        productCode : ["LOGIC2-26"],
        productName : ["Logic2 c26/35 Kombi"],
        depth: "278",
        width: "395",
        height: "700",
        listTitle: ["Isıtma İçin Kapasite (80/60)", "Isıtma İçin Kapasite (50/30)", "Sıcak Su İçin Kapasite", "Isıtma Min. Gaz Tüketimi", "Isıtma Max. Gaz Tüketimi",
            "Mevsimsel Alan Isıtma Verimliliği Sınıfı", "Kalorifer Suyu Sıcaklığı Min. / Max.", "Kullanım Suyu Sıcaklığı Min. / Max."
        ],
        listValue: ["24,2 kW", "25,6 kW", "35,3 kW", "0,7 m³/h", "2,5 m³/h", "A", "30/80 °C", "40/65 °C" ],
        brand: ['Termoteknik'],
        img: ["/images/brands_page_images/kombiler/logic2.jpg"]
    },   
    
    {
        id : 12,
        productType: 'kombi',
        productCode : ["LOGIC2-31"],
        productName : ["Logic2 c31/35 Kombi"],
        depth: "278",
        width: "395",
        height: "700",
        listTitle: ["Isıtma İçin Kapasite (80/60)", "Isıtma İçin Kapasite (50/30)", "Sıcak Su İçin Kapasite", "Isıtma Min. Gaz Tüketimi", "Isıtma Max. Gaz Tüketimi",
            "Mevsimsel Alan Isıtma Verimliliği Sınıfı", "Kalorifer Suyu Sıcaklığı Min. / Max.", "Kullanım Suyu Sıcaklığı Min. / Max."
        ],
        listValue: ["30,3 kW", "31 kW", "35,3 kW", "0,7 m³/h", "3,1 m³/h", "A", "30/80 °C", "40/65 °C" ],
        brand: ['Termoteknik'],
        img: ["/images/brands_page_images/kombiler/logic2.jpg"]
    }, 
        ///////////////////// Demirdöküm ///////////////////// 
    {
        id : 12,
        productType: 'kombi',
        productCode : ["ADEMIX-P24"],
        productName : ["Ademix P 24 kW Kombi"],
        depth: "270",
        width: "400",
        height: "626",
        listTitle: ["Anma Isı Gücü", "Isıtma mevsimsel verimlilik sınıfı", "Isıtma mevsimsel verimliliği (ƞs)", "Maksimum Isı Gücü (50 - 30°C) (P4)",
            "Minimum Isı Gücü (50 - 30°C)", "Net Ağırlık", "NOx Sınıfı", "Yıllık Elektrik Tüketimi"
        ],
        listValue: ["18 kW","A","%92","20 kW","6,6 kW","25,6 Kg","6","46 kWh"],
        brand: ['Demirdöküm'],
        img: ["/images/brands_page_images/kombiler/ademix.jpg"]
    },   

    {
        id : 12,
        productType: 'kombi',
        productCode : ["ADEMIX-P28"],
        productName : ["Ademix P 28 kW Kombi"],
        depth: "270",
        width: "400",
        height: "626",
        listTitle: ["Anma Isı Gücü", "Isıtma mevsimsel verimlilik sınıfı", "Isıtma mevsimsel verimliliği (ƞs)", "Maksimum Isı Gücü (50 - 30°C) (P4)",
            "Minimum Isı Gücü (50 - 30°C)", "Net Ağırlık", "NOx Sınıfı", "Yıllık Elektrik Tüketimi"
        ],
        listValue: ["24 kW","A","%93","25,9 kW","7,7 kW","26,5 Kg","6","43 kWh"],
        brand: ['Demirdöküm'],
        img: ["/images/brands_page_images/kombiler/ademix.jpg"]
    },   

    {
        id : 12,
        productType: 'kombi',
        productCode : ["VINTOMIX-P24"],
        productName : ["Vintomix P 24 kW Kombi"],
        depth: "270",
        width: "400",
        height: "626",
        listTitle: ["Anma Isı Gücü", "Isıtma mevsimsel verimlilik sınıfı", "Isıtma mevsimsel verimliliği (ƞs)", "Maksimum Isı Gücü (80 - 60°C) (P4)",
            "Minimum Isı Gücü (80 - 60°C)", "Net Ağırlık", "NOx Sınıfı", "Yıllık Elektrik Tüketimi"
        ],
        listValue: ["18 kW","A","%92","18,3 kW","6 kW","25,6 Kg","6","46 kWh"],
        brand: ['Demirdöküm'],
        img: ["/images/brands_page_images/kombiler/vintomix.jpg"]
    },   

    {
        id : 12,
        productType: 'kombi',
        productCode : ["VINTOMIX-P28"],
        productName : ["Vintomix P 28 kW Kombi"],
        depth: "270",
        width: "400",
        height: "626",
        listTitle: ["Anma Isı Gücü", "Isıtma mevsimsel verimlilik sınıfı", "Isıtma mevsimsel verimliliği (ƞs)", "Maksimum Isı Gücü (50 - 30°C) (P4)",
            "Minimum Isı Gücü (50 - 30°C)", "Net Ağırlık", "NOx Sınıfı", "Yıllık Elektrik Tüketimi"
        ],
        listValue: ["24 kW","A","%93","23,9 kW","6,9 kW","26,5 Kg","6","43 kWh"],
        brand: ['Demirdöküm'],
        img: ["/images/brands_page_images/kombiler/vintomix.jpg"]
    },   

    //////////////////// HİDROFORLAR ////////////////////

    {
        id : 13,
        productType: 'hidrofor',
        productCode : ["1WZB370"],
        productName : ["1WZB370 Hidrofor"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["P2","HP","Emiş (MT)","Giriş - Çıkış","M3/H","Delivery n 2850 1/min","0.00","0.50",
            "1.00","1.54","2.00","3.00"
        ],
        listValue: ["","0.5","8","1\" - 1\"","H/m","","36","26","18","10","2",""],
        brand: ['Kentaş'],
        img: ["/images/products_page_images/kentas_hidrofor.png"]
    },
    
    {
        id : 13,
        productType: 'hidrofor',
        productCode : ["1WZB750"],
        productName : ["1WZB750 Hidrofor"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["P2","HP","Emiş (MT)","Giriş - Çıkış","M3/H","Delivery n 2850 1/min","0.00","0.50",
            "1.00","1.54","2.00","3.00"
        ],
        listValue: ["","0.5","8","1\" - 1\"","H/m","","50","38","31.2","23","16","3.4"],
        brand: ['Kentaş'],
        img: ["/images/products_page_images/kentas_hidrofor.png"]
    },   
    //////////////// KORUYUCU MALZEMELER ////////////////
    {
        id : 14,
        productType: 'koruyucu_malzeme',
        productCode : ["MCZERO"],
        productName : ["MCZero Anti-Freeze"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Konsantrasyon","%25", "%30", "%35", "%40"
        ],
        listValue: ["Koruma","-11°C","-15°C","-18°C","-22°C"],
        brand: ['Adey'],
        img: ["/images/brands_page_images/koruyucu_malzemeler/mczero.jpg"]
    },
    {
        id : 14,
        productType: 'koruyucu_malzeme',
        productCode : ["MCZEROPLUS"],
        productName : ["MCZero+ Anti-Freeze"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Konsantrasyon","%10", "%15", "%20", "%25", "%30", "%35", "%40"
        ],
        listValue: ["Koruma","-3°C","-5°C","-6°C","-9°C","-12°C","-15°C","-18°C"],
        brand: ['Adey'],
        img: ["/images/brands_page_images/koruyucu_malzemeler/mczeroplus.jpg"]
    },

    {
        id : 14,
        productType: 'koruyucu_malzeme',
        productCode : ["PROFESSIONAL2XP"],
        productName : ["MagnaClean Professional2XP"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Maksimum Çalışma Sıcaklığı", "Minimum Montaj Yüksekliği", "Maksimum Çalışma Basıncı", "Maksimum Akış Hızı"
        ],
        listValue: ["95°C", "310 mm", "6 bar", "80 l/dk"],
        brand: ['Adey'],
        img: ["/images/brands_page_images/koruyucu_malzemeler/professional2xp.jpg"]
    },   
];
export default detailsList;