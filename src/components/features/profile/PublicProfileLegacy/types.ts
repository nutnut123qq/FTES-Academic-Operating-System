/** The profile tabs (drives the panel switch). */
export type ProfileTab =
    | "overview"
    | "projects"
    | "skills"
    | "activity"

/**
 * Tabs rendered in order, left to right (id + i18n label key suffix).
 *
 * Consolidated from seven to four so the strip stays scannable: the verified
 * "Projects" flex sits up front, "Skills" folds in coding stats, and "Activity"
 * absorbs the achievements wall, joined courses, and the activity timeline.
 */
export const PROFILE_TABS: ReadonlyArray<ProfileTab> = [
    "overview",
    "projects",
    "skills",
    "activity",
]
