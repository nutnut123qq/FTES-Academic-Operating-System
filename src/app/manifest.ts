import type { MetadataRoute } from "next"
import { SEO_CONFIG } from "@/config/seo"

/**
 * `/manifest.webmanifest` — minimal PWA manifest so the site is installable and
 * gets a name/theme on mobile. Icons reuse the existing brand mark.
 */
const manifest = (): MetadataRoute.Manifest => ({
    name: SEO_CONFIG.siteName,
    short_name: "FTES AOS",
    description: SEO_CONFIG.defaultDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b0f",
    theme_color: "#0b0b0f",
    icons: [
        {
            src: "/logo-icon.png",
            sizes: "512x512",
            type: "image/png",
        },
    ],
})

export default manifest
