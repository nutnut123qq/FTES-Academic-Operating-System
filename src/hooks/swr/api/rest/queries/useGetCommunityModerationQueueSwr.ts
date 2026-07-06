"use client"

import useSWR from "swr"
import {
    getModerationQueue,
    type ModerationQueueResponse,
} from "@/modules/api/rest/community"

/**
 * SWR query wrapper for {@link getModerationQueue}.
 */
export const useGetCommunityModerationQueueSwr = (params?: {
    status?: string | null
    limit?: number
}) => {
    const swr = useSWR<Array<ModerationQueueResponse>, Error>(
        ["GET_COMMUNITY_MODERATION_QUEUE_SWR", params?.status, params?.limit],
        () => getModerationQueue(params),
    )

    return swr
}
