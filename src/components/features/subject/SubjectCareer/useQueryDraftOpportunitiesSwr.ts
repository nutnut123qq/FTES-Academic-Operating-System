"use client"

import useSWR from "swr"
import { getCareerOpportunities, type CareerOpportunity } from "@/modules/api/rest/career"

/**
 * The DRAFT opportunities — i.e. exactly what `POST /career/opportunities` produces.
 *
 * The backend creates every posting as `DRAFT` (`career.opportunities.status` DEFAULT,
 * V120) while the career tab lists `status=OPEN` only, so a freshly created posting is
 * invisible until it is published (`PATCH /career/opportunities/{id}` `{status:"OPEN"}`).
 * Re-asking the SAME list endpoint for `DRAFT` is the only way back to those rows after a
 * reload — no new endpoint is invented here.
 *
 * @param enabled - `false` for viewers without `career.opportunity.manage`, so the read
 * is not even attempted for someone who could do nothing with the result.
 * @returns `{ drafts, isLoading, error, mutate }`; `drafts` is `[]` until it resolves.
 */
export const useQueryDraftOpportunitiesSwr = (enabled: boolean) => {
    const { data, isLoading, error, mutate } = useSWR(
        enabled ? (["career-opportunities", "DRAFT"] as const) : null,
        async (): Promise<Array<CareerOpportunity>> =>
            (await getCareerOpportunities({ status: "DRAFT" })) ?? [],
    )

    return { drafts: data ?? [], isLoading, error, mutate }
}
