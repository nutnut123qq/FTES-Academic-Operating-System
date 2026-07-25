"use client"

import { useCallback, useMemo } from "react"
import useSWR, { useSWRConfig } from "swr"
import { useTranslations } from "next-intl"
import { toast } from "@heroui/react"
import { RestError } from "@/modules/api/rest/client"
import { usePostEscalateCommunityReportSwr } from "@/hooks/swr/api/rest/mutations"
import { communityErrorMessageKey } from "../CommunityPostDetail/hooks/community-error-message"

/**
 * Cache key of the report ids this session already escalated. Client-side ONLY: the BE
 * escalate op moves the REPORT to `IN_REVIEW` and leaves the queue row PENDING (with its
 * `report_id` link intact), so nothing in `GET /moderation/queue` says "already
 * escalated" — every revalidate would otherwise re-offer the action and the second press
 * 409s.
 */
export const ESCALATED_REPORTS_KEY = ["community-moderation-escalated"]

/**
 * The report ids escalated in this session.
 *
 * Held in the SWR cache (no fetcher — the key is never revalidated) rather than in the
 * queue rows themselves so it SURVIVES a queue refetch: the row comes back PENDING, but
 * the moderator still sees that they already handed it to the appeal workflow.
 *
 * @returns `isEscalated(reportId)`.
 */
export const useEscalatedReports = () => {
    const { data } = useSWR<Array<string>>(ESCALATED_REPORTS_KEY, null, {
        fallbackData: [],
    })
    const escalated = useMemo(() => new Set(data ?? []), [data])
    return useCallback(
        (reportId: string | null | undefined): boolean =>
            Boolean(reportId) && escalated.has(reportId as string),
        [escalated],
    )
}

/**
 * Escalates a moderation queue row to the appeal workflow via the real BE
 * `POST /api/v1/community/reports/{reportId}/escalate` (moderator only).
 *
 * TWO DIFFERENT IDS: the queue row is addressed by its own id for a decision, but
 * escalation takes the id of the REPORT behind it (`ModerationQueueResponse.reportId`,
 * NULLABLE) — passing the queue-row id there 404s. The caller therefore only offers the
 * action on rows that carry a `reportId`, and hands THAT id here.
 *
 * THE ROW STAYS. Escalating does not resolve the queue item server-side (the BE only
 * flips the report to `IN_REVIEW`), so dropping the row optimistically only hid work that
 * came straight back on the next revalidate — with its "Chuyển cấp" button armed for a
 * guaranteed 409. Instead the report id is recorded in {@link ESCALATED_REPORTS_KEY} and
 * the row renders as "đã chuyển cấp" while keeping its keep/remove decision.
 *
 * 409 counts as success: it means the report is already in the appeal workflow, i.e. the
 * outcome the moderator wanted, so the row gets marked all the same. 403 / 404 / 429 get
 * their own message via {@link communityErrorMessageKey} and leave the row untouched.
 *
 * @returns `escalate(reportId)` resolving `true` when the report is in the workflow
 * (freshly escalated or already there).
 */
export const useMutateEscalateReportSwr = () => {
    const t = useTranslations("communityHub")
    const { mutate } = useSWRConfig()
    const { trigger } = usePostEscalateCommunityReportSwr()

    return useCallback(
        async (reportId: string): Promise<boolean> => {
            const markEscalated = () =>
                mutate<Array<string>>(
                    ESCALATED_REPORTS_KEY,
                    (current) =>
                        current?.includes(reportId) ? current : [...(current ?? []), reportId],
                    { revalidate: false },
                )

            try {
                await trigger(reportId)
            } catch (error) {
                // already escalated → the report IS in the workflow; mark it like a success
                if (error instanceof RestError && error.status === 409) {
                    await markEscalated()
                    toast.warning(t("moderation.escalateAlready"))
                    return true
                }
                toast.danger(t(communityErrorMessageKey(error, "moderation.escalateFailed")))
                return false
            }

            await markEscalated()
            toast.success(t("moderation.escalated"))
            return true
        },
        [mutate, t, trigger],
    )
}
