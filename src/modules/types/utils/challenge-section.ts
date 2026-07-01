import type { ChallengeOutputEntity } from "../entities/challenge-output"
import type { ChallengeOutputLangEntity } from "../entities/challenge-output-lang"
import type { ChallengePrerequisiteEntity } from "../entities/challenge-prerequisite"
import type { ChallengePrerequisiteLangEntity } from "../entities/challenge-prerequisite-lang"
import type { ChallengeRequirementEntity } from "../entities/challenge-requirement"
import type { ChallengeRequirementLangEntity } from "../entities/challenge-requirement-lang"
import type { ChallengeStepEntity } from "../entities/challenge-step"
import type { ChallengeStepLangEntity } from "../entities/challenge-step-lang"
import {
    DEFAULT_PROGRAMMING_LANGUAGES,
    normalizeProgrammingLang,
} from "./programming-language"

/** Union of SCHEMA V2 section item entities on {@link ChallengeEntity}. */
export type ChallengeSectionItemEntity =
    | ChallengeRequirementEntity
    | ChallengeStepEntity
    | ChallengeOutputEntity
    | ChallengePrerequisiteEntity

/** Union of SCHEMA V2 per-programming-language lang rows. */
export type ChallengeSectionLangEntity =
    | ChallengeRequirementLangEntity
    | ChallengeStepLangEntity
    | ChallengeOutputLangEntity
    | ChallengePrerequisiteLangEntity

/** Canonical programming-language tab order when mount buckets only expose `orderIndex`. */
const STANDARD_PROGRAMMING_LANGS: Array<string> = [
    "typescript",
    "java",
    "csharp",
    "go",
    "python",
    "rust",
]

/** Flattened row for UI after programming-language selection. */
export interface ChallengeResolvedRow {
    /** Localized item title (requirements / steps only). */
    title: string
    /** Localized body for the active programming language. */
    body: string
    /** Requirement weight when the lang row exposes `score`. */
    score?: number
}

/**
 * Distinct programming languages for V2 tabs.
 * Supports both mount shapes:
 * - **Position model** — item = requirement/step position; `langs[]` carries prog-lang codes.
 * - **Lang-bucket model** — item = prog-lang bucket; `orderIndex` aligns with {@link STANDARD_PROGRAMMING_LANGS}.
 *
 * @param items - `requirements` from GraphQL/CDN.
 * @returns Sorted language codes for tabs.
 */
export function listRequirementProgrammingLangs(
    items: Array<ChallengeRequirementEntity> | undefined,
): Array<string> {
    if (!items?.length) {
        return []
    }
    if (isPositionModel(items)) {
        const seen = new Map<string, number>()
        for (const item of items) {
            for (const langRow of item.langs ?? []) {
                if (!langRow.lang || langRow.lang === "text") {
                    continue
                }
                if (!seen.has(langRow.lang)) {
                    seen.set(langRow.lang, langRow.sortIndex)
                }
            }
        }
        return [...seen.entries()]
            .sort((prev, next) => prev[1] - next[1])
            .map(([lang]) => lang)
    }
    return items
        .slice()
        .sort((prev, next) => prev.sortIndex - next.sortIndex)
        .map((_item, index) => STANDARD_PROGRAMMING_LANGS[index] ?? `lang-${index + 1}`)
}

/** V2 challenge slices passed to {@link listChallengeProgrammingLangs}. */
export interface ListChallengeProgrammingLangsParams {
    /** Requirement buckets / positions. */
    requirements?: Array<ChallengeRequirementEntity>
    /** Step buckets / positions. */
    steps?: Array<ChallengeStepEntity>
    /** Output buckets / positions. */
    outputs?: Array<ChallengeOutputEntity>
    /** Prerequisite buckets / positions. */
    prerequisites?: Array<ChallengePrerequisiteEntity>
}

/**
 * Distinct programming languages across all SCHEMA V2 challenge sections, in default tab order.
 *
 * @param challenge - V2 section arrays from {@link ChallengeEntity}.
 * @returns Sorted language codes for {@link ProgrammingLanguageTabs}.
 */
export function listChallengeProgrammingLangs(
    challenge: ListChallengeProgrammingLangsParams | null | undefined,
): Array<string> {
    const seen = new Set<string>()
    const sections: Array<Array<ChallengeSectionItemEntity> | undefined> = [
        challenge?.requirements,
        challenge?.steps,
        challenge?.outputs,
        challenge?.prerequisites,
    ]

    for (const section of sections) {
        for (const lang of listRequirementProgrammingLangs(
            section as Array<ChallengeRequirementEntity> | undefined,
        )) {
            seen.add(normalizeProgrammingLang(lang))
        }
    }

    const ordered: Array<string> = []
    for (const lang of DEFAULT_PROGRAMMING_LANGUAGES) {
        if (seen.has(lang)) {
            ordered.push(lang)
        }
    }
    for (const lang of seen) {
        if (!ordered.includes(lang)) {
            ordered.push(lang)
        }
    }
    return ordered
}

