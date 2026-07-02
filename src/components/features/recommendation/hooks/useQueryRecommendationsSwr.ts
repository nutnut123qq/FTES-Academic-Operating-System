"use client"

import useSWR from "swr"

/** One recommendation item — the smallest "for you" suggestion card. */
export interface Recommendation {
    /** Opaque id, unique within its kind. */
    id: string
    /** What is being recommended (subject name, mentor name, challenge title…). */
    title: string
    /** Why it surfaced, e.g. "Because you study PRF192" — shown as the card caption. */
    reason: string
}

/** The five recommendation kinds the engine surfaces (§17). */
export interface RecommendationsByKind {
    subjects: Array<Recommendation>
    courses: Array<Recommendation>
    groups: Array<Recommendation>
    mentors: Array<Recommendation>
    challenges: Array<Recommendation>
}

// ponytail: mock BE — §17 Recommendation Engine has no endpoint yet. Deterministic
// per-kind sample lists so the "for you" feed renders. Wire a real GraphQL query
// (recommendations()) when the contract lands; the hook API + shape stay put.
const fetchRecommendationsMock = async (): Promise<RecommendationsByKind> => ({
    subjects: [
        { id: "csd201", title: "CSD201 — Cấu trúc dữ liệu & Giải thuật", reason: "Because you study PRF192" },
        { id: "dbi202", title: "DBI202 — Cơ sở dữ liệu", reason: "Popular with your cohort" },
        { id: "prj301", title: "PRJ301 — Lập trình Java Web", reason: "Next in your roadmap" },
    ],
    courses: [
        { id: "react-fundamentals", title: "React Fundamentals", reason: "Matches your frontend interest" },
        { id: "clean-architecture", title: "Clean Architecture", reason: "Because you completed OOP" },
    ],
    groups: [
        { id: "prf192-study", title: "PRF192 Study Group", reason: "Classmates you follow are here" },
        { id: "algo-grind", title: "Algorithm Grind", reason: "Because you study CSD201" },
    ],
    mentors: [
        { id: "mentor-a", title: "Lê Minh Quân", reason: "Teaches subjects you take" },
        { id: "mentor-b", title: "Trần Thu Hà", reason: "Highly rated in Data Structures" },
    ],
    challenges: [
        { id: "two-sum", title: "Two Sum", reason: "Warm-up for CSD201" },
        { id: "sql-joins", title: "SQL Joins Practice", reason: "Because you study DBI202" },
        { id: "rest-api", title: "Build a REST API", reason: "Reinforces PRJ301" },
    ],
})

/**
 * Loads the "for you" recommendation feed grouped by kind. Mocked for now (see note
 * above) but shaped like the real SWR query hooks so callers don't change when the
 * BE lands.
 */
export const useQueryRecommendationsSwr = () => {
    const { data, isLoading, error } = useSWR(["recommendations"], () => fetchRecommendationsMock())
    return { recommendations: data, isLoading, error }
}
