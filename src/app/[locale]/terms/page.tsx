import React from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { LegalPage } from "@/components/features/legal/LegalPage"
import { buildPageMetadata } from "@/modules/seo/buildMetadata"

/** Route params for `/[locale]/terms`. */
interface TermsParams {
    /** Active locale segment. */
    locale: string
}

/** Per-locale terms-of-service metadata, reusing the `legal.terms.*` copy. */
export const generateMetadata = async ({
    params,
}: {
    params: Promise<TermsParams>
}): Promise<Metadata> => {
    const { locale } = await params
    const t = await getTranslations({ locale })
    return buildPageMetadata({
        path: "/terms",
        locale,
        title: t("legal.terms.title"),
        description: t("legal.terms.description"),
    })
}

/**
 * Route `/[locale]/terms` — terms of service. Thin route file: mounts the shared
 * legal feature, no logic/UI here.
 */
const Page = () => {
    return <LegalPage kind="terms" />
}

export default Page
