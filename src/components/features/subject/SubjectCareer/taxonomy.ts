/**
 * The career module's closed token sets, as the DATABASE constrains them.
 *
 * `career.skills.category`, `career.roadmaps.track` and `career.opportunities.type` all
 * carry CHECK constraints (migration V120), so these are not free-text fields: an unlisted
 * value is a constraint violation, not a new option. Anything the reader sees is one of
 * these tokens, so the same lists drive both the labels and the authoring pickers.
 */

/** `career.skills.category` — CHECK (V120). */
export const SKILL_CATEGORIES = [
    "LANGUAGE",
    "FRAMEWORK",
    "DATABASE",
    "DEVOPS",
    "SOFT_SKILL",
    "CS_FOUNDATION",
    "TOOL",
    "DOMAIN",
] as const

/** `career.roadmaps.track` — CHECK (V120). The column is nullable (a roadmap may have none). */
export const ROADMAP_TRACKS = [
    "BACKEND",
    "FRONTEND",
    "MOBILE",
    "AI",
    "DATA",
    "DEVOPS",
] as const

/** `career.opportunities.type` — CHECK (V120). */
export const OPPORTUNITY_TYPES = ["INTERNSHIP", "JOB", "PORTFOLIO_REVIEW"] as const

/** Maps a BE opportunity `type` to its `career.opportunityTypes.*` i18n key. */
export const OPPORTUNITY_TYPE_KEY: Record<string, string> = {
    INTERNSHIP: "internship",
    JOB: "job",
    PORTFOLIO_REVIEW: "portfolioReview",
}
