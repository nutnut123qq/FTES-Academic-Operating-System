import React from "react"
import { HomeLanding } from "@/components/features/home-landing/HomeLanding"

/**
 * `/[locale]/home` — the marketing landing at its explicit, UNGATED url. The proxy
 * never bounces `/home`, and `pathConfig().home()` + the navbar Logo target it, so
 * this route must exist (the strip refactor 12c485b dropped it while the landing was
 * moved to the locale root).
 *
 * Same landing component as the locale root, differing in EXACTLY one thing: this route
 * does NOT pass `redirectSignedIn`, so a signed-in visitor reading `/vi/home` stays on
 * the landing instead of being bounced to the dashboard. The redirect asked for by góp ý
 * #23 lives on the locale root alone — `/home` is the explicit "show me the home page"
 * url, and bouncing it left signed-in users (and the navbar logo) with no way in at all.
 */
const Page = () => <HomeLanding />

export default Page
