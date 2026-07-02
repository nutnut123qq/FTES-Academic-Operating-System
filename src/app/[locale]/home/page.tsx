import React from "react"
import { HomeLanding } from "@/components/features/home-landing/HomeLanding"

/**
 * `/[locale]/home` — the marketing landing at its explicit, UNGATED url. The proxy
 * never bounces `/home`, and `pathConfig().home()` + the navbar Logo target it, so
 * this route must exist (the strip refactor 12c485b dropped it while the landing was
 * moved to the locale root). Renders the same landing as the root.
 */
const Page = () => <HomeLanding />

export default Page
