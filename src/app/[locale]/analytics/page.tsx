import { redirect } from "next/navigation"

/** Route params for the legacy `/analytics` route. */
interface LegacyAnalyticsRouteParams {
    locale: string
}

/**
 * Legacy `/analytics` — the learning cockpit moved to `/dashboard`, which serves the
 * same Overview content plus the Explore / Courses / Community tabs. Redirect old
 * deep-links so bookmarks keep working instead of landing on a second, narrower copy.
 *
 * The `AnalyticsDashboard` component is intentionally KEPT: the dashboard Overview tab
 * reuses its `DashboardIdentity`, `ContinueLearning`, `DailyQuest` and `StreakStrip`
 * widgets, so deleting it would take those with it.
 */
const Page = async ({ params }: { params: Promise<LegacyAnalyticsRouteParams> }) => {
    const { locale } = await params
    redirect(`/${locale}/dashboard`)
}

export default Page
