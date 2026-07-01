import React from "react"
import type { Metadata } from "next"
import { Landing } from "@/components/features/landing/Landing"
import { JsonLd, organizationSchema, websiteSchema } from "@/modules/seo/jsonLd"
import { buildPageMetadata } from "@/modules/seo/buildMetadata"

/** Route params for `/[locale]/home`. */
interface HomeParams {
    /** Active locale segment. */
    locale: string
}

/** Per-locale landing metadata (canonical + hreflang + share card). */
export const generateMetadata = async ({
    params,
}: {
    params: Promise<HomeParams>
}): Promise<Metadata> => {
    const { locale } = await params
    return buildPageMetadata({ path: "/home", locale })
}

/**
 * Marketing landing page at an explicit URL.
 *
 * The root `/` is GitHub-style gated (logged-in users are redirected to the
 * dashboard). This `/home` route renders the same landing page but is NOT gated,
 * so a signed-in user can still revisit the marketing page on purpose. Emits
 * Organization + WebSite JSON-LD for brand rich results.
 *
 * @param props.params - the awaited `[locale]` route params.
 */
const Page = async ({
    params,
}: {
    params: Promise<HomeParams>
}) => {
    const { locale } = await params
    return (
        <>
            <JsonLd data={[organizationSchema(), websiteSchema(locale)]} />
            <Landing />
        </>
    )
}

export default Page
