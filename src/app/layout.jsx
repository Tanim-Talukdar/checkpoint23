"use client";

import Navbar from "@/components/layout/Navbar";
import "./globals.css";
import { usePathname } from "next/navigation";
import Footer from "@/components/layout/Footer";

export default function RootLayout({ children }) {
  const pathname = usePathname();

  const isAdmin = pathname.startsWith("/admin");
  const isBooking = pathname.startsWith("/booking");

  const structuredData = {
    "@context": "https://schema.org",

    "@type": "EntertainmentBusiness",

    "@id": "https://www.checkpoint.place/#business",

    name: "The Checkpoint",

    alternateName: "The Checkpoint Bangladesh",

    url: "https://www.checkpoint.place/",

    logo: "https://www.checkpoint.place/logo.webp",

    image: [
      "https://www.checkpoint.place/view7.webp",
      "https://www.checkpoint.place/view6.jpeg",
      "https://www.checkpoint.place/view11.jpg",
    ],

    description:
      "The Checkpoint is a premium gaming and entertainment destination in Bashundhara, Dhaka, featuring gaming, movie theater, VR zone, card games, racing simulator, restaurant, gym and swimming pool.",

    telephone: "+8801844240483",

    priceRange: "$$",

    address: {
      "@type": "PostalAddress",
      streetAddress:
        "Block C, Road 2, House 1/F, Bashundhara R/A",
      addressLocality: "Dhaka",
      addressRegion: "Dhaka Division",
      postalCode: "1229",
      addressCountry: "BD",
    },

    areaServed: {
      "@type": "City",
      name: "Dhaka",
    },

    hasMap:
      "https://maps.app.goo.gl/E39BMbkKWRL7FBty7",

    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",

        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],

        opens: "11:00",
        closes: "00:00",
      },
    ],

    sameAs: [
      "https://www.instagram.com/checkpoint_bd",
      "https://www.facebook.com/profile.php?id=61591601052508",
    ],

    contactPoint: [
      {
        "@type": "ContactPoint",

        telephone: "+8801844240483",

        contactType: "customer service",

        areaServed: "BD",

        availableLanguage: [
          "English",
          "Bengali",
        ],
      },
    ],

    knowsAbout: [
      "Gaming",
      "PC Gaming",
      "Racing Simulator",
      "Virtual Reality",
      "Movie Theater",
      "Card Games",
      "Restaurant",
      "Fitness",
      "Gym",
      "Swimming Pool",
    ],
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>

      <body>
        {!isAdmin && <Navbar />}

        <main>{children}</main>

        {!isAdmin && !isBooking && <Footer />}
      </body>
    </html>
  );
}