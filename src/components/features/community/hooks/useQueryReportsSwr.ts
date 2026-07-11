"use client"

import useSWR from "swr"
import { getModerationQueue } from "@/modules/api/rest/community"
import type { ModerationQueueResponse } from "@/modules/api/rest/community"

/** A moderation queue item (mapped from the BE `ModerationQueueResponse`). */
export interface ModerationReport {
    id: string
    targetType: string
    targetId: string
    source: string
    priority?: number
    status: string
    createdAt?: string
}

/** SWR cache key for the moderation queue — shared with the decision mutation. */
export const MODERATION_QUEUE_KEY = ["community-moderation-queue"]

/** Only PENDING items are actionable in the queue. */
const QUEUE_STATUS = "PENDING"

const toReport = (item: ModerationQueueResponse): ModerationReport => ({
    id: item.id,
    targetType: item.targetType,
    targetId: item.targetId,
    source: item.source,
    priority: item.priority,
    status: item.status,
    createdAt: item.createdAt,
})

/**
 * Loads the moderation queue from the real BE
 * `GET /api/v1/community/moderation/queue?status=PENDING`.
 *
 * The endpoint requires the `community.moderate` permission (403 otherwise), so
 * the caller passes `enabled` (its `useHasPermission` result); when the viewer
 * lacks the permission the key is `null` and no request fires — the list falls
 * back to its empty state.
 *
 * @param enabled - whether the viewer holds `community.moderate`.
 */
export const useQueryReportsSwr = (enabled = true) => {
    const { data, isLoading, error, mutate } = useSWR<Array<ModerationReport>>(
        enabled ? MODERATION_QUEUE_KEY : null,
        async () => {
            const items = await getModerationQueue({ status: QUEUE_STATUS })
            return items.map(toReport)
        },
    )
    return { reports: data ?? [], isLoading, error, mutate }
}
