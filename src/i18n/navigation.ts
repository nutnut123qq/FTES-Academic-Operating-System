import {
    createNavigation
} from "next-intl/navigation"
import {
    routing
} from "./routing"
 
/**
 * Locale-aware navigation APIs — the `next-intl` wrappers around Next.js'
 * navigation that understand the routing configuration.
 *
 * **CONTRACT: everything exported here ADDS the active locale itself.**
 * Every href / path handed to `Link`, `redirect`, `permanentRedirect`,
 * `useRouter().push|replace` or `getPathname` from THIS module must therefore be
 * locale-LESS (`/quests`, `/community/new`). The APIs also strip the locale on the
 * way out, so `usePathname()` here returns a locale-less pathname — compare it
 * against locale-less paths only.
 *
 * Passing a path that already carries a locale double-prefixes it (`/vi/vi/quests`),
 * which is a real 404, not a cosmetic glitch. Unit tests do not catch this: they
 * mock this module and swap `Link` for a plain `<a href>`, so the second prefix
 * never appears. This regressed in five places at once (quest board CTAs, the
 * dashboard quest widget, the leaderboard ⇄ guide pair) — hence this note.
 *
 * With `pathConfig()` (`@/resources/path`) the switch is the `.locale()` argument:
 *  - `pathConfig().locale()` → locale-less path → use with THIS module.
 *  - `pathConfig().locale(locale)` → `/vi/...` → use with `next/link` /
 *    `next/navigation`, or for absolute share/canonical URLs.
 *
 * Need an href that already contains the locale (absolute share URL, SEO canonical,
 * a `router.push` reaching a locale you computed yourself)? Import from
 * `next/link` / `next/navigation` instead — those add nothing.
 *
 * To switch the active locale, do NOT rebuild the path: call
 * `useRouter().replace(pathname, { locale })` with the option, the documented
 * next-intl way (see `LanguageDropdown`).
 */
export const {
    Link,
    redirect,
    permanentRedirect,
    usePathname,
    useRouter,
    getPathname
} = createNavigation(routing)