/**
 * SM-2 recall grades for the flashcard reviewer — a faithful port of StarCI's
 * `features/learn/Flashcards/constants`. StarCI keeps the four grades in a shared
 * constant so every reviewer surface (deck review + due review) maps the same grade
 * value → label → next-interval preview. FTES has no `reviewFlashcard` backend, so
 * the interval per grade is computed client-side from a lightweight SM-2 model
 * ({@link nextIntervalDays}) instead of coming from the server.
 */

/** One SM-2 recall grade option: its grade value + the i18n key for its label. */
export interface Sm2GradeConfig {
    /** SM-2 grade (0 = Again, 1 = Hard, 2 = Good, 3 = Easy). Higher = better recall. */
    grade: number
    /** i18n key (under `subjects.aiTools.flashcards.rating`) for the button label. */
    labelKey: string
    /**
     * Tone classes for the grade button — static so Tailwind keeps them. Mirrors
     * StarCI's per-grade colouring (weakest recall = danger → strongest = success).
     */
    tone: string
}

/**
 * The four SM-2 recall grades, weakest recall first (mirrors StarCI's `SM2_GRADES`).
 * Grade values are stable (0..3) so the interval model can index off them.
 */
export const SM2_GRADES: ReadonlyArray<Sm2GradeConfig> = [
    { grade: 0, labelKey: "again", tone: "border-danger/40 text-danger hover:bg-danger/10" },
    { grade: 1, labelKey: "hard", tone: "border-warning/40 text-warning hover:bg-warning/10" },
    { grade: 2, labelKey: "good", tone: "border-accent/40 text-accent hover:bg-accent/10" },
    { grade: 3, labelKey: "easy", tone: "border-success/40 text-success hover:bg-success/10" },
]

/**
 * A lightweight SM-2 interval model. StarCI's backend previews the *next* interval
 * per grade from the card's current repetition state; with no backend here we derive
 * it from how many times the card has been graded "Good/Easy" so far (`streak`) — so
 * the interval visibly grows as a card is repeatedly recalled, the way SM-2 does.
 *
 * - Again (0) → resets: review within the same session (< 1 min).
 * - Hard (1)  → 1 day (holds the card near, regardless of streak).
 * - Good (2)  → 1 → 3 → 7 → 16 days as the streak grows.
 * - Easy (3)  → one step further along the same ladder.
 *
 * @param grade  - the SM-2 grade being previewed (0..3).
 * @param streak - how many times this card was recalled ("Good"/"Easy") already.
 * @returns the next interval in days; `0` means "again this session".
 */
export const nextIntervalDays = (grade: number, streak: number): number => {
    // classic SM-2-ish ladder, indexed by successful repetitions
    const ladder = [1, 3, 7, 16, 35]
    switch (grade) {
    case 0: // Again — lapse, back into the session
        return 0
    case 1: // Hard — always keep it near
        return 1
    case 2: // Good — advance one rung
        return ladder[Math.min(streak, ladder.length - 1)]
    case 3: // Easy — advance an extra rung
    default:
        return ladder[Math.min(streak + 1, ladder.length - 1)]
    }
}
