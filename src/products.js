
const products = [
    {
        id: 0,
        title: 'Isı Pompaları',
        link:['https://www.daiwa.com.tr/urun/dw-14-isi-pompasi/','https://www.baymak.com.tr/urunler/yenilenebilir-enerji-sistemleri/isi-pompalari/iotherm-hava-kaynakli-monoblok-inverter-isi-pompasi'],
        brand: ['Daiwa','Baymak'],
        productType: 'isi_pompasi',
        img: ['./images/products_page_images/baymak_isi_pompasi.jpg'],
        brandImg: ['./images/daiwa_logo.png','./images/baymak_logo.png'],
    },

    {
        id: 1,
        title: 'Pelet Kazanları',
        link:['https://www.daiwa.com.tr/projects/pelet-kazanlari/'],
        brand: ['Daiwa'],
        productType: 'pelet_kazani',
        img: ['./images/products_page_images/daiwa_pelet_kazani.png'],
        brandImg: ['./images/daiwa_logo.png'],
    },

    {
        id: 2,
        title: 'Kaloriferli Pelet Sobaları',
        link:['https://www.daiwa.com.tr/projects/pelet-kazanlari/'],
        brand: ['Daiwa'],
        productType: 'kaloriferli_pelet_sobasi',
        img: ['./images/products_page_images/daiwa_kaloriferli_pelet_sobasi.png'],
        brandImg: ['./images/daiwa_logo.png'],
    },

    {
        id: 3,
        title: 'Üflemeli Pelet Sobaları',
        link:['https://www.daiwa.com.tr/projects/uflemeli-pelet-sobasi/'],
        brand: ['Daiwa'],
        productType: 'uflemeli_pelet_sobasi',
        img: ['./images/products_page_images/daiwa_uflemeli_pelet_sobasi.png'],
        brandImg: ['./images/daiwa_logo.png'],
    },
    
    {
        id: 4,
        title: 'Katı Yakıtlı Kalorifer Sobaları',
        link:['https://www.daiwa.com.tr/projects/kati-yakitli-kalorifer-sobalari/'],
        brand: ['Daiwa'],
        productType: 'kati_yakitli_kalorifer_sobasi',
        img: ['./images/products_page_images/daiwa_kati_yakitli_kalorifer_sobasi.png'],
        brandImg: ['./images/daiwa_logo.png'],
    },
    
    {
        id: 5,
        title: 'Katı Yakıtlı Kazanları',
        link:['https://www.daiwa.com.tr/projects/kati-yakit-kazani/'],
        brand: ['Daiwa'],
        productType: 'kati_yakitli_kazan',
        img: ['./images/products_page_images/daiwa_kati_yakitli_kazan.png'],
        brandImg: ['./images/daiwa_logo.png'],
    },
    
    {
        id: 6,
        title: 'Katı Yakıtlı Sobaları',
        link:['https://www.daiwa.com.tr/projects/kati-yakit-sobasi/'],
        brand: ['Daiwa'],
        productType: 'kati_yakitli_soba',
        img: ['./images/products_page_images/daiwa_kati_yakitli_soba.png'],
        brandImg: ['./images/daiwa_logo.png'],
    },
    
    {
        id: 7,
        title: 'Boyler',
        link:['https://www.baymak.com.tr/urunler/su-isiticilari/boylerler'],
        brand: ['Baymak'],
        productType: 'boyler',
        img: ['./images/products_page_images/baymak_boyler.png'],
        brandImg: ['./images/baymak_logo.png'],
    },
    
    {
        id: 8,
        title: 'Termoboyler',
        link:['https://www.baymak.com.tr/urunler/su-isiticilari/termoboylerler/aqua-termoboyler'],
        brand: ['Baymak'],
        productType: 'termoboyler',
        img: ['./images/products_page_images/baymak_termoboyler.png'],
        brandImg: ['./images/baymak_logo.png'],
    },
    
    {
        id: 9,
        title: 'Buffer Tankları',
        link:['https://www.baymak.com.tr/urunler/su-isiticilari/boylerler/aqua-buffer-tanki'],
        brand: ['Baymak'],
        productType: 'buffer_tanki',
        img: ['./images/products_page_images/baymak_buffer_tank.png'],
        brandImg: ['./images/baymak_logo.png'],
    },

    {
        id: 10,
        title: 'Elektrikli Termosifonlar',
        link:['https://www.baymak.com.tr/urunler/su-isiticilari/termosifonlar'],
        brand: ['Baymak'],
        productType: 'elektrikli_termosifon',
        img: ['./images/products_page_images/baymak_elektrikli_termosifon.png'],
        brandImg: ['./images/baymak_logo.png'],
    },
    
    {
        id: 11,
        title: 'Sirkülasyon Pompaları',
        link:['https://www.baymak.com.tr/urunler/su-teknolojileri/sirkulasyon-pompalari'],
        brand: ['Baymak'],
        productType: 'sirkulasyon_pompasi',
        img: ['./images/products_page_images/baymak_sirkulasyon_pompasi.png'],
        brandImg: ['./images/baymak_logo.png'],
    },

    {
        id: 12,
        title: 'Kombiler',
        link:['https://eca.com.tr/yogusmali','https://www.baymak.com.tr/kombi','https://termoteknik.com/bireysel-isitma-sistemleri-kombiler/','https://www.demirdokum.com.tr/urunler/kombiler/'],
        brand: ['E.C.A','Baymak','Termoteknik','Demirdöküm'],
        productType: 'kombi',
        img: ['./images/products_page_images/eca_kombi.png'],
        brandImg: ['./images/eca_logo.png','./images/baymak_logo.png','./images/termoteknik_logo.png','./images/demirdokum_logo.png'],
    },


];
export default products;