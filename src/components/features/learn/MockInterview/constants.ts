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
