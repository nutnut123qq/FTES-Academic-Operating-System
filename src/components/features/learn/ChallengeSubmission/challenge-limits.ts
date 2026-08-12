/**
 * Pure mappers for the two BUDGETS a challenge detail now reports
 * (BE contract `challenge-testcase-samples`):
 *
 * - the RESOURCE limits one submission must fit (`timeLimitMs` / `memoryLimitMb`, the max
 *   across the challenge's test cases) — shown beside the problem statement;
 * - the AI-FEEDBACK allowance (`aiFeedbackLimit` / `aiFeedbackUsed`) — shown near the submit
 *   surface.
 *
 * Both are additive and nullable: an older deployment (or a challenge with no test cases)
 * reports nothing, and the view then renders nothing rather than a "0" that reads as a real
 * budget. Numbers only — the units and wording stay in i18n.
 */

/**
 * One renderable piece of the "Giới hạn: 2s · 256MB" line. The KIND picks the i18n key, the
 * VALUE fills it — so the unit text ("s" / "ms" / "MB") lives in the messages, not here.
 */
export type ChallengeLimitPart =
    /** A whole-second time budget, e.g. `2` → "2s". */
    | { kind: "timeSeconds", value: number }
    /** A sub-second / non-round time budget, e.g. `1500` → "1500ms". */
    | { kind: "timeMs", value: number }
    /** A memory budget in megabytes, e.g. `256` → "256MB". */
    | { kind: "memoryMb", value: number }

/**
 * Turns the reported resource limits into the parts of the learner-facing limit line.
 *
 * A time budget that is a whole number of seconds reads as seconds (the HackerRank
 * convention — "2s" beats "2000ms"); anything else stays in milliseconds. A limit that is
 * absent, null, non-finite or not strictly positive is DROPPED — an empty result means the
 * caller renders no limit line at all.
 *
 * @param timeLimitMs - Wall-clock budget in milliseconds, as reported by the BE.
 * @param memoryLimitMb - Memory budget in megabytes, as reported by the BE.
 * @returns The parts to render, in reading order (time then memory); empty when none apply.
 */
export const resolveChallengeLimitParts = (
    timeLimitMs: number | null | undefined,
    memoryLimitMb: number | null | undefined,
): Array<ChallengeLimitPart> => {
    const parts: Array<ChallengeLimitPart> = []
    if (typeof timeLimitMs === "number" && Number.isFinite(timeLimitMs) && timeLimitMs > 0) {
        parts.push(
            timeLimitMs % 1000 === 0
                ? { kind: "timeSeconds", value: timeLimitMs / 1000 }
                : { kind: "timeMs", value: timeLimitMs },
        )
    }
    if (typeof memoryLimitMb === "number" && Number.isFinite(memoryLimitMb) && memoryLimitMb > 0) {
        parts.push({ kind: "memoryMb", value: memoryLimitMb })
    }
    return parts
}

/** The learner's AI-feedback allowance on one challenge. */
export interface AiFeedbackAllowance {
    /** How many attempts the mentor granted (always ≥ 1 once an allowance exists). */
    limit: number
    /** How many are already spent, clamped into `0..limit`. */
    used: number
    /** How many are left — `0` means the AI stops commenting, NOT that submitting stops. */
    remaining: number
    /** True when nothing is left. */
    exhausted: boolean
}

/**
 * Reads the AI-feedback allowance off a challenge detail. Returns `null` — "say nothing" —
 * whenever the BE reports no usable limit (absent field on an older deployment, null, or a
 * non-positive value): the learner must not be told "0 lượt" when the truth is "unknown".
 *
 * `used` is clamped into `0..limit` so a BE that already counted an extra attempt (or a
 * mentor who lowered the limit after the fact) can never produce a negative remainder.
 *
 * @param limit - `aiFeedbackLimit` from the challenge detail.
 * @param used - `aiFeedbackUsed` from the challenge detail; nullish reads as none used.
 * @returns The allowance to render, or `null` when there is nothing trustworthy to show.
 */
export const resolveAiFeedbackAllowance = (
    limit: number | null | undefined,
    used: number | null | undefined,
): AiFeedbackAllowance | null => {
    if (typeof limit !== "number" || !Number.isFinite(limit) || limit <= 0) {
        return null
    }
    const spent = typeof used === "number" && Number.isFinite(used) && used > 0 ? used : 0
    const clampedUsed = Math.min(Math.floor(spent), Math.floor(limit))
    const clampedLimit = Math.floor(limit)
    const remaining = clampedLimit - clampedUsed
    return {
        limit: clampedLimit,
        used: clampedUsed,
        remaining,
        exhausted: remaining <= 0,
    }
}
