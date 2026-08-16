/**
 * The ONE resolution rule for the human label of a gamification badge. Pure (no
 * React, no next-intl import) so it can be unit-tested directly and reused by
 * every surface that paints a badge: the profile identity card, the profile
 * Progress grid, the leaderboard badge row and the leaderboard guide.
 *
 * Milestones are DATA — rows the backend seeds, not a fixed enum in code. Codes
 * such as `FIRST_ENROLL` / `STREAK_3` / `FIRST_COMMENT` / `FIRST_POST` are being
 * awarded today and exist nowhere in the frontend, so a call site that renders
 * `t("gamification.milestones.<CODE>.name")` unguarded paints the raw key path
 * on the profile the moment anyone adds a row. The frontend can therefore never
 * guarantee i18n coverage, and the fallback chain — not a hardcoded list of
 * "known" codes — is what keeps a key path off the screen.
 */

/**
 * The `gamification.milestones` slice of a locale catalog, as a soft probe.
 *
 * Deliberately a tiny structural type instead of the next-intl translator: the
 * lookup is a *soft* `has`-guarded probe (a missing entry is a normal, expected
 * outcome — not an error), and keeping the shape minimal is what lets the tests
 * exercise the precedence with a plain object.
 */
export interface MilestoneCatalog {
    /** `true` when the active locale ships a curated name at `<CODE>.name`. */
    has: (key: string) => boolean
    /** The curated name at `<CODE>.name`. Only called when {@link has} passed. */
    get: (key: string) => string
}

/**
 * Last-resort readable label for a badge code nothing has a name for —
 * `"FIRST_ENROLL"` → `"First Enroll"`. Never returns the raw code, never a key.
 */
export const humanizeBadgeCode = (code: string): string =>
    code
        .split("_")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ")

/**
 * Resolves what a badge should read as, in strict precedence:
 *
 *   1. the CURATED translation at `gamification.milestones.<CODE>.name` — the
 *      hand-written, localized name for a milestone the app knows about;
 *   2. else the name the BACKEND sent with the award (`BadgeView.name`), which
 *      is correct for any data-driven milestone the catalog has not caught up
 *      with — vastly better than a key path;
 *   3. else the humanized code, so a raw `gamification.milestones.…` path can
 *      never reach a user's screen.
 *
 * @param catalog - soft probe over the `gamification.milestones` namespace.
 * @param code - the backend badge `code` (`badgeKey`).
 * @param backendName - `BadgeView.name` when the caller has one (the profile /
 *   leaderboard snapshots carry it as `fallbackName`); absent for the guide
 *   page, which lists milestones from a static table and never fetched a badge.
 * @returns A human-readable label; `""` only when there is no code at all.
 */
export const resolveBadgeLabel = (
    catalog: MilestoneCatalog,
    code: string | null | undefined,
    backendName?: string | null,
): string => {
    const trimmedCode = (code ?? "").trim()
    const fromBackend = (backendName ?? "").trim()
    if (!trimmedCode) {
        return fromBackend
    }
    const key = `${trimmedCode}.name`
    if (catalog.has(key)) {
        return catalog.get(key)
    }
    return fromBackend || humanizeBadgeCode(trimmedCode)
}
