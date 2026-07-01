import type { ProfileTab } from "@/hooks/zustand/profileTab/store"

/** Re-export the canonical tab union (owned by the shared tab store). */
export type { ProfileTab }

/**
 * Tabs rendered in order, left to right (id + i18n label key suffix under
 * `publicProfile.tabs.*`). "Projects" (verified capstone work) leads, then
 * "Challenges" (graded-challenge repo proof); "Skills" holds coding-practice
 * (judge) stats; "Activity" absorbs achievements, joined courses, and the timeline.
 */
export const PROFILE_TABS: ReadonlyArray<ProfileTab> = [
    "overview",
    "projects",
    "challenges",
    "skills",
    "activity",
]
