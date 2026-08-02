/**
 * Shared helpers for the challenge "solve → submit for AI grading" surface (contract
 * exercise-submission-methods): the **challenge** solve page's code-method solver
 * (`ChallengeMethodSolver`) offers a GitHub-URL form, a file-upload form, and/or the
 * in-browser code sandbox chosen by the author's `submissionMethod` + `fileExtension`,
 * so the parsing / validation lives once here instead of being copied per surface.
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
 * FE map from a code file extension to the in-browser sandbox runtime language. The
 * runtime source of truth is Piston (BE); this only decides which picker language a
 * learner's file extension implies and whether the "Code trực tiếp" sandbox tab is
 * offered. Kept in sync with `GradeCodePanel`'s `CODE_LANGUAGES` picker subset.
 */
export const FILE_EXTENSION_LANGUAGE: Record<string, string> = {
    ".py": "python",
    ".js": "javascript",
    ".ts": "typescript",
    ".java": "java",
    ".c": "c",
    ".cpp": "cpp",
    ".go": "go",
    ".cs": "csharp",
    ".php": "php",
    ".rb": "ruby",
    ".sql": "sql",
}

/**
 * The sandbox runtime language a challenge's `fileExtension` maps to, or `null` when
 * none of its accepted extensions names a runnable language (e.g. a `.zip` / `.pdf`
 * upload). Reuses {@link parseFileExtensions} so a whitelist like `"py, zip"` resolves
 * to the first runnable entry (`python`).
 *
 * @param fileExtension - The author's raw `fileExtension` hint / whitelist string.
 * @returns The mapped runtime language (e.g. `"python"`, `"sql"`), or `null`.
 */
export const runnableLanguageFromFileExtension = (
    fileExtension: string | null | undefined,
): string | null => {
    for (const ext of parseFileExtensions(fileExtension)) {
        const language = FILE_EXTENSION_LANGUAGE[ext]
        if (language) {
            return language
        }
    }
    return null
}

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

/**
 * Reads the learner-safe starter code map out of a challenge's opaque `gradingConfig`
 * JSON (BE exposes `grading_config.starterCode = {lang: code}` on a CODE challenge learner
 * view). Returns a `{language: code}` record, keeping only string→string entries;
 * `undefined` when the config is absent / unparseable / carries no usable `starterCode`.
 * Never throws — a missing config simply means "no starter to prefill".
 *
 * FE ASSUMPTION (BE contract): the learner-safe `gradingConfig` JSON carries a
 * `starterCode` object keyed by the FE language id (e.g. `python`, `sql`).
 */
export const parseGradingConfigStarterCode = (
    gradingConfig: string | null | undefined,
): Record<string, string> | undefined => {
    if (!gradingConfig || gradingConfig.trim() === "") {
        return undefined
    }
    try {
        const parsed: unknown = JSON.parse(gradingConfig)
        if (typeof parsed !== "object" || parsed === null || !("starterCode" in parsed)) {
            return undefined
        }
        const raw = (parsed as { starterCode: unknown }).starterCode
        if (typeof raw !== "object" || raw === null) {
            return undefined
        }
        const entries = Object.entries(raw as Record<string, unknown>).filter(
            (entry): entry is [string, string] => typeof entry[1] === "string",
        )
        return entries.length > 0 ? Object.fromEntries(entries) : undefined
    } catch {
        // Opaque / non-JSON config → no starter.
        return undefined
    }
}
