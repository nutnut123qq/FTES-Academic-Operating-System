import { defineRouting } from "next-intl/routing"

/**
 * i18n routing + locale cookie for middleware (`createMiddleware`).
 * `localeCookie`: persist chosen locale across visits (server-readable; not localStorage).
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
        /** The secure of the cookie. */
        secure: true,
        /** The same site of the cookie. */
        sameSite: "none",
        /** The domain of the cookie. */
        domain: ".academy.starci.org"
    },
})