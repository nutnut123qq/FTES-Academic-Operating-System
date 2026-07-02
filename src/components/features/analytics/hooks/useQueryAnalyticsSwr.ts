"use client"

import useSWR from "swr"

/** A single headline metric: label key + current value + period-over-period delta (%). */
export interface AnalyticsMetric {
    id: string
    /** i18n key under `analytics.metrics.*`. */
    key: string
    value: number
    /** Percent change vs the previous period; negative = down. */
    delta: number
}

/** A category the dashboard can chart into (placeholder tiles for now). */
export interface AnalyticsSection {
    id: string
    /** i18n key under `analytics.sections.*`. */
    key: string
}

// ponytail: mock BE — no analytics endpoint yet. Deterministic sample dashboard,
// SWR-shaped so the metrics dashboard can drop-in swap for a real GraphQL query
// (analyticsOverview()) when the contract lands; hook API stays the same.
const fetchAnalyticsMock = async (): Promise<{ metrics: Array<AnalyticsMetric>; sections: Array<AnalyticsSection> }> => ({
    metrics: [
        { id: "learners", key: "learners", value: 12840, delta: 8.4 },
        { id: "lessonsCompleted", key: "lessonsCompleted", value: 48213, delta: 12.1 },
        { id: "activeGroups", key: "activeGroups", value: 326, delta: 3.7 },
        { id: "resourcesShared", key: "resourcesShared", value: 1974, delta: -2.3 },
        { id: "avgCompletion", key: "avgCompletion", value: 71.5, delta: 1.9 },
        { id: "coinsCirculating", key: "coinsCirculating", value: 2350400, delta: -5.6 },
    ],
    sections: [
        { id: "learning", key: "learning" },
        { id: "community", key: "community" },
        { id: "ai", key: "ai" },
        { id: "gamification", key: "gamification" },
        { id: "business", key: "business" },
    ],
})

/** Loads the analytics dashboard overview. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryAnalyticsSwr = () => {
    const { data, isLoading, error } = useSWR(["analytics", "overview"], () => fetchAnalyticsMock())
    return { metrics: data?.metrics ?? [], sections: data?.sections ?? [], isLoading, error }
}
