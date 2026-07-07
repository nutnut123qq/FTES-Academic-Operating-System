"use client"

import { useTranslations } from "next-intl"
import useSWR from "swr"
import { getRecommendations, type RecommendationItem } from "@/modules/api/rest/recommendation"

/** One recommendation item — the smallest "for you" suggestion card. */
export interface Recommendation {
    /** Opaque id, unique within its kind. */
    id: string
    /** What is being recommended (subject name, mentor name, challenge title…). */
    title: string
    /** Why it surfaced — a localized caption. */
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

/** FE kind → BE RecType (the `type` query param on GET /recommendations). */
const KIND_TO_REC_TYPE: Record<keyof RecommendationsByKind, string> = {
    subjects: "SUBJECT",
    courses: "COURSE",
    groups: "GROUP",
    mentors: "MENTOR",
    challenges: "CHALLENGE",
}

/** Reason codes we have a localized label for; everything else → the default caption. */
const KNOWN_REASON_CODES = new Set([
    "POPULAR",
    "SIMILAR_USERS",
    "FRIENDS_ENROLLED",
    "COURSE_ENROLLED",
    "LESSON_COMPLETED",
])

/**
 * Loads the "for you" recommendation feed grouped by kind from the real §17
 * Recommendation Engine REST API (`GET /recommendations?type=…`, one call per
 * kind). Title comes from the BE display snapshot; the reason caption is the first
 * structured reason code, localized (generic default when unknown). Empty per-kind
 * lists render the shared empty-state.
 */
export const useQueryRecommendationsSwr = () => {
    const t = useTranslations("recommendation")

    const toReason = (item: RecommendationItem): string => {
        const code = item.reasons?.[0]?.["code"]
        return typeof code === "string" && KNOWN_REASON_CODES.has(code)
            ? t(`reasons.${code}`)
            : t("reasons.default")
    }

    const toRecommendation = (item: RecommendationItem): Recommendation => ({
        id: item.id ?? item.itemId,
        title: item.snapshot?.title?.trim() || item.itemId,
        reason: toReason(item),
    })

    const { data, isLoading, error, mutate } = useSWR(
        ["GET_RECOMMENDATIONS"],
        async (): Promise<RecommendationsByKind> => {
            const keys = Object.keys(KIND_TO_REC_TYPE) as Array<keyof RecommendationsByKind>
            const lists = await Promise.all(
                keys.map((key) => getRecommendations({ type: KIND_TO_REC_TYPE[key], limit: 10 })),
            )
            const byKind = {} as RecommendationsByKind
            keys.forEach((key, index) => {
                byKind[key] = (lists[index] ?? []).map(toRecommendation)
            })
            return byKind
        },
    )
    return { recommendations: data, isLoading, error, mutate }
}
