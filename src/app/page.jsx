


import Features from "@/components/home/packeges";
import Gaming from "@/components/home/Gaming";

import Resturant from "@/components/home/Resturant";
import Gallery from "@/components/home/gallery";

/* =========================================================
   HOMEPAGE SEO
   ========================================================= */

export const metadata = {
  title:
    "The Checkpoint Dhaka | Gaming, Movies, VR, Gym, Restaurant & More",

  description:
    "The Checkpoint is a premium entertainment destination in Dhaka featuring a gaming zone, PC gaming, racing simulator, movie theater, VR zone, card games, gym, restaurant and swimming pool in Bashundhara.",

  keywords: [
    /* =========================
       BRAND
    ========================= */

    "The Checkpoint",
    "The Checkpoint Dhaka",
    "The Checkpoint Bangladesh",

    /* =========================
       MAIN BUSINESS
    ========================= */

    "entertainment center Dhaka",
    "entertainment center Bashundhara",
    "entertainment zone Dhaka",
    "entertainment place Dhaka",
    "things to do in Dhaka",
    "things to do in Bashundhara",

    /* =========================
       GAMING
    ========================= */

    "gaming zone Dhaka",
    "gaming lounge Dhaka",
    "gaming center Dhaka",
    "gaming zone Bashundhara",
    "gaming lounge Bashundhara",
    "PC gaming Dhaka",
    "PC gaming Bashundhara",
    "gaming center Bashundhara",

    /* =========================
       RACING SIMULATOR
    ========================= */

    "racing simulator Dhaka",
    "racing simulator Bashundhara",
    "car racing simulator Dhaka",
    "racing games Dhaka",

    /* =========================
       MOVIE THEATER
    ========================= */

    "movie theater Dhaka",
    "movie theatre Dhaka",
    "cinema Dhaka",
    "movie theater Bashundhara",
    "cinema Bashundhara",
    "movie experience Dhaka",

    /* =========================
       VR
    ========================= */

    "VR zone Dhaka",
    "VR gaming Dhaka",
    "virtual reality Dhaka",
    "VR experience Dhaka",
    "VR zone Bashundhara",

    /* =========================
       CARD GAMES
    ========================= */

    "card game zone Dhaka",
    "card games Dhaka",
    "card game zone Bashundhara",
    "game zone Dhaka",

    /* =========================
       GYM & FITNESS
    ========================= */

    "gym Dhaka",
    "gym Bashundhara",
    "fitness center Dhaka",
    "fitness center Bashundhara",
    "fitness gym Dhaka",

    /* =========================
       RESTAURANT
    ========================= */

    "restaurant Dhaka",
    "restaurant Bashundhara",
    "restaurant in Bashundhara",
    "restaurant near Bashundhara",
    "food place Bashundhara",

    /* =========================
       SWIMMING
    ========================= */

    "swimming pool Dhaka",
    "swimming pool Bashundhara",
    "swimming pool in Bashundhara",
    "swimming Dhaka",

    /* =========================
       LOCAL
    ========================= */

    "Bashundhara R/A",
    "Bashundhara Dhaka",
    "places to visit in Bashundhara",
    "entertainment in Bashundhara",
  ],

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",

    title:
      "The Checkpoint Dhaka | Gaming, Movies, VR, Gym, Restaurant & More",

    description:
      "Gaming, movies, VR, card games, racing simulator, gym, restaurant and swimming pool — all at The Checkpoint in Bashundhara, Dhaka.",

    url: "/",

    siteName: "The Checkpoint",

    locale: "en_BD",

    images: [
      {
        url: "/view6.jpeg",
        width: 1200,
        height: 800,
        alt:
          "The Checkpoint gaming and entertainment center in Dhaka",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title:
      "The Checkpoint Dhaka | Gaming, Movies, VR, Gym & More",

    description:
      "Premium gaming, movies, VR, racing simulator, restaurant, gym and swimming experiences in Bashundhara, Dhaka.",

    images: ["/view6.jpeg"],
  },
};

/* =========================================================
   HOMEPAGE
   ========================================================= */

export default function Home() {
  return (
    <main>



      <Gaming />
      <Features />
      <Resturant />
      <Gallery />
      


    </main>
  );
}

