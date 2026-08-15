import React, { cache } from "react"
import type { Metadata } from "next"
import { SubjectOverview } from "@/components/features/subject/SubjectOverview"
import { getSubjectDetail, type SubjectDetail } from "@/modules/api/rest/subject"
import { buildPageMetadata } from "@/modules/seo/buildMetadata"

/** Route params for `/[locale]/subjects/[subjectId]`. */
interface SubjectParams {
    /** Active locale segment. */
    locale: string
    /** Subject CODE from the URL (e.g. `CSD201`) — the BE path variable, not a uuid. */
    subjectId: string
}

/**
 * Subject fetch by code, memoized per request. The endpoint is public, so the
 * tokenless server-side call returns exactly the visitor projection. Null on any
 * failure → the workspace still renders and shows its own empty state.
 */
const getSubject = cache(async (code: string): Promise<SubjectDetail | null> => {
    try {
        return await getSubjectDetail(code)
    } catch {
        return null
    }
})

/**
 * Per-subject SEO + share metadata (title / description / canonical + hreflang /
 * OG + Twitter card with the subject cover), so a pasted subject-workspace link
 * unfurls as the subject instead of the generic site card.
 */
export const generateMetadata = async ({
    params,
}: {
    params: Promise<SubjectParams>
}): Promise<Metadata> => {
    const { locale, subjectId } = await params
    const subject = await getSubject(subjectId)
    if (!subject) {
        return {}
    }
    const name = locale === "vi" ? subject.nameVi || subject.name : subject.name || subject.nameVi
    const cover = subject.imageUrl || subject.thumbnailUrl
    const description = subject.description?.replace(/\s+/g, " ").trim()
    return buildPageMetadata({
        path: `/subjects/${subjectId}`,
        locale,
        title: `${subject.code} — ${name}`,
        description: description || undefined,
        images: cover ? [cover] : undefined,
    })
}

/** `/subjects/[subjectId]` — subject-workspace Overview tab (community hub). */
const Page = () => <SubjectOverview />

export default Page
