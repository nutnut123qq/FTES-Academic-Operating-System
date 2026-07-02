"use client"

import useSWR from "swr"

/** A challenge in the catalog (§10). Mock shape until the BE contract lands. */
export interface Challenge {
    /** Opaque id from the route (`[challengeId]`). */
    id: string
    /** Human title, e.g. "Two Sum". */
    title: string
    /** Domain of the challenge (drives the icon + type chip). */
    type: "coding" | "sql" | "uiux" | "ai" | "business"
    /** Difficulty label key suffix. */
    difficulty: "basic" | "intermediate" | "advanced"
    /** Points awarded on completion. */
    points: number
    /** How many learners have attempted it. */
    participants: number
}

// ponytail: mock BE — no challenges endpoint yet. Deterministic sample list, same
// shape the catalog + (future) solve view will share. Wire a real GraphQL query
// (challenges()) when the contract lands; the hook API stays.
const fetchChallengesMock = async (): Promise<Array<Challenge>> => [
    { id: "two-sum", title: "Two Sum", type: "coding", difficulty: "basic", points: 100, participants: 1240 },
    { id: "top-customers", title: "Top Khách Hàng Theo Doanh Thu", type: "sql", difficulty: "intermediate", points: 200, participants: 640 },
    { id: "landing-redesign", title: "Thiết Kế Lại Landing Page", type: "uiux", difficulty: "intermediate", points: 250, participants: 312 },
    { id: "prompt-tuning", title: "Tối Ưu Prompt Cho Chatbot", type: "ai", difficulty: "advanced", points: 400, participants: 187 },
    { id: "pricing-model", title: "Xây Mô Hình Định Giá SaaS", type: "business", difficulty: "advanced", points: 350, participants: 96 },
    { id: "binary-search", title: "Binary Search", type: "coding", difficulty: "basic", points: 120, participants: 980 },
]

/** Loads the challenge catalog. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryChallengesSwr = () => {
    const { data, isLoading, error } = useSWR(["challenges"], () => fetchChallengesMock())
    return { challenges: data ?? [], isLoading, error }
}
