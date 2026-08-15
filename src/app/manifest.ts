import type { MetadataRoute } from "next"
import { SEO_CONFIG } from "@/config/seo"

/**
 * `/manifest.webmanifest` — minimal PWA manifest so the site is installable and
 * gets a name/theme on mobile. Icons reuse the existing brand mark.
 */
const manifest = (): MetadataRoute.Manifest => ({
    name: SEO_CONFIG.siteName,
    // `name` follows SEO_CONFIG.siteName ("FTES - AI Learning"); `short_name` is the
    // home-screen label, which launchers truncate past ~12 chars — so it stays the
    // bare brand root rather than the full lockup.
    short_name: "FTES",
    description: SEO_CONFIG.defaultDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b0f",
    theme_color: "#0b0b0f",
    // The old entry here was `/logo-icon.png` — a 512² StarCI tile (pink "S" on
    // #11181C), i.e. the wrong brand on every install / share surface. Repointed
    // at the FTES assets that actually exist in the repo:
    // - `LogoFtestMini.png` is the blue mark, legible on light *and* dark, but
    //   only 80² (below the 144² Chrome wants before it offers an install).
    // - `FTES_original.svg` is the vector wordmark, so it covers the large slot;
    //   it letterboxes in a square, which is why a dedicated square export
    //   (192²/512², opaque background, `purpose: "maskable"`) is still needed.
    // `ftesMiniDarkMobile.png` is deliberately NOT used here: it is a pure-white
    // mark on transparency, so Android's adaptive-icon backplate would render it
    // white-on-white (invisible).
    icons: [
        {
            src: "/logo/LogoFtestMini.png",
            sizes: "80x80",
            type: "image/png",
            purpose: "any",
        },
        {
            src: "/logo/FTES_original.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
        },
    ],
})

export default manifest
