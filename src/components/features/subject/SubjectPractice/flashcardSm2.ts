import type { FlashcardProgressView } from "@/modules/api/rest/subject/types"

/**
 * SM-2 constants for the SUBJECT PRACTICE reviewer.
 *
 * Scheduling itself now happens in the BE (`POST /subjects/{code}/practice/flashcards/
 * {cardId}/review` → new ease/interval/dueAt, persisted): the state rendered after a
 * grade is always the server's. What lives here is only what the BE cannot answer
 * before the learner presses a button — the per-grade "next review" PREVIEW on the four
 * rating buttons — and it is a faithful port of the BE `Sm2Scheduler`, so the preview
 * and the value that comes back agree.
 */

/** One rating button: the grade sent to the BE + its i18n label key. */
export interface PracticeSm2Grade {
    /**
     * Grade on the BE's 0..5 scale. `< 3` is a lapse, so "Quên" is 0 while Hard/Good/
     * Easy map to 3/4/5 — the classic Anki→SM-2 mapping.
     */
    grade: number
    /** i18n key under `subjects.practice.flashcards.rating`. */
    labelKey: string
    /** Static tone classes (weakest recall = danger → strongest = success). */
    tone: string
}

/** The four rating buttons, weakest recall first. */
export const PRACTICE_SM2_GRADES: ReadonlyArray<PracticeSm2Grade> = [
    { grade: 0, labelKey: "again", tone: "border-danger/40 text-danger hover:bg-danger/10" },
    { grade: 3, labelKey: "hard", tone: "border-warning/40 text-warning hover:bg-warning/10" },
    { grade: 4, labelKey: "good", tone: "border-accent/40 text-accent hover:bg-accent/10" },
    { grade: 5, labelKey: "easy", tone: "border-success/40 text-success hover:bg-success/10" },
]

/** SM-2 bounds — mirrors `Sm2Scheduler` (initial 2.50, ease clamped, interval ≤ 1 year). */
const INITIAL_EASE = 2.5
const MIN_EASE = 1.3
const MAX_EASE = 3.0
const PASS_GRADE = 3
const MAX_INTERVAL_DAYS = 365

/** `EF' = EF + (0.1 - (5-q)(0.08 + (5-q)0.02))`, clamped and rounded to 2 decimals. */
const nextEase = (ease: number, grade: number): number => {
    const diff = 5 - grade
    const raw = ease + (0.1 - diff * (0.08 + diff * 0.02))
    const rounded = Math.round(raw * 100) / 100
    return Math.min(Math.max(rounded, MIN_EASE), MAX_EASE)
}

/**
 * Previews the interval (in days) the BE would return for `grade` on a card in
 * `progress` — used only to label the rating buttons before the call.
 *
 * @param progress - the card's CURRENT server state (`null` → a brand-new card).
 * @param grade - the grade being previewed (0..5).
 * @returns whole days until the next review (minimum 1, as in the BE).
 */
export const previewIntervalDays = (
    progress: FlashcardProgressView | null | undefined,
    grade: number,
): number => {
    const currentEase = Number(progress?.ease ?? INITIAL_EASE) || INITIAL_EASE
    const repetitions = progress?.repetitions ?? 0
    const intervalDays = progress?.intervalDays ?? 0
    const ease = nextEase(currentEase, Math.min(Math.max(grade, 0), 5))

    let next: number
    if (grade < PASS_GRADE) {
        next = 1
    } else {
        const reps = repetitions + 1
        if (reps === 1) {
            next = 1
        } else if (reps === 2) {
            next = 6
        } else {
            next = Math.round(ease * (intervalDays > 0 ? intervalDays : 6))
        }
    }
    return Math.min(Math.max(next, 1), MAX_INTERVAL_DAYS)
}
