import type { GraphQLResponse } from "../../types"

/** The weekly KPIs a learner can set a target for (mirrors BE `KpiKey`). */
export type KpiKey =
    | "lessons"
    | "studyDays"
    | "challenges"
    | "coding"
    | "flashcards"

/** One weekly KPI: current rolling-7-day value vs the user's target. */
export interface QueryKpiItemData {
    /** Which KPI this row is. */
    key: KpiKey
    /** The rolling-7-day current value. */
    current: number
    /** The user's weekly target; null when none set. */
    target: number | null
}

/** Composite weekly KPI score across the KPIs that have a target. */
export interface QueryKpiCompositeData {
    /** Average completion across targeted KPIs, 0–100. */
    percent: number
    /** Number of targeted KPIs already met (current >= target). */
    completed: number
    /** Number of KPIs that have a target set. */
    total: number
}

/** The viewer's weekly KPIs (per-KPI progress + composite score). */
export interface QueryMyKpisData {
    /** Every weekly KPI with its current value and target. */
    items: Array<QueryKpiItemData>
    /** Composite score over the KPIs that have a target. */
    composite: QueryKpiCompositeData
}

/** Apollo response shape for the `myKpis` query. */
export interface QueryMyKpisResponse {
    /** Top-level `myKpis` field wrapping the standard API response. */
    myKpis: GraphQLResponse<QueryMyKpisData>
}
