import React from "react"
import type { Metadata } from "next"
import { SystemStatus } from "@/components/layouts/status/SystemStatus"
import { buildPageMetadata } from "@/modules/seo/buildMetadata"

/** Route params for `/[locale]/status`. */
interface StatusParams {
    /** Active locale segment. */
    locale: string
}

/** Per-locale status-page metadata (canonical + hreflang + share card). */
export const generateMetadata = async ({
    params,
}: {
    params: Promise<StatusParams>
}): Promise<Metadata> => {
    const { locale } = await params
    return buildPageMetadata({
        path: "/status",
        locale,
        title: locale === "vi" ? "Trạng thái hệ thống" : "System status",
    })
}

/**
 * Route `/[locale]/status` — PUBLIC "build in public" system status page. No
 * auth / admin gate. Thin route file: only mounts the feature, no logic/UI here.
 */
const Page = () => {
    return <SystemStatus />
}

export default Page
