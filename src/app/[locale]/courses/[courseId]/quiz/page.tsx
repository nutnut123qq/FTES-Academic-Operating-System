import { redirect } from "next/navigation"

/** Route params for the legacy quiz route. */
interface LegacyQuizRouteParams {
    locale: string
    courseId: string
}

/**
 * Legacy `/courses/[courseId]/quiz` — the standalone quiz surface has moved into
 * the learn shell. Redirect old deep-links to the content dashboard so bookmarks
 * keep working instead of 404-ing.
 */
const Page = async ({ params }: { params: Promise<LegacyQuizRouteParams> }) => {
    const { locale, courseId } = await params
    redirect(`/${locale}/courses/${courseId}/learn/content`)
}

export default Page
