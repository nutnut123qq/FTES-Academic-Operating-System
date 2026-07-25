"use client"

import useSWR from "swr"
import { getModerationQueue } from "@/modules/api/rest/community"
import type { ModerationQueueResponse } from "@/modules/api/rest/community"

/** A moderation queue item (mapped from the BE `ModerationQueueResponse`). */
export interface ModerationReport {
    /** Queue-row id — what a keep/remove DECISION is addressed to. */
    id: string
    /**
     * Id of the report behind the row, or `undefined` when the row came from AI/the
     * system with no open report. Escalation uses THIS id, never {@link id}.
     */
    reportId?: string
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
    // null (no report behind the row) is normalized to undefined so the renderer has ONE
    // "nothing to escalate" shape to test.
    reportId: item.reportId ?? undefined,
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
