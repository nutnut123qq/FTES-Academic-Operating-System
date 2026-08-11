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
    /** `POST` | `COMMENT` | `USER` — an enum token, translated before it is rendered. */
    targetType: string
    /**
     * Id of the reported object. NOT for display (it is a bare uuid): it only builds the
     * link to the target, and only a POST has a route that takes it (`/community/[postId]`).
     */
    targetId: string
    /** `REPORT` | `AI` — an enum token, translated before it is rendered. */
    source: string
    /** BE `Short`: 0 = AI saw nothing, 1 = member report, 2 = AI flagged a violation. */
    priority?: number
    status: string
    createdAt?: string
    /**
     * Quote of the reported content — PLAIN TEXT the BE already stripped of markup/links and
     * cut to 200 chars. Render it as-is (no second strip, no markdown/HTML rendering).
     * `undefined` when the target is gone and there is nothing to quote.
     */
    targetExcerpt?: string
    /** Poster's resolved display name, or `undefined` when the BE could not resolve one. */
    targetAuthorName?: string
    /** Report reason (`reasonCode`, plus `": <detail>"`), or `undefined` on an AI-raised row. */
    reportReason?: string
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
    // Same normalization as reportId: the three context fields are nullable on the wire, and
    // the renderer tests ONE "nothing to show" shape before it draws a row.
    targetExcerpt: item.targetExcerpt ?? undefined,
    targetAuthorName: item.targetAuthorName ?? undefined,
    reportReason: item.reportReason ?? undefined,
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
