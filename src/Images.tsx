import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import SingleImageSlider from "./SingleImageSlider";

import kombi from "/images/main_page_slider_images/eca_kombi.png";
import pelet_kazani from "/images/main_page_slider_images/pelet_kazani.png";
import kalorifer_sobasi from "/images/main_page_slider_images/kalorifer_sobasi.png";
import rubini from "/images/main_page_slider_images/kas_rubini_botti.png";

const FALLBACK = [kombi, pelet_kazani, kalorifer_sobasi, rubini];

export default function Images() {
  const [images, setImages] = useState<string[]>(FALLBACK);

  useEffect(() => {
    getDoc(doc(db, 'homeConfig', 'main')).then(snap => {
      if (!snap.exists()) return;
      const imgs = snap.data().sliderImages as string[] | undefined;
      if (imgs && imgs.length > 0) setImages(imgs);
    });
  }, []);

  return (
    <div style={{ width: "100%", aspectRatio: "4/3" }}>
      <SingleImageSlider imageUrls={images} />
    </div>
  );
}
