"use client"

import useSWR from "swr"
import {
    getReconciliationRuns,
    type PageView,
    type ReconciliationRunView,
} from "@/modules/api/rest/commerce"

/**
 * SWR query wrapper for {@link getReconciliationRuns}.
 */
export const useGetReconciliationRunsSwr = (params?: {
    page?: number
    size?: number
}) => {
    const swr = useSWR<PageView<ReconciliationRunView>, Error>(
        ["GET_RECONCILIATION_RUNS_SWR", params?.page, params?.size],
        () => getReconciliationRuns(params),
    )

    return swr
}
