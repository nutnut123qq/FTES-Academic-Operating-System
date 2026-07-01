/**
 * Learning tier of a module, shared across every course (GraphQL / DB enum).
 * Stored explicitly on the module; drives the tier-based paywall + UI badge.
 */
export enum CourseContentTier {
    /** Entry-level material — always free. */
    Foundation = "foundation",
    /** Mid-level material — the later half is premium. */
    Intermediate = "intermediate",
    /** Advanced material — always premium. */
    Advanced = "advanced",
}
