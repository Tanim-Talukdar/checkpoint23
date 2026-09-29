export default function robots() {
  const baseUrl = "https://www.checkpoint.place";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },

    sitemap: `${baseUrl}/sitemap.xml`,
  };
}