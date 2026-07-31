/**
 * Shared helpers for the two first-class "solve → submit for AI grading" surfaces
 * (contract exercise-submission-methods): the inline lesson **assignment** card
 * (`LessonAssignmentBlock`) and the **challenge** solve page's code-method solver
 * (`ChallengeMethodSolver`). Both offer a GitHub-URL form and/or a file-upload form
 * chosen by the author's `submissionMethod`, so the parsing / validation lives once
 * here instead of being copied per surface.
 */

/** The two first-class assignment/challenge submission methods. */
export type SubmitMethod = "github" | "file"

/** Mirror of the BE `@Pattern("^https://.+")` guard on the submitted repo URL. */
export const isHttpsUrl = (value: string): boolean => /^https:\/\/.+/.test(value.trim())

/**
 * Which submission tabs to offer, from the author's `submissionMethod`. Absent /
 * unknown → GitHub only (back-compat: never surface a file tab the BE can't accept).
 */
export const parseSubmitMethods = (
    raw: string | null | undefined,
): { github: boolean, file: boolean } => {
    switch ((raw ?? "").toUpperCase().trim()) {
    case "BOTH":
        return { github: true, file: true }
    case "FILE":
        return { github: false, file: true }
    case "GITHUB":
    default:
        return { github: true, file: false }
    }
}

/**
 * True when `raw` names a real submission method (`GITHUB` | `FILE` | `BOTH`). Used by
 * the challenge code solver to decide whether to render the URL/file forms (a method
 * is set) or fall back to the inline code editor (absent / unknown value).
 */
export const hasSubmissionMethod = (raw: string | null | undefined): boolean => {
    switch ((raw ?? "").toUpperCase().trim()) {
    case "GITHUB":
    case "FILE":
    case "BOTH":
        return true
    default:
        return false
    }
}

/**
 * Parses the author's `fileExtension` whitelist into lowercase dot-prefixed
 * extensions (`"py, zip"` / `".py .zip"` → `[".py", ".zip"]`). Empty → no restriction.
 */
export const parseFileExtensions = (raw: string | null | undefined): Array<string> =>
    (raw ?? "")
        .split(/[\s,]+/)
        .map((entry) => entry.trim().toLowerCase())
        .filter((entry) => entry.length > 0)
        .map((entry) => (entry.startsWith(".") ? entry : `.${entry}`))

/** True when the file's name ends with one of the accepted extensions (or none are set). */
export const fileMatchesExtensions = (file: File, extensions: Array<string>): boolean =>
    extensions.length === 0 || extensions.some((ext) => file.name.toLowerCase().endsWith(ext))

/**
 * Reads the accepted `fileExtension` whitelist out of a challenge's opaque
 * `gradingConfig` JSON string (BE stores per-challenge grading knobs there). Returns
 * the raw string (e.g. `"py, zip"`) for {@link parseFileExtensions}, or `""` when the
 * config is absent / unparseable / carries no `fileExtension` — so a missing config
 * simply means "no client-side extension restriction", never a thrown error.
 *
 * FE ASSUMPTION (BE contract): the challenge's `gradingConfig` JSON, when it gates a
 * FILE submission, carries a string `fileExtension` field mirroring the assignment's.
 */
export const parseGradingConfigFileExtension = (
    gradingConfig: string | null | undefined,
): string => {
    if (!gradingConfig || gradingConfig.trim() === "") {
        return ""
    }
    try {
        const parsed: unknown = JSON.parse(gradingConfig)
        if (
            typeof parsed === "object" &&
            parsed !== null &&
            "fileExtension" in parsed &&
            typeof (parsed as { fileExtension: unknown }).fileExtension === "string"
        ) {
            return (parsed as { fileExtension: string }).fileExtension
        }
    } catch {
        // Opaque / non-JSON config → treat as no restriction.
    }
    return ""
}
