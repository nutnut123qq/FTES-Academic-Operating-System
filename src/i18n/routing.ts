import { defineRouting } from "next-intl/routing"

/**
 * i18n routing + locale cookie for middleware (`createMiddleware`).
 * `localeCookie`: persist chosen locale across visits (server-readable; not localStorage).
 *
 * **Do NOT pin `domain` again (fixed 2026-08-20).** This config used to carry
 * `domain: ".academy.starci.org"` — leftover from the StarCi skeleton this app was
 * stripped from. FTES never runs on that host, and a browser DROPS any `Set-Cookie`
 * whose `Domain` does not cover the host being visited, so the LOCALE cookie was never
 * written ANYWHERE: not on localhost, not on Vercel previews, not in production. The
 * language switch appeared to work only because the URL prefix carried the locale; the
 * choice never survived a visit to a locale-less entry point. Omitting `domain`
 * entirely makes the cookie host-only, which is correct on every host at once — a
 * hardcoded domain would have to be re-edited per environment and would silently fail
 * again the moment it drifts.
 *
 * `sameSite: "lax"` and a production-only `secure` are the same bug in a second form:
 * `sameSite: "none"` REQUIRES `Secure`, and `Secure` cookies are dropped over plain
 * `http://localhost`, so the old pair killed the cookie in development on its own. This
 * cookie is only read for first-party navigation (which locale to serve), so there is
 * no cross-site case that would justify "none".
 *
 * @see https://next-intl.dev/docs/routing/configuration#localecookie
 */
export const routing = defineRouting({
    locales: ["en", "vi"],
    defaultLocale: "vi",
    localeCookie: {
        /** The name of the cookie. */
        name: "LOCALE",
        /** The max age of the cookie. */
        maxAge: 60 * 60 * 24 * 365,
        /** The path of the cookie. */
        path: "/",
        /** HTTPS-only in production; on `http://localhost` `Secure` drops the cookie. */
        secure: process.env.NODE_ENV === "production",
        /** First-party navigation only — "none" would force `Secure` and break dev. */
        sameSite: "lax",
    },
})
