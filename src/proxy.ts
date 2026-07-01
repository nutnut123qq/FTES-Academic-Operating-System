import createMiddleware from "next-intl/middleware"
import {
    NextResponse,
    type NextRequest,
} from "next/server"
import {routing} from "@/i18n/routing"

/** next-intl locale negotiation + redirect middleware. */
const intlMiddleware = createMiddleware(routing)

/**
 * Server-readable "is logged in" signal.
 *
 * The HttpOnly `keycloak_refresh_token` is host-only on the API host, so the FE
 * edge cannot see it. The BE therefore issues a parallel, JS-readable `session_hint`
 * cookie alongside the refresh token — same lifetime, parent-domain scope
 * (`.academy.starci.org`) — so it reaches this FE host. It exists exactly while a
 * refresh session is active. It only decides which shell to show first; the SPA
 * still verifies the real session (token refresh) once the page mounts, so it is
 * never trusted for authorization.
 */
const AUTH_SIGNAL_COOKIE = "session_hint"

/**
 * Matches the marketing root only: `/`, `/vi`, `/en` (with optional trailing
 * slash). These are the paths a logged-in visitor should be bounced away from,
 * GitHub-style. Deeper marketing pages (e.g. `/vi/home`) are intentionally NOT
 * matched, so a signed-in user can still open the landing page on purpose.
 */
const HOME_ROOT_PATH = /^\/(?:(en|vi)\/?)?$/

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
 */
const PROTECTED_PATTERNS: RegExp[] = [
    /^\/dashboard(?:\/|$)/,
    /^\/admin(?:\/|$)/,
    /^\/checkout(?:\/|$)/,
    /^\/profile(?:$|\/cv(?:\/|$)|\/settings(?:\/|$))/,
    /^\/courses\/[^/]+\/learn(?:\/|$)/,
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
 * Two-way auth routing, decided purely from the edge-readable session signal
 * ({@link AUTH_SIGNAL_COOKIE}) — the SPA still re-verifies the real session on
 * mount, so this is never trusted for authorization, only first-paint shell:
 * 1. Logged-in visitor on the marketing root → bounced to their dashboard
 *    (GitHub-style, zero landing flash).
 * 2. Logged-OUT visitor on a protected area → bounced to the ungated landing
 *    (`/home`) before any protected HTML renders.
 * Everything else falls through to the next-intl locale middleware unchanged.
 *
 * @param request - the incoming edge request
 * @returns a redirect, or the next-intl response
 */
export default function proxy(request: NextRequest) {
    const {pathname} = request.nextUrl
    const isAuthed = request.cookies.has(AUTH_SIGNAL_COOKIE)
    const homeMatch = pathname.match(HOME_ROOT_PATH)

    // (1) Logged-in → keep away from the marketing root.
    if (isAuthed && homeMatch) {
        const locale = resolveLocale(request, homeMatch[1] ?? undefined)
        const url = request.nextUrl.clone()
        url.pathname = `/${locale}/dashboard`
        return NextResponse.redirect(url)
    }

    // (2) Logged-out → keep out of protected areas.
    if (!isAuthed && isProtectedPath(pathname)) {
        const urlLocale = pathname.match(/^\/(en|vi)(?=\/|$)/)?.[1]
        const locale = resolveLocale(request, urlLocale)
        const url = request.nextUrl.clone()
        url.pathname = `/${locale}/home`
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
