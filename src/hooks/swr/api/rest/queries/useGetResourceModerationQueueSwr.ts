"use client"

import useSWR from "swr"
import {
    getResourceModerationQueue,
    type ResourcePageResponse,
    type ResourceSummary,
} from "@/modules/api/rest/resource"

/**
 * SWR query wrapper for {@link getResourceModerationQueue}.
 */
export const useGetResourceModerationQueueSwr = (params?: {
    page?: number
    size?: number
}) => {
    const swr = useSWR<ResourcePageResponse<ResourceSummary>, Error>(
        ["GET_RESOURCE_MODERATION_QUEUE_SWR", params?.page, params?.size],
        () => getResourceModerationQueue(params),
    )

    return swr
}
