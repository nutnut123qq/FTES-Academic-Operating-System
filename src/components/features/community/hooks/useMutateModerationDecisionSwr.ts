"use client"

import { useCallback } from "react"
import { useSWRConfig } from "swr"
import { useTranslations } from "next-intl"
import { toast } from "@heroui/react"
import { decideModeration } from "@/modules/api/rest/community"
import { MODERATION_QUEUE_KEY, type ModerationReport } from "./useQueryReportsSwr"

/** The BE moderation actions surfaced by the queue's keep / remove controls. */
export type ModerationDecision = "APPROVE" | "REMOVE"

/**
 * Applies a moderation decision on a queue item via the real BE
 * `POST /api/v1/community/moderation/queue/{id}/decision` (moderator only).
 *
 * `APPROVE` keeps the content (and rejects the linked reports); `REMOVE` takes it
 * down. The row is optimistically dropped from the queue cache
 * (`MODERATION_QUEUE_KEY`); ANY write failure rolls the row back and toasts.
 */
export const useMutateModerationDecisionSwr = () => {
    const t = useTranslations("communityHub")
    const { mutate } = useSWRConfig()

    return useCallback(
        async (id: string, action: ModerationDecision) => {
            let snapshot: Array<ModerationReport> | undefined

            await mutate<Array<ModerationReport>>(
                MODERATION_QUEUE_KEY,
                (current) => {
                    snapshot = current
                    return current?.filter((report) => report.id !== id)
                },
                { revalidate: false },
            )

            try {
                await decideModeration(id, { action })
            } catch {
                await mutate(MODERATION_QUEUE_KEY, snapshot, { revalidate: false })
                toast.danger(t("moderation.decisionFailed"))
            }
        },
        [mutate, t],
    )
}
