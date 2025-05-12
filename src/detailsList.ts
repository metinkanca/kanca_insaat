
const detailsList:{
    id: number;
    productType: string;// ürünün türü
    productCode: string[]; // son sayfa için ürünün asıl adı dp40 gibi
    productName: string[]; // son sayfada gösterilen başlık adı
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
        ///////////////////// Baymak ///////////////////// 
    {
        id : 0,
        productType: 'isi_pompasi',
        productCode : ["IO-MM80P"],
        productName : ["IO-MM 80P Isı Pompası"],
        depth: "1040",
        width: "410",
        height: "865",
        listTitle: [
            "Isıtma Nominal Kapasitesi",
            "Isıtma Nominal Giriş Gücü",
            "COP",
            "Soğutma Nominal Kapasitesi",
            "Soğutma Nominal Giriş Gücü",
            "EER",
            "Çıkış Suyu Sıc. 35°C",
            "Çıkış Suyu Sıc. 55°C"
        
        ],
        listValue: [
            "8,40 kW",
            "1,66 kW",
            "5,06 kW",
            "8,30 kW",
            "1,71 kW",
            "4,85 kW",
            "A+++",
            "A++"
        ],
        logo: "./images/daiwa_logo.png",
        dealerLink: "https://www.daiwa.com.tr/projects/pelet-kazanlari",
        brand: ['Baymak'],
        img: ['/images/brands_page_images/isi_pompalari/IO-MM.jpg']
    },

    {
        id : 0,
        productType: 'isi_pompasi',
        productCode : ["IO-MM100P"],
        productName : ["IO-MM 100P Isı Pompası"],
        depth: "1040",
        width: "410",
        height: "865",
        listTitle: [
            "Isıtma Nominal Kapasitesi",
            "Isıtma Nominal Giriş Gücü",
            "COP",
            "Soğutma Nominal Kapasitesi",
            "Soğutma Nominal Giriş Gücü",
            "EER",
            "Çıkış Suyu Sıc. 35°C",
            "Çıkış Suyu Sıc. 55°C"
        
        ],
        listValue: [
            "10,00 kW",
            "2,13 kW",
            "4,69 kW",
            "10,00 kW",
            "2,33 kW",
            "4,29 kW",
            "A+++",
            "A++"
        ],
        logo: "./images/daiwa_logo.png",
        dealerLink: "https://www.daiwa.com.tr/projects/pelet-kazanlari",
        brand: ['Baymak'],
        img: ['/images/brands_page_images/isi_pompalari/IO-MM.jpg']
    },
    
    {
        id : 0,
        productType: 'isi_pompasi',
        productCode : ["IO-MM120P"],
        productName : ["IO-MM 120P Isı Pompası"],
        depth: "1040",
        width: "410",
        height: "865",
        listTitle: [
            "Isıtma Nominal Kapasitesi",
            "Isıtma Nominal Giriş Gücü",
            "COP",
            "Soğutma Nominal Kapasitesi",
            "Soğutma Nominal Giriş Gücü",
            "EER",
            "Çıkış Suyu Sıc. 35°C",
            "Çıkış Suyu Sıc. 55°C"
        
        ],
        listValue: [
            "12,20 kW",
            "2,49 kW",
            "4,90 kW",
            "12,20 kW",
            "2,65 kW",
            "4,60 kW",
            "A+++",
            "A++"
        ],
        logo: "./images/daiwa_logo.png",
        dealerLink: "https://www.daiwa.com.tr/projects/pelet-kazanlari",
        brand: ['Baymak'],
        img: ['/images/brands_page_images/isi_pompalari/IO-MM.jpg']
    },

    {
        id : 0,
        productType: 'isi_pompasi',
        productCode : ["IO-MM140P"],
        productName : ["IO-MM 140P Isı Pompası"],
        depth: "1040",
        width: "410",
        height: "865",
        listTitle: [
            "Isıtma Nominal Kapasitesi",
            "Isıtma Nominal Giriş Gücü",
            "COP",
            "Soğutma Nominal Kapasitesi",
            "Soğutma Nominal Giriş Gücü",
            "EER",
            "Çıkış Suyu Sıc. 35°C",
            "Çıkış Suyu Sıc. 55°C"
        
        ],
        listValue: [
            "14,10 kW",
            "3,00 kW",
            "4,70 kW",
            "13,90 kW",
            "3,16 kW",
            "4,40 kW",
            "A+++",
            "A++"
        ],
        logo: "./images/daiwa_logo.png",
        dealerLink: "https://www.daiwa.com.tr/projects/pelet-kazanlari",
        brand: ['Baymak'],
        img: ['/images/brands_page_images/isi_pompalari/IO-MM.jpg']
    },

    {
        id : 0,
        productType: 'isi_pompasi',
        productCode : ["IO-MM160P"],
        productName : ["IO-MM 160P Isı Pompası"],
        depth: "1040",
        width: "410",
        height: "865",
        listTitle: [
            "Isıtma Nominal Kapasitesi",
            "Isıtma Nominal Giriş Gücü",
            "COP",
            "Soğutma Nominal Kapasitesi",
            "Soğutma Nominal Giriş Gücü",
            "EER",
            "Çıkış Suyu Sıc. 35°C",
            "Çıkış Suyu Sıc. 55°C"
        
        ],
        listValue: [
            "16,00 kW",
            "3,56 kW",
            "4,49 kW",
            "15,40 kW",
            "3,67 kW",
            "4,20 kW",
            "A+++",
            "A++"
        ],
        logo: "./images/daiwa_logo.png",
        dealerLink: "https://www.daiwa.com.tr/projects/pelet-kazanlari",
        brand: ['Baymak'],
        img: ['/images/brands_page_images/isi_pompalari/IO-MM.jpg']
    },

    {
        id : 0,
        productType: 'isi_pompasi',
        productCode : ["IO-MT160P"],
        productName : ["IO-MT 160P Isı Pompası"],
        depth: "1040",
        width: "410",
        height: "865",
        listTitle: [
            "Isıtma Nominal Kapasitesi",
            "Isıtma Nominal Giriş Gücü",
            "COP",
            "Soğutma Nominal Kapasitesi",
            "Soğutma Nominal Giriş Gücü",
            "EER",
            "Çıkış Suyu Sıc. 35°C",
            "Çıkış Suyu Sıc. 55°C",
        
        ],
        listValue: [
            "16,00 kW",
            "3,56 kW",
            "4,49 kW",
            "15,40 kW",
            "3,67 kW",
            "4,20 kW",
            "A+++",
            "A++",

        ],
        logo: "./images/daiwa_logo.png",
        dealerLink: "https://www.daiwa.com.tr/projects/pelet-kazanlari",
        brand: ['Baymak'],
        img: ['/images/brands_page_images/isi_pompalari/IO-MM.jpg']
    },

    {
        id : 0,
        productType: 'isi_pompasi',
        productCode : ["IO-MT220P"],
        productName : ["IO-MT 220P Isı Pompası"],
        depth: "528",
        width: "1129",
        height: "1558",
        listTitle: [
            "Isıtma Nominal Kapasitesi",
            "Isıtma Nominal Giriş Gücü",
            "COP",
            "Soğutma Nominal Kapasitesi",
            "Soğutma Nominal Giriş Gücü",
            "EER",
            "Çıkış Suyu Sıc. 35°C",
            "Çıkış Suyu Sıc. 55°C",
            "Kompresör",
            "Genleşme Valfı"
        
        ],
        listValue: [
            "22,00 kW",
            "5,0 kW",
            "4,40 kW",
            "23,0 kW",
            "5,0 kW",
            "4,60 kW",
            "A+++",
            "A++",
        ],
        logo: "./images/daiwa_logo.png",
        dealerLink: "https://www.daiwa.com.tr/projects/pelet-kazanlari",
        brand: ['Baymak'],
        img: ['/images/brands_page_images/isi_pompalari/IO-MT.jpg']
    },

    {
        id : 0,
        productType: 'isi_pompasi',
        productCode : ["IO-MT260P"],
        productName : ["IO-MT 260P Isı Pompası"],
        depth: "528",
        width: "1129",
        height: "1558",
        listTitle: [
            "Isıtma Nominal Kapasitesi",
            "Isıtma Nominal Giriş Gücü",
            "COP",
            "Soğutma Nominal Kapasitesi",
            "Soğutma Nominal Giriş Gücü",
            "EER",
            "Çıkış Suyu Sıc. 35°C",
            "Çıkış Suyu Sıc. 55°C",
            "Kompresör",
            "Genleşme Valfı"
        
        ],
        listValue: [
            "26,00 kW",
            "6,37 kW",
            "4,08 kW",
            "27,0 kW",
            "6,28 kW",
            "4,30 kW",
            "A+++",
            "A++",
            "Twin Rotary DC Inverter",
            "Elektronik Genleşme Valfı"
        ],
        logo: "./images/daiwa_logo.png",
        dealerLink: "https://www.daiwa.com.tr/projects/pelet-kazanlari",
        brand: ['Baymak'],
        img: ['/images/brands_page_images/isi_pompalari/IO-MT.jpg']
    },

    {
        id : 0,
        productType: 'isi_pompasi',
        productCode : ["IO-MT300P"],
        productName : ["IO-MT 300P Isı Pompası"],
        depth: "528",
        width: "1129",
        height: "1558",
        listTitle: [
            "Isıtma Nominal Kapasitesi",
            "Isıtma Nominal Giriş Gücü",
            "COP",
            "Soğutma Nominal Kapasitesi",
            "Soğutma Nominal Giriş Gücü",
            "EER",
            "Çıkış Suyu Sıc. 35°C",
            "Çıkış Suyu Sıc. 55°C",
            "Kompresör",
            "Genleşme Valfı"
        
        ],
        listValue: [
            "30,10 kW",
            "8,03 kW",
            "3,76 kW",
            "31,0 kW",
            "7,75 kW",
            "4,0 kW",
            "A+++",
            "A++",
            "Twin Rotary DC Inverter",
            "Elektronik Genleşme Valfı"
        ],
        logo: "./images/daiwa_logo.png",
        dealerLink: "https://www.daiwa.com.tr/projects/pelet-kazanlari",
        brand: ['Baymak'],
        img: ['/images/brands_page_images/isi_pompalari/IO-MT.jpg']
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
        ///////////////////// Baymak ///////////////////// 
    {
        id : 7,
        productType: 'boyler',
        productCode : ["T80L"],
        productName : ["T80L Boyler"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Yükseklik", "İzolasyon Dahil Çap", "Serpantin Giriş/Çıkış Çapı",
            "Soğuk/Sıcak Su Giriş - Çıkış Çap", "Servis Sirkülasyon Hattı Çapı", "Ağırlık"
        ],
        listValue: ["845 mm","500 mm","1\"","1\"","3/4\"","38 Kg"],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/boylerler/T80-1000L.jpg"]
    },

    {
        id : 7,
        productType: 'boyler',
        productCode : ["T100L"],
        productName : ["T100L Boyler"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Yükseklik", "İzolasyon Dahil Çap", "Serpantin Giriş/Çıkış Çapı",
            "Soğuk/Sıcak Su Giriş - Çıkış Çap", "Servis Sirkülasyon Hattı Çapı", "Ağırlık"
        ],
        listValue: ["1000 mm","500 mm","1\"","1\"","3/4\"","43 Kg"],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/boylerler/T80-1000L.jpg"]
    },

    {
        id : 7,
        productType: 'boyler',
        productCode : ["T120L"],
        productName : ["T120L Boyler"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Yükseklik", "İzolasyon Dahil Çap", "Serpantin Giriş/Çıkış Çapı",
            "Soğuk/Sıcak Su Giriş - Çıkış Çap", "Servis Sirkülasyon Hattı Çapı", "Ağırlık"
        ],
        listValue: ["825 mm","600 mm","1\"","1\"","3/4\"","54 Kg"],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/boylerler/T80-1000L.jpg"]
    },

    {
        id : 7,
        productType: 'boyler',
        productCode : ["T160L"],
        productName : ["T160L Boyler"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Yükseklik", "İzolasyon Dahil Çap", "Elektrikli Isıtıcı Bağ. Manşonu", "Serpantin Giriş/Çıkış Çapı",
            "Soğuk/Sıcak Su Giriş - Çıkış Çap", "Servis Sirkülasyon Hattı Çapı", "Ağırlık"
        ],
        listValue: ["1125 mm","600 mm","11/2\"","1\"","1\"","3/4\"","81 Kg"],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/boylerler/T80-1000L.jpg"]
    },

    {
        id : 7,
        productType: 'boyler',
        productCode : ["T200L"],
        productName : ["T200L Boyler"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Yükseklik", "İzolasyon Dahil Çap", "Elektrikli Isıtıcı Bağ. Manşonu", "Serpantin Giriş/Çıkış Çapı",
            "Soğuk/Sıcak Su Giriş - Çıkış Çap", "Servis Sirkülasyon Hattı Çapı", "Ağırlık"
        ],
        listValue: ["1280 mm","600 mm","11/2\"","1\"","1\"","3/4\"","90 Kg"],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/boylerler/T80-1000L.jpg"]
    },

    {
        id : 7,
        productType: 'boyler',
        productCode : ["T300L"],
        productName : ["T300L Boyler"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Yükseklik", "İzolasyon Dahil Çap", "Elektrikli Isıtıcı Bağ. Manşonu","Temizleme Kapağı", "Serpantin Giriş/Çıkış Çapı",
            "Soğuk/Sıcak Su Giriş - Çıkış Çap", "Servis Sirkülasyon Hattı Çapı", "Ağırlık"
        ],
        listValue: ["1210 mm","740 mm","2\"","DN100","1\"","1\"","3/4\"","110 Kg"],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/boylerler/T80-1000L.jpg"]
    },

    {
        id : 7,
        productType: 'boyler',
        productCode : ["T400L"],
        productName : ["T400L Boyler"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Yükseklik", "İzolasyon Dahil Çap", "Elektrikli Isıtıcı Bağ. Manşonu","Temizleme Kapağı", "Serpantin Giriş/Çıkış Çapı",
            "Soğuk/Sıcak Su Giriş - Çıkış Çap", "Servis Sirkülasyon Hattı Çapı", "Ağırlık"
        ],
        listValue: ["1560 mm","740 mm","2\"","DN100","1\"","1\"","3/4\"","170 Kg"],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/boylerler/T80-1000L.jpg"]
    },

    {
        id : 7,
        productType: 'boyler',
        productCode : ["T500L"],
        productName : ["T500L Boyler"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Yükseklik", "İzolasyon Dahil Çap", "Elektrikli Isıtıcı Bağ. Manşonu","Temizleme Kapağı", "Serpantin Giriş/Çıkış Çapı",
            "Soğuk/Sıcak Su Giriş - Çıkış Çap", "Servis Sirkülasyon Hattı Çapı", "Ağırlık"
        ],
        listValue: ["1860 mm","740 mm","2\"","DN100","1\"","1\"","3/4\"","200 Kg"],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/boylerler/T80-1000L.jpg"]
    },

    {
        id : 7,
        productType: 'boyler',
        productCode : ["T800L"],
        productName : ["T800L Boyler"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Yükseklik", "İzolasyon Dahil Çap", "Elektrikli Isıtıcı Bağ. Manşonu","Temizleme Kapağı", "Serpantin Giriş/Çıkış Çapı",
            "Soğuk/Sıcak Su Giriş - Çıkış Çap", "Servis Sirkülasyon Hattı Çapı", "Ağırlık"
        ],
        listValue: ["1700 mm","1050 mm","2\"","DN100","1\"","1\"","3/4\"","260 Kg"],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/boylerler/T80-1000L.jpg"]
    },

    {
        id : 7,
        productType: 'boyler',
        productCode : ["T1000L"],
        productName : ["T1000L Boyler"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Yükseklik", "İzolasyon Dahil Çap", "Elektrikli Isıtıcı Bağ. Manşonu","Temizleme Kapağı", "Serpantin Giriş/Çıkış Çapı",
            "Soğuk/Sıcak Su Giriş - Çıkış Çap", "Servis Sirkülasyon Hattı Çapı", "Ağırlık"
        ],
        listValue: ["2045 mm","1050 mm","2\"","DN100","1\"","1\"","3/4\"","295 Kg"],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/boylerler/T80-1000L.jpg"]
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
    {
        id : 9,
        productType: 'buffer_tanki',
        productCode : ["AQUA"],
        productName : ["Aqua Buffer Tankı"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Kapasite", "İzolasyon Tipi", "İzolasyon Kalınlığı", "Kapalı Devre Çalışma Basıncı", "Depo Test Basıncı", "Tank Ağırlığı(Ambalajsız)"
        ],
        listValue: ["80-160", "Poliüretan", "50 mm", "10 bar", "13 bar", "38-81 Kg"],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/buffer_tanklari/AQUA.jpg"]
    },

    //////////////////// ELEKTRİKLİ TERMOSİFONLAR ////////////////////
        ///////////////////// Baymak ///////////////////// 
    {
        id : 10,
        productType: 'elektrikli_termosifon',
        productCode : ["MTK-50"],
        productName : ["MTK 50 Elektrikli Termosifon"],
        depth: "470",
        width: "444",
        height: "610",
        listTitle: ["Çalışma Aralığı", "Günlük Elektrik Tüketimi", "Yıllık Elektrik Enerjisi Kullanımı - AEC", "Emniyet Ventili", "Emniyet Termostatı",
            "Sıcaklık Göstergesi", "İzolasyon"
        ],
        listValue: ["35 - 75°", "6,420 kWh", "1381 kWh", "Var", "Var", "Var", "CFC İçermeyen Pollüteran"],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/elektrikli_termosifonlari/MTK50-100.jpg"]
    },
    
    {
        id : 10,
        productType: 'elektrikli_termosifon',
        productCode : ["MTK-65"],
        productName : ["MTK 65 Elektrikli Termosifon"],
        depth: "470",
        width: "444",
        height: "735",
        listTitle: ["Çalışma Aralığı", "Günlük Elektrik Tüketimi", "Yıllık Elektrik Enerjisi Kullanımı - AEC", "Emniyet Ventili", "Emniyet Termostatı",
            "Sıcaklık Göstergesi", "İzolasyon"
        ],
        listValue: ["35 - 75°", "6,510 kWh", "1396 kWh", "Var", "Var", "Var", "CFC İçermeyen Pollüteran"],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/elektrikli_termosifonlari/MTK50-100.jpg"]
    },
    
    {
        id : 10,
        productType: 'elektrikli_termosifon',
        productCode : ["MTK-80"],
        productName : ["MTK 80 Elektrikli Termosifon"],
        depth: "470",
        width: "444",
        height: "858",
        listTitle: ["Çalışma Aralığı", "Günlük Elektrik Tüketimi", "Yıllık Elektrik Enerjisi Kullanımı - AEC", "Emniyet Ventili", "Emniyet Termostatı",
            "Sıcaklık Göstergesi", "İzolasyon"
        ],
        listValue: ["35 - 75°", "6,540 kWh", "1401 kWh", "Var", "Var", "Var", "CFC İçermeyen Pollüteran"],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/elektrikli_termosifonlari/MTK50-100.jpg"]
    },
    
    {
        id : 10,
        productType: 'elektrikli_termosifon',
        productCode : ["MTK-100"],
        productName : ["MTK 100 Elektrikli Termosifon"],
        depth: "470",
        width: "444",
        height: "1025",
        listTitle: ["Çalışma Aralığı", "Günlük Elektrik Tüketimi", "Yıllık Elektrik Enerjisi Kullanımı - AEC", "Emniyet Ventili", "Emniyet Termostatı",
            "Sıcaklık Göstergesi", "İzolasyon"
        ],
        listValue: ["35 - 75°", "6,620 kWh", "1415 kWh", "Var", "Var", "Var", "CFC İçermeyen Pollüteran"],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/elektrikli_termosifonlari/MTK50-100.jpg"]
    },
    
    //////////////////// SİRKÜLASYON POMPALARI ////////////////////
        ///////////////////// Baymak ///////////////////// 
    {
        id : 11,
        productType: 'sirkulasyon_pompasi',
        productCode : ["EVOSTA2-40-70-130"],
        productName : ["EVOSTA2 40-70/130 Sirkülasyon Pompası"],
        depth: "765",
        width: "565",
        height: "1410",
        listTitle: ["Flanşlar Arası Mesafe", "Voltaj 50 Hz", "P1 Max W", "In A" ,"EEI Enerji Verimlilik İndeksi",
            "Hidrolik Değerler","0 m³/h,0 I/min","0,3 m³/h,5 I/min","0,6 m³/h,10 I/min","0,9 m³/h,15 I/min","1,8 m³/h,30 I/min","2,4 m³/h,40 I/min"
            ,"3,0 m³/h,50 I/min","3,6 m³/h,60 I/min"
        ],
        listValue: ["130 mm" ,"230 V", "6 - 35", "0,04 - 0,32", "EEI ≤ 0,18","","6,9 m","6,9 m","5,8 m","5,1 m"
            ,"3,4 m","2,4 m","1,6 m","0,8 m"
        ],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/sirkulasyon_pompalari/EVOSTA2.jpg"]
    },

    {
        id : 11,
        productType: 'sirkulasyon_pompasi',
        productCode : ["EVOSTA2-40-70-180"],
        productName : ["EVOSTA2 40-70/180 Sirkülasyon Pompası"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Flanşlar Arası Mesafe", "Voltaj 50 Hz", "P1 Max W", "In A" ,"EEI Enerji Verimlilik İndeksi",
            "Hidrolik Değerler","0 m³/h,0 I/min","0,3 m³/h,5 I/min","0,6 m³/h,10 I/min","0,9 m³/h,15 I/min","1,8 m³/h,30 I/min","2,4 m³/h,40 I/min"
            ,"3,0 m³/h,50 I/min","3,6 m³/h,60 I/min"
        ],
        listValue: ["180 mm" ,"230 V", "6 - 35", "0,04 - 0,32", "EEI ≤ 0,18","","6,9 m","6,9 m","5,8 m","5,1 m"
            ,"3,4 m","2,4 m","1,6 m","0,8 m"
        ],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/sirkulasyon_pompalari/EVOSTA2.jpg"]
    },

    {
        id : 11,
        productType: 'sirkulasyon_pompasi',
        productCode : ["EVOSTA3-60-180"],
        productName : ["EVOSTA3 60/180 Sirkülasyon Pompası"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Flanşlar Arası Mesafe", "Voltaj 50 Hz", "P1 Max W", "In A" ,"EEI Enerji Verimlilik İndeksi",
            "Hidrolik Değerler","0 m³/h,0 I/min","0,6 m³/h,10 I/min","1,2 m³/h,20 I/min","1,8 m³/h,30 I/min","2,4 m³/h,40 I/min","3 m³/h,50 I/min"
        ],
        listValue: ["180 mm" ,"230 V", "5 - 35", "0,04 - 0,33", "EEI ≤ 0,18","","6,0 m","6,0 m","4,4 m","3,3 m"
            ,"2,3 m","1,5 m"
        ],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/sirkulasyon_pompalari/EVOSTA3.jpg"]
    },

    {
        id : 11,
        productType: 'sirkulasyon_pompasi',
        productCode : ["EVOSTA3-60-180X"],
        productName : ["EVOSTA3 60/180 X Sirkülasyon Pompası"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Flanşlar Arası Mesafe", "Voltaj 50 Hz", "P1 Max W", "In A" ,"EEI Enerji Verimlilik İndeksi",
            "Hidrolik Değerler","0 m³/h,0 I/min","0,6 m³/h,10 I/min","1,2 m³/h,20 I/min","1,8 m³/h,30 I/min","2,4 m³/h,40 I/min","3 m³/h,50 I/min"
        ],
        listValue: ["180 mm" ,"230 V", "5 - 35", "0,04 - 0,33", "EEI ≤ 0,18","","6,0 m","6,0 m","4,4 m","3,3 m"
            ,"2,3 m","1,5 m"
        ],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/sirkulasyon_pompalari/EVOSTA3.jpg"]
    },
    
    {
        id : 11,
        productType: 'sirkulasyon_pompasi',
        productCode : ["EVOSTA3-80-130"],
        productName : ["EVOSTA3 80/130 Sirkülasyon Pompası"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Flanşlar Arası Mesafe", "Voltaj 50 Hz", "P1 Max W", "In A" ,"EEI Enerji Verimlilik İndeksi",
            "Hidrolik Değerler","0 m³/h,0 I/min","0,6 m³/h,10 I/min","1,2 m³/h,20 I/min","1,8 m³/h,30 I/min","2,4 m³/h,40 I/min","3 m³/h,50 I/min"
        ,"4,2 m³/h,70 I/min"
        ],
        listValue: ["130 mm" ,"230 V", "5 - 55", "0,05 - 0,47", "EEI ≤ 0,19","","8,0 m","8,0 m","6,5 m","5,1 m"
            ,"4,0 m","3,1 m","1,0 m"
        ],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/sirkulasyon_pompalari/EVOSTA3.jpg"]
    },

    {
        id : 11,
        productType: 'sirkulasyon_pompasi',
        productCode : ["EVOSTA3-80-180"],
        productName : ["EVOSTA3 80/180 Sirkülasyon Pompası"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Flanşlar Arası Mesafe", "Voltaj 50 Hz", "P1 Max W", "In A" ,"EEI Enerji Verimlilik İndeksi",
            "Hidrolik Değerler","0 m³/h,0 I/min","0,6 m³/h,10 I/min","1,2 m³/h,20 I/min","1,8 m³/h,30 I/min","2,4 m³/h,40 I/min","3 m³/h,50 I/min",
            "4,2 m³/h,70 I/min"
        ],
        listValue: ["180 mm" ,"230 V", "5 - 55", "0,05 - 0,47", "EEI ≤ 0,19","","8,0 m","8,0 m","6,5 m","5,1 m"
            ,"4,0 m","3,1 m","1,0 m"
        ],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/sirkulasyon_pompalari/EVOSTA3.jpg"]
    },

    {
        id : 11,
        productType: 'sirkulasyon_pompasi',
        productCode : ["EVOSTA3-80-180X"],
        productName : ["EVOSTA3 80/180 X Sirkülasyon Pompası"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Flanşlar Arası Mesafe", "Voltaj 50 Hz", "P1 Max W", "In A" ,"EEI Enerji Verimlilik İndeksi",
            "Hidrolik Değerler","0 m³/h,0 I/min","0,6 m³/h,10 I/min","1,2 m³/h,20 I/min","1,8 m³/h,30 I/min","2,4 m³/h,40 I/min","3 m³/h,50 I/min",
            "4,2 m³/h,70 I/min"
        ],
        listValue: ["180 mm" ,"230 V", "5 - 55", "0,05 - 0,47", "EEI ≤ 0,19","","8,0 m","8,0 m","6,5 m","5,1 m"
            ,"4,0 m","3,1 m","1,0 m"
        ],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/sirkulasyon_pompalari/EVOSTA3.jpg"]
    },
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
        ///////////////////// Baymak ///////////////////// 
    {
        id : 12,
        productType: 'kombi',
        productCode : ["LUNATEC-20"],
        productName : ["Lunatec 20 Kombi"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Mevsimsel Isıtma Verimlilik Sınıfı (ErP)", "Mevsimsel Isıtma Verimliliği (ns)", "Nominal Isı Gücü - Merkezi Isıtma 80-60°C (Pn)",
            "Minimum Güç - Merkezi Isıtma 80-60°C (Pn)", "Nominal Isı Gücü Verimliliği 80-60 (n4)", "Nominal %30 Kısmi Yükte Anma Isı Gücü (P1)",
            "Nominal %30 Kısmi Yükte Verimlilik (n1)", "Nominal Isı Gücü - Merkezi Isıtma 50-30°C (Pn)"
        ],
        listValue: ["A", "%94", "20 kW", "4,8 kW", "%88,2", "6,7 kW", "%99", "21,8 kW"],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/kombiler/lunatec.jpg"]
    },    

    {
        id : 12,
        productType: 'kombi',
        productCode : ["LUNATEC-24"],
        productName : ["Lunatec 24 Kombi"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Mevsimsel Isıtma Verimlilik Sınıfı (ErP)", "Mevsimsel Isıtma Verimliliği (ns)", "Nominal Isı Gücü - Merkezi Isıtma 80-60°C (Pn)",
            "Minimum Güç - Merkezi Isıtma 80-60°C (Pn)", "Nominal Isı Gücü Verimliliği 80-60 (n4)", "Nominal %30 Kısmi Yükte Anma Isı Gücü (P1)",
            "Nominal %30 Kısmi Yükte Verimlilik (n1)", "Nominal Isı Gücü - Merkezi Isıtma 50-30°C (Pn)"
        ],
        listValue: ["A", "%94", "22 kW", "4,8 kW", "%88,1", "7,4 kW", "%98,9", "23,9 kW"],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/kombiler/lunatec.jpg"]
    },   

    {
        id : 12,
        productType: 'kombi',
        productCode : ["LUNATEC-30"],
        productName : ["Lunatec 30 Kombi"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Mevsimsel Isıtma Verimlilik Sınıfı (ErP)", "Mevsimsel Isıtma Verimliliği (ns)", "Nominal Isı Gücü - Merkezi Isıtma 80-60°C (Pn)",
            "Minimum Güç - Merkezi Isıtma 80-60°C (Pn)", "Nominal Isı Gücü Verimliliği 80-60 (n4)", "Nominal %30 Kısmi Yükte Anma Isı Gücü (P1)",
            "Nominal %30 Kısmi Yükte Verimlilik (n1)", "Nominal Isı Gücü - Merkezi Isıtma 50-30°C (Pn)"
        ],
        listValue: ["A", "%94", "27,1 kW", "5,8 kW", "%87,9", "9,1 kW", "%98,8", "29,5 kW"],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/kombiler/lunatec.jpg"]
    },   

    {
        id : 12,
        productType: 'kombi',
        productCode : ["LUNATEC-35"],
        productName : ["Lunatec 35 Kombi"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Mevsimsel Isıtma Verimlilik Sınıfı (ErP)", "Mevsimsel Isıtma Verimliliği (ns)", "Nominal Isı Gücü - Merkezi Isıtma 80-60°C (Pn)",
            "Minimum Güç - Merkezi Isıtma 80-60°C (Pn)", "Nominal Isı Gücü Verimliliği 80-60 (n4)", "Nominal %30 Kısmi Yükte Anma Isı Gücü (P1)",
            "Nominal %30 Kısmi Yükte Verimlilik (n1)", "Nominal Isı Gücü - Merkezi Isıtma 50-30°C (Pn)"
        ],
        listValue: ["A", "%94", "30 kW", "7,3 kW", "%88,1", "10,1 kW", "%98,8", "32,5 kW"],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/kombiler/lunatec.jpg"]
    },   

    {
        id : 12,
        productType: 'kombi',
        productCode : ["DUOTEC-COMPACT-24"],
        productName : ["Duotec Compact 24 Kombi"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Mevsimsel Isıtma Verimlilik Sınıfı (ErP)", "Mevsimsel Isıtma Verimliliği (ns)", "Nominal Isı Gücü (Prated)",
            "Maksimum Isı Gücü - Merkezi Isıtma 80-60°C (P4)", "Minimum Isı Gücü - Merkezi Isıtma 80-60°C", "Anma Isı Gücü Verimliliği 80-60 (n4)",
            "%30 Kısmi Yükte Anma Isı Gücü (P1)", "%30 Kısmi Yükte Verimlilik (n1)", "Maksimum Isı Gücü - Merkezi Isıtma 50-30°C"
        ],
        listValue: ["A", "%92", "22 kW", "21,7 kW", "4,2 kW", "%86,3", "7,3 kW", "%96,9", "23,7 kW"],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/kombiler/duotec.jpg"]
    },   

    {
        id : 12,
        productType: 'kombi',
        productCode : ["DUOTEC-COMPACT-30"],
        productName : ["Duotec Compact 30 Kombi"],
        depth: "",
        width: "",
        height: "",
        listTitle: ["Mevsimsel Isıtma Verimlilik Sınıfı (ErP)", "Mevsimsel Isıtma Verimliliği (ns)", "Nominal Isı Gücü (Prated)",
            "Maksimum Isı Gücü - Merkezi Isıtma 80-60°C (P4)", "Minimum Isı Gücü - Merkezi Isıtma 80-60°C", "Anma Isı Gücü Verimliliği 80-60 (n4)",
            "%30 Kısmi Yükte Anma Isı Gücü (P1)", "%30 Kısmi Yükte Verimlilik (n1)", "Maksimum Isı Gücü - Merkezi Isıtma 50-30°C"
        ],
        listValue: ["A", "%92", "28 kW", "27,7 kW", "5,5 kW", "%86,1", "9,4 kW", "%96,8", "30,4 kW"],
        brand: ['Baymak'],
        img: ["/images/brands_page_images/kombiler/duotec.jpg"]
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

    
];
export default detailsList;