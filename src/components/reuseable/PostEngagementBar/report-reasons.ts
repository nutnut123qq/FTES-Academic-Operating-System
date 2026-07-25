/**
 * Reason codes accepted by the BE report endpoint (`POST /api/v1/community/reports`).
 *
 * MUST stay in sync with `ModerationService.REASON_CODES` — anything else is
 * rejected with `COMMUNITY_INVALID_REASON` (400), so the picker only ever offers
 * these five.
 */
export const REPORT_REASON_CODES = [
    "SPAM",
    "HARASSMENT",
    "NSFW",
    "MISINFORMATION",
    "OTHER",
] as const

/** One of the BE-accepted report reason codes. */
export type ReportReasonCode = (typeof REPORT_REASON_CODES)[number]

/** Target kinds the report endpoint accepts (`REPORT_TARGET_TYPES` server-side). */
export type ReportTargetType = "POST" | "COMMENT" | "USER"
