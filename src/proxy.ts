import createMiddleware from "next-intl/middleware"
import {
    NextResponse,
    type NextRequest,
} from "next/server"
import {routing} from "@/i18n/routing"

/** next-intl locale negotiation + redirect middleware. */
const intlMiddleware = createMiddleware(routing)

/**
 * Server-readable "is logged in" signal — ⚠️ NOTHING SETS IT. Treat `has(...)` below
 * as permanently FALSE in every real browser.
 *
 * Inherited from StarCi (arrived in `6de7d46`, the pre-strip backup). There, the BE
 * issued this cookie beside the refresh token at parent-domain scope
 * (`.academy.starci.org`) so it reached the frontend host. FTES never built that half,
 * and cannot reuse it as-is:
 * - `FTES-AOS-Backend` sets no cookie at all — no `ResponseCookie`, no `Set-Cookie`.
 * - The FTES frontend is deployed on `*.vercel.app` while the API is `apitest.ftes.vn`.
 *   `vercel.app` is on the Public Suffix List, so a cookie from the API domain can
 *   never be sent here — no backend change alone can fix this.
 *
 * Verified on production 2026-08-12: `/vi/dashboard` and `/vi/admin` answer 307 → `/vi`
 * without the cookie and 200 with it, so the mechanism works exactly as written — it
 * just never receives its input. `/admin` has therefore been unreachable since the
 * strip (`12c485b`); it stays listed because failing CLOSED on an admin surface is the
 * safe direction, and the real admin console is a separate app.
 *
 * ⚠️ `e2e/helpers/auth.ts` injects this cookie into every Playwright context, so the
 * whole e2e suite passes while real users are bounced. A green suite proves nothing
 * about this gate.
 *
 * Before adding ANY path to {@link PROTECTED_PATTERNS}, make something set this cookie
 * on the frontend origin (or gate in the page instead). It only picks the first-paint
 * shell; the SPA re-verifies the real session on mount, so it is never authorization.
 */
const AUTH_SIGNAL_COOKIE = "session_hint"

/**
 * Strips an optional leading locale segment (`/en` or `/vi`) so a path can be
 * matched against locale-agnostic patterns. `localePrefix` is unset (next-intl
 * default), so the default locale may be unprefixed (`/dashboard`) while `en` is
 * prefixed (`/en/dashboard`); both must reduce to the same `/dashboard`.
 *
 * @param pathname - the incoming pathname (may or may not carry a locale prefix)
 * @returns the pathname without its locale prefix (never empty — `/` at minimum)
 */
const stripLocale = (pathname: string): string =>
    pathname.replace(/^\/(?:en|vi)(?=\/|$)/, "") || "/"

/**
 * Login-gated areas (matched AFTER locale strip). Fail-OPEN: anything not listed
 * here is public. A visitor without an active session ({@link AUTH_SIGNAL_COOKIE})
 * hitting one of these is bounced to the ungated landing before any HTML renders.
 *
 * Notes:
 * - `/profile` is gated only for the OWNER surfaces (bare `/profile`, `/profile/cv`,
 *   `/profile/settings/*`). A username profile (`/profile/<username>`) stays public
 *   so a logged-out recruiter can view it.
 * - Only the `/learn` shell of a course is gated — the course detail/sales page
 *   (`/courses/<id>`) stays public. Learn needs LOGIN even for the trial preview
 *   (enrollment is optional, an authenticated session is not).
 * - Public content reader (`/contents/<id>`), blog, courses catalog, community,
 *   practice, talents, headhunting, league/kpi/etc. are intentionally NOT listed.
 * - `/dashboard` is deliberately NOT listed, even though every widget on it is
 *   session-scoped. It WAS listed for a day (cca21d4) and that took the page down for
 *   EVERYONE: {@link AUTH_SIGNAL_COOKIE} never reaches this frontend, so the check
 *   below is false for signed-in visitors too and they were bounced in silence — no
 *   login prompt, no error. Do not re-add it unless something actually sets that
 *   cookie. The concern that motivated the gate is real (a guest reads five empty
 *   states as fact) but belongs IN THE PAGE as a "sign in to see this" state, not at
 *   the edge, where a missing cookie cannot be told apart from a missing session.
 */
const PROTECTED_PATTERNS: RegExp[] = [
    /^\/admin(?:\/|$)/,
]

/**
 * @param pathname - the incoming pathname (locale prefix optional)
 * @returns `true` when the path is a login-gated area (see {@link PROTECTED_PATTERNS}).
 */
const isProtectedPath = (pathname: string): boolean => {
    const path = stripLocale(pathname)
    return PROTECTED_PATTERNS.some((pattern) => pattern.test(path))
}

/**
 * Resolves the locale to use for a server-side redirect: the locale already in the
 * URL, else the persisted `LOCALE` cookie, else the configured default.
 *
 * @param request - the incoming edge request
 * @param urlLocale - the locale captured from the pathname (if any)
 * @returns the resolved locale segment
 */
const resolveLocale = (request: NextRequest, urlLocale?: string): string =>
    urlLocale
    ?? request.cookies.get("LOCALE")?.value
    ?? routing.defaultLocale

/**
 * Edge middleware (Next.js 16 `proxy` convention).
 *
 * ONE-WAY auth routing, decided purely from the edge-readable session signal
 * ({@link AUTH_SIGNAL_COOKIE}) — the SPA still re-verifies the real session on
 * mount, so this is never trusted for authorization, only first-paint shell:
 * a logged-OUT visitor on a protected area is bounced to the ungated landing
 * before any protected HTML renders. Everything else falls through to the
 * next-intl locale middleware unchanged.
 *
 * The mirror rule — logged-IN visitor on the landing → their dashboard — is NOT
 * here and must not be added: {@link AUTH_SIGNAL_COOKIE} is never set, so the
 * check would read "logged out" for everyone and the branch would be dead.
 *
 * It does not live anywhere else either. It ran in the landing page itself for a
 * while and was REMOVED on 2026-08-21 (see the {@link
 * import("@/components/features/home-landing/HomeLanding").HomeLanding} docblock):
 * the page cannot tell "just signed in" from "deliberately opened the home page", so
 * it locked signed-in visitors out of the landing entirely. If the rule is ever wanted
 * again, put it on the SIGN-IN EVENT — not here, and not on the page.
 *
 * @param request - the incoming edge request
 * @returns a redirect, or the next-intl response
 */
export default function proxy(request: NextRequest) {
    const {pathname} = request.nextUrl
    const isAuthed = request.cookies.has(AUTH_SIGNAL_COOKIE)

    // Logged-out → keep out of protected areas (bounce to the landing root).
    if (!isAuthed && isProtectedPath(pathname)) {
        const urlLocale = pathname.match(/^\/(en|vi)(?=\/|$)/)?.[1]
        const locale = resolveLocale(request, urlLocale)
        const url = request.nextUrl.clone()
        url.pathname = `/${locale}`
        return NextResponse.redirect(url)
    }

    return intlMiddleware(request)
}

export const config = {
    // Match all pathnames except for
    // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
}
