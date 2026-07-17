/**
 * Parsed `JobView.result` payloads for the four job-based AI tool pages
 * (`/ai/tools/{summary,flashcards,quiz,debug}`).
 *
 * The BE worker returns each tool's structured result as a JSON string on the
 * COMPLETED job; {@link useAiJobPolling} parses it (JSON → object) before it
 * reaches a page. Fields are optional/loose on purpose — the worker schema is
 * shared with ftes-ai-service and may omit blocks, so every renderer degrades
 * gracefully rather than throwing on a missing key.
 */

/** Result of a summary job (`POST /ai/learning/summary`). */
export interface SummaryResult {
    /** One-paragraph TL;DR of the source. */
    tldr?: string
    /** Bullet key points (snake_case — passthrough from the worker). */
    key_points?: Array<string>
    /** Glossary entries — term + short definition. */
    glossary?: Array<{ term: string, definition: string }>
    /** Estimated minutes to read the source. */
    estimated_read_min?: number
    /** Model that produced the summary (every model differs — always surface it). */
    model?: string
}

/** One flashcard from a flashcards job. */
export interface Flashcard {
    /** Prompt side. */
    front: string
    /** Answer side. */
    back: string
    /** Optional hint shown on the front. */
    hint?: string
}

/** Result of a flashcards job (`POST /ai/learning/flashcards`). */
export interface FlashcardsResult {
    /** Generated cards. */
    cards?: Array<Flashcard>
    /** Producing model. */
    model?: string
}

/** One generated quiz question. */
export interface QuizQuestion {
    /** The question stem. */
    question: string
    /** Answer options (rendered as selectable choices). */
    options: Array<string>
    /**
     * The correct answer — a 0-based option index, a letter ("A"/"B"…), or the
     * exact option text. {@link isCorrectQuizOption} normalizes all three.
     */
    correct: number | string
    /** Why the correct answer is correct (revealed after the learner chooses). */
    explanation?: string
}

/** Result of a quiz job (`POST /ai/learning/quiz`). */
export interface QuizResult {
    /** Generated questions. */
    questions?: Array<QuizQuestion>
    /** Producing model. */
    model?: string
}

/**
 * Result of a code-review (debug) job (`POST /ai/coding/review`). The generic
 * worker returns `{output, model}`; `output` is markdown. When the worker returns
 * bare markdown instead of the wrapper, {@link useAiJobPolling} hands the raw
 * string through, so a page must accept `DebugResult | string`.
 */
export interface DebugResult {
    /** Markdown review body. */
    output?: string
    /** Producing model. */
    model?: string
}

/** One section-scoped review comment from a CV review job. */
export interface CvSectionFeedback {
    /** Which CV section the comment is about (e.g. "experience"). */
    section: string
    /** The reviewer's note on that section. */
    comment: string
}

/**
 * Result of a CV review job (`POST /ai/career/cv-review`). The BE stores validated
 * JSON `{score, summary, strengths[], improvements[], sectionFeedback[], model}`;
 * fields stay optional so a renderer degrades gracefully on a partial payload.
 */
export interface CvReviewResult {
    /** Overall score 0..100 (BE clamps). */
    score?: number
    /** One-paragraph overall assessment. */
    summary?: string
    /** What the CV does well. */
    strengths?: Array<string>
    /** Concrete things to improve. */
    improvements?: Array<string>
    /** Per-section comments. */
    sectionFeedback?: Array<CvSectionFeedback>
    /** Producing model. */
    model?: string
}

/**
 * Normalizes the several shapes a quiz `correct` field arrives in (index /
 * letter / exact text) into a per-option boolean.
 *
 * @param correct - Raw `correct` from the worker.
 * @param optionIndex - 0-based index of the option being tested.
 * @param optionText - The option's text (for text/letter matching).
 * @returns Whether this option is the correct answer.
 */
export const isCorrectQuizOption = (
    correct: number | string | undefined,
    optionIndex: number,
    optionText: string,
): boolean => {
    if (correct === undefined || correct === null) return false
    if (typeof correct === "number") return correct === optionIndex
    const trimmed = correct.trim()
    // Numeric string index ("2").
    if (/^\d+$/.test(trimmed)) return Number(trimmed) === optionIndex
    // Single letter ("A"/"b") → position in the alphabet.
    if (/^[A-Za-z]$/.test(trimmed)) {
        return trimmed.toUpperCase().charCodeAt(0) - 65 === optionIndex
    }
    // Otherwise match the option text (case/space-insensitive).
    return trimmed.toLowerCase() === optionText.trim().toLowerCase()
}
