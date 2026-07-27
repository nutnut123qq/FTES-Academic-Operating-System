import {
    ClipboardTextIcon,
    CodeIcon,
    ListChecksIcon,
    NotePencilIcon,
    PaintBrushIcon,
    PuzzlePieceIcon,
} from "@phosphor-icons/react"
import type { Icon } from "@phosphor-icons/react"

/**
 * Canonical solver surface an exercise resolves to. Both the content-map child
 * rows (icon + route) and the per-lesson solver dispatch key off this — a single
 * vocabulary, so the two divergent BE type spellings never leak into feature code.
 */
export type ExerciseSolverKind = "mcq" | "essay" | "code" | "uiux" | "assignment" | "unknown"

/**
 * Unifies the two divergent BE exercise vocabularies into one solver kind:
 *   - challenge-submission spelling: `MULTIPLE_CHOICE` | `CODE` | `ESSAY`
 *   - challenge-catalog spelling:    `CODING` | `SQL` | `UI_UX` | `AI` | `BUSINESS`
 *   - course-module assignments:     `ASSIGNMENT`
 *
 * Case / separator insensitive (`UI_UX`, `ui-ux`, `uiux` all map alike). `CODE`,
 * `CODING` and `SQL` all resolve to the `code` grader (SQL is a code variant the
 * grade panel handles statically). Unknown / unmapped types (`AI`, `BUSINESS`, …)
 * fall through to `unknown` so the caller can show a coming-soon surface rather
 * than a broken one.
 */
export const normalizeExerciseType = (raw: string | null | undefined): ExerciseSolverKind => {
    switch ((raw ?? "").toUpperCase().replace(/[\s_-]/g, "")) {
    case "MULTIPLECHOICE":
    case "MCQ":
    case "QUIZ":
        return "mcq"
    case "ESSAY":
        return "essay"
    case "CODE":
    case "CODING":
    case "SQL":
        return "code"
    case "UIUX":
        return "uiux"
    case "ASSIGNMENT":
        return "assignment"
    default:
        return "unknown"
    }
}

/** Phosphor icon for a solver kind — drives the content-map child-row glyph. */
export const exerciseSolverIcon = (kind: ExerciseSolverKind): Icon => {
    switch (kind) {
    case "mcq":
        return ListChecksIcon
    case "essay":
        return NotePencilIcon
    case "code":
        return CodeIcon
    case "uiux":
        return PaintBrushIcon
    case "assignment":
        return ClipboardTextIcon
    default:
        return PuzzlePieceIcon
    }
}
