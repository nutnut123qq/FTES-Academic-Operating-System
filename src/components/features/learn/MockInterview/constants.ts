/** Verdict → HeroUI Chip color. */
export const VERDICT_COLOR: Record<string, "success" | "warning" | "danger" | "default"> = {
    PASS: "success",
    BORDERLINE: "warning",
    FAIL: "danger",
}

/** Verdict → stats bar background token. */
export const VERDICT_BAR: Record<string, string> = {
    PASS: "bg-success",
    BORDERLINE: "bg-warning",
    FAIL: "bg-danger",
}

/** Fixed display order for verdicts. */
export const VERDICT_ORDER: Array<string> = ["PASS", "BORDERLINE", "FAIL"]

/**
 * Stand-in error for "the course detail never resolved, so `courseRef` is blank".
 *
 * The read hooks gate their SWR key on `courseRef`, so a blank ref means the request is never
 * made and NEITHER `data` nor `error` will ever arrive. Panels that judged loading purely by
 * `!data && !error` therefore span forever whenever the course-detail request failed. Handing
 * `AsyncContent` this error instead turns that dead end into the normal error + retry state.
 */
export const COURSE_UNRESOLVED = new Error("mock-interview: course detail unresolved")
