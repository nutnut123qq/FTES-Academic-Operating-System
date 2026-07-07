"use client"

import useSWR from "swr"

import { getChallengeBySlug } from "@/modules/api/rest/challenges/challenges"
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
                description: view.description ?? "",
                requirements: [],
                steps: [],
                hints: [],
                starter: EMPTY_STARTER,
                targetImageUrl: "",
                isLocked: false,
                courseId: "",
            }
        },
    )
    return { challenge: data, isLoading, error, mutate }
}
