
import Navbar from "@/components/layout/Navbar";
import "./globals.css";
import Footer from "@/components/layout/Footer";
import ConditionalLayout from "@/components/layout/ConditionalLayout";

export const metadata = {
  metadataBase: new URL("https://www.checkpoint.place/"),

  title: {
    default: "The Checkpoint | Gaming, Restaurant & Fitness in Dhaka",
    template: "%s | The Checkpoint",
  },

  description:
    "The Checkpoint is a premium gaming lounge, restaurant and fitness destination in Bashundhara, Dhaka. Book gaming sessions, memberships, restaurant experiences and more.",

  keywords: [
    // Brand
    "The Checkpoint",
    "The Checkpoint Dhaka",
    "The Checkpoint Bangladesh",

    // Gaming
    "gaming zone Dhaka",
    "gaming lounge Dhaka",
    "gaming center Dhaka",
    "PC gaming Dhaka",
    "gaming Bashundhara",

    // Movie Theater
    "movie theater Dhaka",
    "cinema Dhaka",
    "movie theater Bashundhara",
    "cinema Bashundhara",

    // VR
    "VR zone Dhaka",
    "VR gaming Dhaka",
    "virtual reality Dhaka",
    "VR zone Bashundhara",

    // Card Games
    "card game zone Dhaka",
    "card games Dhaka",
    "game zone Dhaka",

    // Gym
    "gym Dhaka",
    "gym Bashundhara",
    "fitness center Dhaka",
    "fitness gym Bashundhara",

    // Restaurant
    "restaurant Dhaka",
    "restaurant Bashundhara",
    "restaurant in Bashundhara",

    // Swimming
    "swimming pool Dhaka",
    "swimming pool Bashundhara",
    "swimming pool in Bashundhara",

    // Entertainment
    "entertainment center Dhaka",
    "entertainment zone Dhaka",
    "family entertainment Dhaka",
    "indoor entertainment Dhaka",
  ],

  authors: [
    {
      name: "The Checkpoint",
    },
  ],

  creator: "The Checkpoint",
  publisher: "The Checkpoint",

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "en_BD",
    url: "https://www.checkpoint.place/",
    siteName: "The Checkpoint",

    title: "The Checkpoint | Gaming, Restaurant & Fitness in Dhaka",

    description:
      "Premium gaming, restaurant and fitness experiences in Bashundhara, Dhaka.",

    images: [
      {
        url: "/logo.webp",
        width: 1200,
        height: 630,
        alt: "The Checkpoint - Gaming, Restaurant & Fitness",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "The Checkpoint | Gaming, Restaurant & Fitness in Dhaka",

    description:
      "Premium gaming, restaurant and fitness experiences in Bashundhara, Dhaka.",

    images: ["/logo.webp"],
  },

  icons: {
    icon: "/logo.webp",
    shortcut: "/logo.webp",
    apple: "/logo.webp",
  },
};

export default function RootLayout({ children }) {
  /* =========================================================
     LOCAL BUSINESS / ORGANIZATION STRUCTURED DATA
     ========================================================= */

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
        {/* =====================================================
            LOCAL BUSINESS STRUCTURED DATA
        ====================================================== */}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
<body>
  <ConditionalLayout>
    {children}
  </ConditionalLayout>
</body>
    </html>
  );
}
