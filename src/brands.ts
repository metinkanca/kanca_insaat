const brands :{
    productName: string;
    productType: string;
    productCode: string[];
    brand: string[];
    img: string[];
}[]
 = [
    //////////////////// ISI POMPALARI ////////////////////
    {
        brand: ['Daiwa'],
        productName: "Isı Pompaları",
        productType: 'isi_pompasi',
        productCode: ['DW-10','DW-14','DW-18','DW-24'],
        img: ['/images/brands_page_images/isi_pompalari/DW-10-14.jpg',
              '/images/brands_page_images/isi_pompalari/DW-10-14.jpg',
              '/images/brands_page_images/isi_pompalari/DW-18-24.jpg',
              '/images/brands_page_images/isi_pompalari/DW-18-24.jpg'
        ]
    },
    {
        brand: ['Baymak'],
        productName: "Isı Pompaları",
        productType: 'isi_pompasi',
        productCode: ['IO-MM80P', 'IO-MM100P', 'IO-MM120P', 'IO-MM140P', 'IO-MM160P', 'IO-MT160P','IO-MT220P','IO-MT260P','IO-MT300P'],
        img: ['/images/brands_page_images/isi_pompalari/IO-MM.jpg',
            '/images/brands_page_images/isi_pompalari/IO-MM.jpg',
            '/images/brands_page_images/isi_pompalari/IO-MM.jpg',
            '/images/brands_page_images/isi_pompalari/IO-MM.jpg',
            '/images/brands_page_images/isi_pompalari/IO-MM.jpg',
            '/images/brands_page_images/isi_pompalari/IO-MM.jpg',
            '/images/brands_page_images/isi_pompalari/IO-MT.jpg',
            '/images/brands_page_images/isi_pompalari/IO-MT.jpg',
            '/images/brands_page_images/isi_pompalari/IO-MT.jpg',
             ]
    },

    //////////////////// PELET KAZANLARI ////////////////////
    {
        brand: ['Daiwa'],
        productName: "Pelet Kazanları",
        productType: 'pelet_kazani',
        productCode: ['DP-25','DP-35','DP-40','DP-60'],
        img: ['/images/brands_page_images/pelet_kazanlari/DP-25.jpg',
            '/images/brands_page_images/pelet_kazanlari/DP-35.jpg',
            '/images/brands_page_images/pelet_kazanlari/DP-40.jpg',
            '/images/brands_page_images/pelet_kazanlari/DP-60.jpg'
        ]
    },

    //////////////////// PELET SOBALARI ////////////////////
    {
       
        brand: ['Daiwa'],
        productName: "Kaloriferli Pelet Sobaları",
        productType: 'kaloriferli_pelet_sobasi',
        productCode: ['DP-16','DP-24','DP-28','DP-30F','DP-22F'],
        img: ['/images/brands_page_images/kaloriferli_pelet_sobalari/DP-16.jpg',
            '/images/brands_page_images/kaloriferli_pelet_sobalari/DP-24.jpg',
            '/images/brands_page_images/kaloriferli_pelet_sobalari/DP-28.jpg',
            '/images/brands_page_images/kaloriferli_pelet_sobalari/DP-30.jpg',
            '/images/brands_page_images/kaloriferli_pelet_sobalari/DP-22.jpg'
        ]
    },

    //////////////////// ÜFLEMELİ PELET SOBALARI ////////////////////
    {
        brand: ['Daiwa'],
        productName: "Üflemeli Pelet Sobaları",
        productType: 'uflemeli_pelet_sobasi',
        productCode: ['DP-06','DP-10'],
        img: ['/images/brands_page_images/uflemeli_pelet_sobalari/DP-06.jpg',
            '/images/brands_page_images/uflemeli_pelet_sobalari/DP-10.jpg'
        ]
    },

    //////////////////// KATI YAKITLI KALORİFER SOBALARI ////////////////////
    {

        brand: ['Daiwa'],
        productName: "Katı Yakıtlı Kalorifer Sobaları",
        productType: 'kati_yakitli_kalorifer_sobasi',
        productCode: ['DK-21','DK-22','DK-22 Plus','DK-25','DK-29','DŞ-25'],
        img: ['/images/brands_page_images/kati_yakitli_kalorifer_sobalari/DK-21.jpg',
            '/images/brands_page_images/kati_yakitli_kalorifer_sobalari/DK-22.jpg',
            '/images/brands_page_images/kati_yakitli_kalorifer_sobalari/DK-22PLUS.jpg',
            '/images/brands_page_images/kati_yakitli_kalorifer_sobalari/DK-25.jpg',
            '/images/brands_page_images/kati_yakitli_kalorifer_sobalari/DK-29.jpg',
            '/images/brands_page_images/kati_yakitli_kalorifer_sobalari/DŞ-25.jpg'
        ]
    },

    //////////////////// KATI YAKITLI KAZANLAR ////////////////////
    {

        brand: ['Daiwa'],
        productName: "Katı Yakıtlı Kazanları",
        productType: 'kati_yakitli_kazan',
        productCode: ['DY-30','DY-40'],
        img: ['/images/brands_page_images/kati_yakitli_kazanlar/DY-30.jpg',
            '/images/brands_page_images/kati_yakitli_kazanlar/DY-40.jpg']
    },

    //////////////////// KATI YAKITLI SOBALAR ////////////////////
    {

        brand: ['Daiwa'],
        productName: "Katı Yakıtlı Sobaları",
        productType: 'kati_yakitli_soba',
        productCode: ['DKS-12','DKS-15','DKS-19'],
        img: ['/images/brands_page_images/kati_yakitli_sobalar/DKS-12.jpg',
            '/images/brands_page_images/kati_yakitli_sobalar/DKS-15.jpg',
            '/images/brands_page_images/kati_yakitli_sobalar/DKS-19.jpg'
        ]
    },

    //////////////////// BOYLERLER ////////////////////
    {
   
        brand: ['Baymak'],
        productName: "Boylerleri",
        productType: 'boyler',
        productCode: ['T80L','T100L','T120L','T160L','T200L','T300L','T400L','T500L','T800L','T100L'],
        img: ['/images/brands_page_images/boylerler/T80-1000L.jpg',
            '/images/brands_page_images/boylerler/T80-1000L.jpg',
            '/images/brands_page_images/boylerler/T80-1000L.jpg',
            '/images/brands_page_images/boylerler/T80-1000L.jpg',
            '/images/brands_page_images/boylerler/T80-1000L.jpg',
            '/images/brands_page_images/boylerler/T80-1000L.jpg',
            '/images/brands_page_images/boylerler/T80-1000L.jpg',
            '/images/brands_page_images/boylerler/T80-1000L.jpg',
            '/images/brands_page_images/boylerler/T80-1000L.jpg',
            '/images/brands_page_images/boylerler/T80-1000L.jpg'
        ]
    },

    {
   
        brand: ['Rush'],
        productName: "Boylerleri",
        productType: 'boyler',
        productCode: ['RSS100','RSS160','RSS200','RSS300','RSS500','RSD200','RSD300','RSD500','RSD800','RSE100','RSE160','RSE200','RSE300','RSE500'],
        img: ['/images/brands_page_images/boylerler/RSS.jpg',
            '/images/brands_page_images/boylerler/RSS.jpg',
            '/images/brands_page_images/boylerler/RSS.jpg',
            '/images/brands_page_images/boylerler/RSS.jpg',
            '/images/brands_page_images/boylerler/RSS.jpg',
            '/images/brands_page_images/boylerler/RSD.jpg',
            '/images/brands_page_images/boylerler/RSD.jpg',
            '/images/brands_page_images/boylerler/RSD.jpg',
            '/images/brands_page_images/boylerler/RSD.jpg',
            '/images/brands_page_images/boylerler/RSE.jpg',
            '/images/brands_page_images/boylerler/RSE.jpg',
            '/images/brands_page_images/boylerler/RSE.jpg',
            '/images/brands_page_images/boylerler/RSE.jpg',
            '/images/brands_page_images/boylerler/RSE.jpg',
           
        ]
    },

    //////////////////// TERMOBOYLERLER ////////////////////
    {

        brand: ['Baymak'],
        productName: "Termoboylerleri",
        productType: 'termoboyler',
        productCode: ['SMTK-65','SMTK-80','SMTK-100'],
        img: ['/images/brands_page_images/termoboylerler/SMTK65-100.jpg',
            '/images/brands_page_images/termoboylerler/SMTK65-100.jpg',
            '/images/brands_page_images/termoboylerler/SMTK65-100.jpg'
        ]
    },

    //////////////////// BUFFER TANKLARI ////////////////////
    {

        brand: ['Baymak'],
        productName: "Buffer Tankları",
        productType: 'buffer_tanki',
        productCode: ['AQUA'],
        img: ['/images/brands_page_images/buffer_tanklari/AQUA.jpg']
    },
     {

        brand: ['Rush'],
        productName: "Buffer Tankları",
        productType: 'buffer_tanki',
        productCode: ['RSB100','RSB160','RSB200','RSB300','RSB500'],
        img: ['/images/brands_page_images/buffer_tanklari/RSB.jpg',
            '/images/brands_page_images/buffer_tanklari/RSB.jpg',
            '/images/brands_page_images/buffer_tanklari/RSB.jpg',
            '/images/brands_page_images/buffer_tanklari/RSB.jpg',
            '/images/brands_page_images/buffer_tanklari/RSB.jpg',
        ]
    },
    //////////////////// ELEKTRİKLİ TERMOSİFONLAR ////////////////////
    {

        brand: ['Baymak'],
        productName: "Elektrikli Termosifonları",
        productType: 'elektrikli_termosifon',
        productCode: ['MTK-50','MTK-65','MTK-80','MTK-100'],
        img: ['/images/brands_page_images/elektrikli_termosifonlari/MTK50-100.jpg',
            '/images/brands_page_images/elektrikli_termosifonlari/MTK50-100.jpg',
            '/images/brands_page_images/elektrikli_termosifonlari/MTK50-100.jpg',
            '/images/brands_page_images/elektrikli_termosifonlari/MTK50-100.jpg'
        ]
    },
    
    //////////////////// SİRKÜLASYON POMPALARI ////////////////////
    {
     
        brand: ['Baymak'],
        productName: "Sirkülasyon Pompaları",
        productType: 'sirkulasyon_pompasi',
        productCode: ['EVOSTA2-40-70-130','EVOSTA2-40-70-180','EVOSTA3-60-180','EVOSTA3-60-180X','EVOSTA3-80-130','EVOSTA3-80-130X','EVOSTA3-80-180X'],
        img: ['/images/brands_page_images/sirkulasyon_pompalari/EVOSTA2.jpg',
            '/images/brands_page_images/sirkulasyon_pompalari/EVOSTA2.jpg',
            '/images/brands_page_images/sirkulasyon_pompalari/EVOSTA3.jpg',
            '/images/brands_page_images/sirkulasyon_pompalari/EVOSTA3.jpg',
            '/images/brands_page_images/sirkulasyon_pompalari/EVOSTA3.jpg',
            '/images/brands_page_images/sirkulasyon_pompalari/EVOSTA3.jpg',
            '/images/brands_page_images/sirkulasyon_pompalari/EVOSTA3.jpg',
        ]
    },

    //////////////////// KOMBİLER ////////////////////
    {
        brand: ['E.C.A'],
        productName: "Kombileri",
        productType: 'kombi',
        productCode: ['PROTEUS-PREMIX','CALORA-PREMIX','CITIUS-PREMIX'],
        img: ['/images/brands_page_images/kombiler/proteus.jpg',
            '/images/brands_page_images/kombiler/calora.jpg',
            '/images/brands_page_images/kombiler/citius.jpg',
        ]
    },

    {
        brand: ['Baymak'],
        productName: "Kombileri",
        productType: 'kombi',
        productCode: ['LUNATEC-20','LUNATEC-20','LUNATEC-30','LUNATEC-35','DUOTEC-COMPACT-24','DUOTEC-COMPACT-30'],
        img: ['/images/brands_page_images/kombiler/lunatec.jpg',
            '/images/brands_page_images/kombiler/lunatec.jpg',
            '/images/brands_page_images/kombiler/lunatec.jpg',
            '/images/brands_page_images/kombiler/lunatec.jpg',
            '/images/brands_page_images/kombiler/duotec.jpg',
            '/images/brands_page_images/kombiler/duotec.jpg',
        ]
    },

    {
        brand: ['Termoteknik'],
        productName: "Kombileri",
        productType: 'kombi',
        productCode: ['LOTUS-20','LOTUS-26','LOTUS-36','LOTUS-42','LOGIC2-26',"LOGIC2-31"],
        img: ['/images/brands_page_images/kombiler/lotus.jpg',
            '/images/brands_page_images/kombiler/lotus.jpg',
            '/images/brands_page_images/kombiler/lotus.jpg',
            '/images/brands_page_images/kombiler/lotus.jpg',
            '/images/brands_page_images/kombiler/logic2.jpg',
            '/images/brands_page_images/kombiler/logic2.jpg',
        ]
    },

    {
        brand: ['Demirdöküm'],
        productName: "Kombileri",
        productType: 'kombi',
        productCode: ['ADEMIX-P24','ADEMIX-P28','VINTOMIX-P24','VINTOMIX-P28'],
        img: ['/images/brands_page_images/kombiler/ademix.jpg',
            '/images/brands_page_images/kombiler/ademix.jpg',
            '/images/brands_page_images/kombiler/vintomix.jpg',
            '/images/brands_page_images/kombiler/vintomix.jpg',
        ]
    },

    //////////////////// HİDROFORLAR ////////////////////
    {
        brand: ['Kentaş'],
        productName: "Hidroforlar",
        productType: 'hidrofor',
        productCode: ['1WZB370','1WZB750'],
        img: ['/images/brands_page_images/hidroforlar/1WZB370-750.png',
            '/images/brands_page_images/hidroforlar/1WZB370-750.png'
        ]
    },
    //////////////////// KORUYUCU MALZEMELER ///////////////
    {
        brand: ['Adey'],
        productName: "Koruyucu Malzemeler",
        productType: 'koruyucu_malzeme',
        productCode: ['MCZERO','MCZEROPLUS','PROFESSIONAL2XP'],
        img: ['/images/brands_page_images/koruyucu_malzemeler/mczero.jpg',
            '/images/brands_page_images/koruyucu_malzemeler/mczeroplus.jpg',
            '/images/brands_page_images/koruyucu_malzemeler/professional2xp.jpg'
        ]
    },
];

export default brands;