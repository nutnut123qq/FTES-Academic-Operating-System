/** How the compact credit label beside the grade picker should render. */
export enum GradeCreditDisplayKind {
    /** BYOK lane — static label only. */
    Byok = "byok",
    /** Auto/Premium — `used/quota` usage line. */
    Usage = "usage",
    /** Cannot afford the next grading run in a rolling window. */
    QuotaReached = "quotaReached",
    /** Data still loading or unavailable. */
    Hidden = "hidden",
}

/** Resolved credit label for a submission row. */
export interface GradeCreditDisplay {
    /** Render branch. */
    kind: GradeCreditDisplayKind
    /** Localized text when {@link GradeCreditDisplayKind.Usage} or BYOK. */
    text?: string
}
