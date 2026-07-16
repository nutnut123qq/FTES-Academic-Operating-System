import useSWR from "swr"
import { queryActiveAdvertisement } from "@/modules/api/graphql/queries/query-active-advertisement"
import type { QueryActiveAdvertisementRequest } from "@/modules/api/graphql/queries/types/active-advertisement"

/**
 * SWR query wrapper for {@link queryActiveAdvertisement}. `data` is the active
 * banner for the given placement (defaults to the dashboard right rail), or
 * `null` when none is active. The result is already null for ad-free viewers
 * (when `courseId` is passed, viewers enrolled in that course are exempted for
 * lesson placements), so callers only need `data ? render : hide`.
 *
 * The cache key includes the placement + course so each slot caches separately.
 */
export const useQueryActiveAdvertisementSwr = (
    request?: QueryActiveAdvertisementRequest,
) => {
    return useSWR(
        [
            "QUERY_ACTIVE_ADVERTISEMENT_SWR",
            request?.placement ?? null,
            request?.courseId ?? null,
        ],
        async () => {
            const result = await queryActiveAdvertisement({
                request,
            })
            // BE trả Advertisement TRỰC TIẾP (không envelope); null = không có ad / miễn trừ.
            return result.data?.activeAdvertisement ?? null
        },
    )
}