/**
 * Builds UI rows for one V2 section at a programming language.
 *
 * @param items - Section items (`requirements`, `steps`, …).
 * @param programmingLang - Active programming-language tab.
 * @returns Ordered resolved rows.
 */
export function resolveChallengeSectionRows(
    items: Array<ChallengeSectionItemEntity> | undefined,
    programmingLang: string,
): Array<ChallengeResolvedRow> {
    if (!items?.length) {
        return []
    }
    if (isPositionModel(items)) {
        return resolvePositionModelRows(items, programmingLang)
    }
    return resolveLangBucketModelRows(items, programmingLang)
}

/**
 * Position model — one item per content position; pick the matching prog-lang row on each item.
 *
 * @param items - Section items.
 * @param programmingLang - Active tab code.
 * @returns Flattened rows in item order.
 */
function resolvePositionModelRows(
    items: Array<ChallengeSectionItemEntity>,
    programmingLang: string,
): Array<ChallengeResolvedRow> {
    return items
        .slice()
        .sort((prev, next) => prev.sortIndex - next.sortIndex)
        .map((item) => {
            const langRow = item.langs?.find((row) => row.lang === programmingLang)
            const score = langRow && "score" in langRow
                ? (langRow as ChallengeRequirementLangEntity).score
                : undefined
            const title = resolveLangRowTitle(langRow)
            return {
                title,
                body: resolveLangRowContent(langRow),
                ...(score !== undefined ? { score } : {}),
            }
        })
}

/**
 * Lang-bucket model — one item per programming language; inner `langs[]` are the UI rows.
 *
 * @param items - Section items (prog-lang buckets).
 * @param programmingLang - Active tab code.
 * @returns Inner rows for the selected bucket.
 */
function resolveLangBucketModelRows(
    items: Array<ChallengeSectionItemEntity>,
    programmingLang: string,
): Array<ChallengeResolvedRow> {
    const langIndex = STANDARD_PROGRAMMING_LANGS.indexOf(programmingLang)
    const bucket = langIndex >= 0
        ? items.find((item) => item.sortIndex === langIndex)
        : items.find((_item, index) => (STANDARD_PROGRAMMING_LANGS[index] ?? "") === programmingLang)
    if (!bucket?.langs?.length) {
        return []
    }
    return bucket.langs
        .slice()
        .sort((prev, next) => prev.sortIndex - next.sortIndex)
        .map((langRow) => {
            const score = "score" in langRow
                ? (langRow as ChallengeRequirementLangEntity).score
                : undefined
            return {
                title: resolveLangRowTitle(langRow),
                body: resolveLangRowContent(langRow),
                ...(score !== undefined ? { score } : {}),
            }
        })
}

/**
 * Detects normalized position model (prog-lang code lives on each lang row).
 *
 * @param items - Section items from CDN.
 * @returns `true` when lang rows carry real programming-language codes.
 */
function isPositionModel(items: Array<ChallengeSectionItemEntity>): boolean {
    const codes = items
        .flatMap((item) => item.langs ?? [])
        .map((row) => row.lang)
        .filter((lang): lang is string => typeof lang === "string" && lang.length > 0)
    if (codes.length === 0) {
        return false
    }
    const unique = new Set(codes)
    if (unique.size === 1 && unique.has("text")) {
        return false
    }
    return codes.some((lang) => lang !== "text")
}

/**
 * Reads localized title from a lang row when present.
 *
 * @param langRow - Matched lang row, if any.
 * @returns Title string or empty.
 */
function resolveLangRowTitle(
    langRow: ChallengeSectionLangEntity | undefined,
): string {
    if (!langRow || !("title" in langRow)) {
        return ""
    }
    return typeof langRow.title === "string" ? langRow.title : ""
}

/**
 * Reads localized content from a lang row (`text` on output/prereq, `body` on req/step).
 *
 * @param langRow - Matched lang row, if any.
 * @returns Markdown string for UI.
 */
function resolveLangRowContent(
    langRow: ChallengeSectionLangEntity | undefined,
): string {
    if (!langRow) {
        return ""
    }
    if ("body" in langRow) {
        return typeof langRow.body === "string" ? langRow.body : ""
    }
    if ("text" in langRow) {
        return typeof langRow.text === "string" ? langRow.text : ""
    }
    return ""
}
