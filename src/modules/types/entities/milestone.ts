import type { PersonalProjectTaskType } from "../enums"
import type { AbstractEntity } from "./abstract"
import type { CodeImplementationEntity } from "./code-implementation"

/**
 * A pass criterion for a milestone task.
 */
export interface MilestoneTaskCriteriaEntity extends AbstractEntity {
    /** Criterion text. */
    text: string
    /** Criterion hint. */
    hint: string
    /** Prompt text for AI grading. */
    promptText: string
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** Score awarded when this criterion passes. */
    score: number
    /** Parent milestone task ID. */
    milestoneTaskId: string
}

/**
 * A per-locale field override for a milestone task brief. Mirrors the generic i18n translation
 * row used by the V2 content bodies, except the localized value lives in a generic `field`/`value`
 * pair (e.g. `field === "body"`).
 */
export interface MilestoneTaskBriefTranslation {
    /** Locale of this override (e.g. "vi", "en"). */
    locale: string
    /** Name of the localized field (e.g. "body"). */
    field: string
    /** Localized value for {@link field}. */
    value: string
}

/**
 * SCHEMA V2 per-programming-language learner-facing brief for a milestone task. One row per
 * language (typescript / java / csharp / go) or a single `agnostic` row for FE/infra tasks; `body`
 * holds the default-locale Markdown instructions and per-locale variants live in `translations`.
 * Mirrors the backend `MilestoneTaskBriefEntity` and the V2 content-body pattern.
 */
export interface MilestoneTaskBrief {
    /** Brief row id. */
    id: string
    /** Programming language for this brief (typescript / java / csharp / go / agnostic). */
    lang: string
    /** Default-locale brief body (Markdown). */
    body: string
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** Default locale for this brief row. */
    defaultLocale: string
    /** Per-locale field overrides for this brief. */
    translations?: Array<MilestoneTaskBriefTranslation>
}

/**
 * A task belonging to a milestone.
 */
export interface MilestoneTaskEntity extends AbstractEntity {
    /** Task title. */
    title: string
    /** Task description. */
    description: string
    /** Task hint. */
    hint: string
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** Priority weight — lower values are higher priority. */
    weight: number
    /** Task type classification. */
    type: PersonalProjectTaskType
    /** Maximum possible score for this task. */
    maxScore: number
    /** Parent milestone ID. */
    milestoneId: string
    /** SCHEMA V2 per-language learner-facing briefs (task instructions). */
    briefs?: Array<MilestoneTaskBrief>
    /** Criteria belonging to this task (legacy fallback). */
    criterias?: Array<MilestoneTaskCriteriaEntity>
    /** Multi-language implementation guides for this task (legacy fallback). */
    codeImplementations?: Array<CodeImplementationEntity>
}

/**
 * A milestone belonging to a course.
 */
export interface MilestoneEntity extends AbstractEntity {
    /** Milestone title. */
    title: string
    /** Milestone description. */
    description: string
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** Parent course ID. */
    courseId: string
    /** Tasks belonging to this milestone. */
    tasks?: Array<MilestoneTaskEntity>
}
