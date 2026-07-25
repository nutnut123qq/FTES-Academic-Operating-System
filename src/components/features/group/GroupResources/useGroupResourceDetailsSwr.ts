"use client"

import useSWR from "swr"
import { getResourceDetail } from "@/modules/api/rest/resource"

/** The slice of a resource detail the group Resources tab renders. */
export interface GroupResourceDetail {
    /** Resource title as stored in the resource hub. */
    title: string
    /** Resource kind (DOCUMENT / SLIDE / …) — rendered as a chip. */
    type: string
}

/**
 * Joins titles onto a group's linked-resource rows. The group link contract only
 * carries `{ resourceId, addedBy, note }`, so the tab hydrates each id through
 * `GET /resources/{id}`.
 *
 * The join is deliberately TOLERANT: a resource the viewer may not read (403) or
 * one that has since been deleted (404) simply resolves to "no detail" instead of
 * failing the whole tab — the row then falls back to its note / id.
 *
 * @param resourceIds - ids to hydrate (deduped + sorted into the cache key).
 * @returns a `resourceId → detail` map (empty until the join resolves).
 */
export const useGroupResourceDetailsSwr = (
    resourceIds: Array<string>,
): Record<string, GroupResourceDetail> => {
    const idsKey = Array.from(new Set(resourceIds)).sort().join(",")

    const { data } = useSWR(
        idsKey === "" ? null : ["GROUP_RESOURCE_DETAILS", idsKey],
        async (): Promise<Record<string, GroupResourceDetail>> => {
            const ids = idsKey.split(",")
            const settled = await Promise.allSettled(
                ids.map((id) => getResourceDetail(id)),
            )
            const map: Record<string, GroupResourceDetail> = {}
            settled.forEach((result, index) => {
                if (result.status === "fulfilled" && result.value) {
                    map[ids[index]] = {
                        title: result.value.title,
                        type: result.value.type,
                    }
                }
            })
            return map
        },
        { revalidateOnFocus: false },
    )

    return data ?? {}
}
