import { redirect } from "next/navigation"

/** Route params for the `[locale]` segment of this page. */
interface RegisterRouteParams {
    /** Active locale code resolved from the URL (e.g. `vi`, `en`). */
    locale: string
}

/**
 * Route `/[locale]/authentication/register` — NO page renders here anymore
 * (spec `auth-flows-mock`: sign-up lives exclusively in the `AuthenticationModal`
 * SignUp tab). Legacy/bookmarked links keep working: redirect to the locale home
 * with the `?auth=signup` deep link so the modal opens on the SignUp tab.
 */
const Page = async ({ params }: { params: Promise<RegisterRouteParams> }) => {
    const { locale } = await params
    redirect(`/${locale}?auth=signup`)
}

export default Page
