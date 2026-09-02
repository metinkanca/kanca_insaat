
const products:{
    id: number;
    title: String;
    link: string[];
    brand: string[];
    productType: String;
    img: string[];
    brandImg: string[];
}[] 
= [
    {
        id: 0,
        title: 'Isı Pompaları',
        link:['https://www.daiwa.com.tr/urun/dw-14-isi-pompasi/'],
        brand: ['Daiwa'],
        productType: 'isi_pompasi',
        img: ['/images/brands_page_images/isi_pompalari/DW-10-14.jpg'],
        brandImg: ['/images/daiwa_logo.png'],
    },

    {
        id: 1,
        title: 'Pelet Kazanları',
        link:['https://www.daiwa.com.tr/projects/pelet-kazanlari/'],
        brand: ['Daiwa'],
        productType: 'pelet_kazani',
        img: ['/images/brands_page_images/pelet_kazanlari/DP-25.jpg'],
        brandImg: ['/images/daiwa_logo.png'],
    },

    {
        id: 2,
        title: 'Kaloriferli Pelet Sobaları',
        link:['https://www.daiwa.com.tr/projects/pelet-kazanlari/'],
        brand: ['Daiwa'],
        productType: 'kaloriferli_pelet_sobasi',
        img: ['/images/brands_page_images/kaloriferli_pelet_sobalari/DP-16.jpg'],
        brandImg: ['/images/daiwa_logo.png'],
    },

    {
        id: 3,
        title: 'Üflemeli Pelet Sobaları',
        link:['https://www.daiwa.com.tr/projects/uflemeli-pelet-sobasi/'],
        brand: ['Daiwa'],
        productType: 'uflemeli_pelet_sobasi',
        img: ['/images/brands_page_images/uflemeli_pelet_sobalari/DP-06.jpg'],
        brandImg: ['/images/daiwa_logo.png'],
    },
    
    {
        id: 4,
        title: 'Katı Yakıtlı Kalorifer Sobaları',
        link:['https://www.daiwa.com.tr/projects/kati-yakitli-kalorifer-sobalari/'],
        brand: ['Daiwa'],
        productType: 'kati_yakitli_kalorifer_sobasi',
        img: ['/images/brands_page_images/kati_yakitli_kalorifer_sobalari/DK-21.jpg'],
        brandImg: ['/images/daiwa_logo.png'],
    },
    
    {
        id: 5,
        title: 'Katı Yakıtlı Kazanları',
        link:['https://www.daiwa.com.tr/projects/kati-yakit-kazani/'],
        brand: ['Daiwa'],
        productType: 'kati_yakitli_kazan',
        img: ['/images/brands_page_images/kati_yakitli_kazanlar/DY-30.jpg'],
        brandImg: ['/images/daiwa_logo.png'],
    },
    
    {
        id: 6,
        title: 'Katı Yakıtlı Sobaları',
        link:['https://www.daiwa.com.tr/projects/kati-yakit-sobasi/'],
        brand: ['Daiwa'],
        productType: 'kati_yakitli_soba',
        img: ['/images/brands_page_images/kati_yakitli_sobalar/DKS-12.jpg'],
        brandImg: ['/images/daiwa_logo.png'],
    },
    
    {
        id: 7,
        title: 'Boyler',
        link:['https://rushwarm.com/urunler/boyler-grubu'],
        brand: ['Rush'],
        productType: 'boyler',
        img: ['/images/brands_page_images/boylerler/RSS.jpg'],
        brandImg: ['/images/rush_logo.png'],
    },
    
    {
        id: 8,
        title: 'Termoboyler',
        link:['https://www.baymak.com.tr/urunler/su-isiticilari/termoboylerler/aqua-termoboyler'],
        brand: ['Baymak'],
        productType: 'termoboyler',
        img: ['/images/brands_page_images/termoboylerler/SMTK65-100.jpg'],
        brandImg: ['/images/baymak_logo.png'],
    },
    
    {
        id: 9,
        title: 'Buffer Tankları',
        link:['https://rushwarm.com/urunler/buffer-tank'],
        brand: ['Rush'],
        productType: 'buffer_tanki',
        img: ['/images/brands_page_images/buffer_tanklari/RSB.jpg'],
        brandImg: ['/images/baymak_logo.png','/images/rush_logo.png'],
    },

    {
        id: 12,
        title: 'Kombiler',
        link:['https://eca.com.tr/yogusmali','https://termoteknik.com/bireysel-isitma-sistemleri-kombiler/','https://www.demirdokum.com.tr/urunler/kombiler/'],
        brand: ['E.C.A','Termoteknik','Demirdöküm'],
        productType: 'kombi',
        img: ['/images/brands_page_images/kombiler/proteus.jpg','/images/brands_page_images/kombiler/lunatec.jpg','/images/brands_page_images/kombiler/lotus.jpg','/images/brands_page_images/kombiler/ademix.jpg'],
        brandImg: ['../images/eca_logo.png','../images/termoteknik_logo.png','../images/demirdokum_logo.png'],
    },

    {
        id: 13,
        title: 'Hidroforlar',
        link:['https://kentassupompalari.com/products/mini-paket-hidrofor/'],
        brand: ['Kentaş'],
        productType: 'hidrofor',
        img: ['/images/products_page_images/kentas_hidrofor.png'],
        brandImg: ['/images/kentas_logo.png'],
    },

    {
        id: 14,
        title: 'Koruyucu Malzemeler',
        link:['https://international.adey.com/tr'],
        brand: ['Adey'],
        productType: 'koruyucu_malzeme',
        img: ['/images/brands_page_images/koruyucu_malzemeler/mczero.jpg'],
        brandImg: ['/images/adey_logo.webp'],
    }


];
export default products;