import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — {@link useQueryAiToolsSwr} (`ai-hub-live-tools` tasks 2.1/2.3): the hub
 * catalog enriched against the live BE quota map. `swr` is mocked to capture the
 * `(key, fetcher)` pair and `getMyAiQuota` serves a canned quota, pinning:
 *  - `mentor` is ABSENT from the catalog (moved to the Admin lecturer console —
 *    a learner tile would be dead) and no `teacher`-category tool ships,
 *  - every tool except `tutor` carries a real `/ai/tools/*` href; `tutor` alone
 *    is intent-driven (`href` undefined),
 *  - a tool only renders when the BE reports its feature (missing feature →
 *    filtered out), and `remaining` mirrors the quota value.
 */

type SwrCall = { key: unknown; fetcher: (() => unknown) | undefined }

const swrCalls: Array<SwrCall> = []

vi.mock("swr", () => ({
    default: (key: unknown, fetcher: (() => unknown) | undefined) => {
        swrCalls.push({ key, fetcher })
        return { data: undefined, error: undefined, isLoading: false, mutate: vi.fn() }
    },
}))

const getMyAiQuota = vi.fn()
vi.mock("@/modules/api/rest/ai", () => ({
    getMyAiQuota: (...a: Array<unknown>) => getMyAiQuota(...a),
}))

import { useQueryAiToolsSwr, type AiTool } from "./useQueryAiToolsSwr"

const FULL_QUOTA: Record<string, number> = {
    TUTOR_CHAT: 20,
    STUDY_PLANNER: 3,
    SUMMARY: 10,
    FLASHCARDS: 10,
    QUIZ_GEN: 10,
    DEBUG: 5,
    CV_REVIEW: 2,
    MENTOR_QA: 99, // BE may still report the feature — the catalog must not resurrect the tile
}

const runFetcher = async (): Promise<Array<AiTool>> => {
    renderHook(() => useQueryAiToolsSwr())
    const { fetcher } = swrCalls[swrCalls.length - 1]
    return (await fetcher?.()) as Array<AiTool>
}

beforeEach(() => {
    swrCalls.length = 0
    getMyAiQuota.mockReset()
})

describe("useQueryAiToolsSwr", () => {
    it("uses a stable key", () => {
        renderHook(() => useQueryAiToolsSwr())
        expect(swrCalls[swrCalls.length - 1].key).toEqual(["GET_AI_TOOLS_QUOTA"])
    })

    it("never markets mentor (or any teacher-category tool), even when the BE reports its feature", async () => {
        getMyAiQuota.mockResolvedValue(FULL_QUOTA)
        const tools = await runFetcher()
        expect(tools.map((tool) => tool.key)).not.toContain("mentor")
        expect(tools.some((tool) => tool.category === "teacher")).toBe(false)
    })

    it("gives every tool except tutor a real /ai/tools/* href; tutor stays intent-driven", async () => {
        getMyAiQuota.mockResolvedValue(FULL_QUOTA)
        const tools = await runFetcher()
        expect(tools.map((tool) => tool.key)).toEqual([
            "tutor",
            "planner",
            "summary",
            "flashcards",
            "quiz",
            "debug",
            "cvReview",
        ])
        for (const tool of tools) {
            if (tool.key === "tutor") {
                expect(tool.href).toBeUndefined()
            } else {
                expect(tool.href).toMatch(/^\/ai\/tools\//)
            }
        }
    })

    it("filters out a tool whose feature the BE does not expose", async () => {
        const { DEBUG: _omitted, ...withoutDebug } = FULL_QUOTA
        getMyAiQuota.mockResolvedValue(withoutDebug)
        const tools = await runFetcher()
        expect(tools.map((tool) => tool.key)).not.toContain("debug")
        expect(tools.map((tool) => tool.key)).toContain("summary")
    })

    it("mirrors the live remaining quota per tool", async () => {
        getMyAiQuota.mockResolvedValue(FULL_QUOTA)
        const tools = await runFetcher()
        const byKey = Object.fromEntries(tools.map((tool) => [tool.key, tool.remaining]))
        expect(byKey.planner).toBe(3)
        expect(byKey.cvReview).toBe(2)
        expect(byKey.tutor).toBe(20)
    })
})
