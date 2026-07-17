import { redirect } from "next/navigation"

/** Route params for the legacy assignments route. */
interface LegacyAssignmentsRouteParams {
    locale: string
    courseId: string
}

/**
 * Legacy `/courses/[courseId]/assignments` — the standalone assignments surface has
 * moved into the learn shell. Redirect old deep-links to the content dashboard so
 * bookmarks keep working instead of 404-ing.
 */
const Page = async ({ params }: { params: Promise<LegacyAssignmentsRouteParams> }) => {
    const { locale, courseId } = await params
    redirect(`/${locale}/courses/${courseId}/learn/content`)
}

export default Page
