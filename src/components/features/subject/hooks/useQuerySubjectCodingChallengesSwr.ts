"use client"

import useSWR from "swr"

/** Coding-problem difficulty. Maps to a chip color + `subjects.practice.difficulty.*`. */
export type CodingDifficulty = "easy" | "medium" | "hard"

/** Whether the current user has an accepted solution for a problem. */
export type CodingStatus = "solved" | "unsolved"

/** A worked example on a problem (input → output, optional explanation). */
export interface CodingExample {
    /** Rendered as a fenced-ish block; kept as plain text for the mock. */
    input: string
    output: string
    /** Optional prose explaining why the output follows. */
    explanation?: string
}

/** A single mock test case shown in the Run/Submit result rows. */
export interface CodingTestCase {
    id: string
    /** Short label, e.g. `Test 1` (already localized-agnostic — a bare index). */
    input: string
    expected: string
    /**
     * The (mock) actual output. Equals `expected` for passing rows; differs for a
     * deterministic failing row so Submit shows a realistic pass/fail mix.
     */
    actual: string
}

/** A LeetCode-style coding problem in the subject's bank. */
export interface CodingChallenge {
    id: string
    title: string
    difficulty: CodingDifficulty
    status: CodingStatus
    /** Acceptance rate as a whole percent (0..100). */
    acceptance: number
    /** Topic tags, e.g. `["Array", "Hash Table"]`. */
    tags: Array<string>
    /** Problem statement (plain paragraphs for the mock). */
    prompt: Array<string>
    examples: Array<CodingExample>
    /** Constraint bullet lines. */
    constraints: Array<string>
    /** Sample cases the Run/Submit buttons grade against (mock). */
    testCases: Array<CodingTestCase>
}

/**
 * Loads a subject's coding-problem bank.
 *
 * There is no per-subject coding-problem endpoint in the BE subject module (the
 * workspace `practice` tab only exposes curated link pointers, empty for the seeded
 * subjects). Rather than fabricate a problem bank, the hook returns empty and the
 * list renders its empty state. The rich `CodingChallenge` shape is retained so a
 * real coding-bank source is a drop-in later.
 */
export const useQuerySubjectCodingChallengesSwr = (subjectId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        ["subject-coding-challenges", subjectId],
        async (): Promise<Array<CodingChallenge>> => [],
    )
    return { challenges: data ?? [], isLoading, error, mutate }
}
