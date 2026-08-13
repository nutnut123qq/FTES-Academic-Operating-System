"use client"

import useSWR from "swr"

import { getChallengeBySlug } from "@/modules/api/rest/challenges/challenges"
import type {
    ChallengeAuthorView,
    ChallengePaperFileView,
    SampleTestCaseView,
} from "@/modules/api/rest/challenges/types"
import { parseGradingConfigStarterCode } from "@/components/features/learn/submissionMethods"
import { toChallenge } from "./useQueryChallengesSwr"
import type { Challenge } from "./useQueryChallengesSwr"

/** Starter code seeded into the UI/UX editor. */
export interface ChallengeStarter {
    html: string
    css: string
    js: string
}

/**
 * Full solve-view challenge (§10), mapped from the BE `ChallengeView`
 * (`GET /api/v1/challenges/{slug}`).
 *
 * The BE public view only carries a plain `description`; it exposes no structured
 * brief (requirements/steps/hints), no editor starter/target asset, and no premium
 * gate. Those fields are kept on the type (the UI/UX editor consumes them) but
 * degrade to empty — the UI hides the sections that have no BE-backed content
 * rather than fabricate a mock brief.
 */
export interface ChallengeDetail extends Challenge {
    /**
     * The challenge's real UUID (BE `ChallengeView.id`), distinct from {@link Challenge.id}
     * which is the routing slug. Threaded as the optional `challengeId` on the AI run/grade
     * calls so the BE can enforce the free-trial ("học thử") per-challenge run/grade caps.
     * Absent on older deployments → the calls omit it (BE no-ops).
     */
    challengeUuid?: string
    /** Full description from the BE (markdown/plain). */
    description: string
    /** Requirement list — BE public view exposes none → empty. */
    requirements: Array<string>
    /** Guided steps — BE public view exposes none → empty. */
    steps: Array<string>
    /** Hints — BE public view exposes none → empty. */
    hints: Array<string>
    /** Seed code for the editor — BE public view exposes none → empty. */
    starter: ChallengeStarter
    /** Reference design image — BE public view exposes none → "". */
    targetImageUrl: string
    /** Premium gate — BE public view carries no gate → false. */
    isLocked: boolean
    /** Course containing this challenge (enroll CTA) — BE view carries none → "". */
    courseId: string
    /**
     * Learner-safe starter code per language (BE `grading_config.starterCode = {lang: code}`),
     * prefilled into the code sandbox when the editor is untouched. Absent on older
     * deployments / non-code challenges → the panel keeps its generic template fallback.
     */
    starterCode?: Record<string, string>
    /**
     * The learner-visible SAMPLE (non-hidden) test cases, each `{name?, input, expected}`.
     * Drives the sandbox "Chạy test" action + the read-only "Ví dụ" examples. HIDDEN cases
     * are never in this view. Absent on older deployments / non-code challenges.
     */
    sampleTestCases?: Array<SampleTestCaseView>
    /**
     * Direct URL of the challenge's EXAM PAPER, when it carries one (a PE paper folded
     * into the challenge bank). `null` for an ordinary challenge. When set, the solve page
     * shows the paper to READ — AI grading is locked, so no submission surface is offered.
     */
    paperUrl: string | null
    /** MIME of {@link paperUrl} (`image/*`, `application/pdf`, …); `null` when unknown. */
    paperMime: string | null
    /**
     * The WHOLE paper — every attached file in the author's order, each with the role the
     * BE derived from its MIME (BE `challenge-paper-multifile`). {@link paperUrl} /
     * {@link paperMime} stay the PRIMARY file of this same set.
     *
     * `null` when the BE sent no list: an older deployment, or a challenge with no paper.
     * The paper surface then behaves exactly as it did before the contract, from the two
     * single-file fields alone.
     */
    paperFiles: Array<ChallengePaperFileView> | null
    /**
     * Who UPLOADED the challenge — the BE's `created_by` resolved to a profile card
     * (`ChallengeView.author`). `null` when the challenge has no creator on record, when
     * that user has no profile, or on a BE older than the contract; every reader hides its
     * uploader line in that case rather than inventing an identity.
     */
    author: ChallengeAuthorView | null
    /**
     * When the challenge was posted (ISO-8601), rendered as the uploader's relative
     * timestamp on the paper surface. `null` on every deployment today: the BE's
     * `ChallengeView` carries no creation instant — see
     * {@link import("@/modules/api/rest/challenges/types").ChallengeDetailView.createdAt}
     * for the exact field that has to be added, and why nothing else may stand in for it.
     */
    createdAt: string | null
}

const EMPTY_STARTER: ChallengeStarter = { html: "", css: "", js: "" }

/**
 * Loads one challenge for the solve view from the real BE
 * (`GET /api/v1/challenges/{slug}` — the route `[challengeId]` IS the slug). A
 * missing slug 404s BE-side → SWR error state.
 */
export const useQueryChallengeSwr = (challengeId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        challengeId ? ["challenge", challengeId] : null,
        async (): Promise<ChallengeDetail> => {
            const view = await getChallengeBySlug(challengeId)
            return {
                ...toChallenge(view),
                challengeUuid: view.id,
                description: view.description ?? "",
                requirements: [],
                steps: [],
                hints: [],
                starter: EMPTY_STARTER,
                targetImageUrl: "",
                isLocked: false,
                courseId: "",
                starterCode: parseGradingConfigStarterCode(view.gradingConfig),
                sampleTestCases: view.sampleTestCases ?? undefined,
                paperUrl: view.paperUrl ?? null,
                paperMime: view.paperMime ?? null,
                paperFiles: view.paperFiles ?? null,
                author: view.author ?? null,
                createdAt: view.createdAt ?? null,
            }
        },
    )
    return { challenge: data, isLoading, error, mutate }
}
