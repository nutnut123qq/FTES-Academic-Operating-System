"use client"

import { useCallback } from "react"
import { useTranslations } from "next-intl"
import { toast } from "@heroui/react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { report } from "@/modules/api/rest/community"
import type {
    ReportReasonCode,
    ReportTargetType,
} from "@/components/reuseable/PostEngagementBar"
import { communityErrorMessageKey } from "./community-error-message"

/**
 * Reports a post / comment for moderation (`POST /api/v1/community/reports`).
 *
 * Guests get the `AuthenticationModal` and nothing is sent. A duplicate open
 * report (409 `COMMUNITY_DUPLICATE_REPORT`) and the report rate limit (429) get
 * their OWN message — both are expected outcomes a reporter must understand,
 * not a generic failure.
 *
 * @returns `submitReport(targetType, targetId, reasonCode, detail?)` resolving
 * `true` when the report was accepted (the dialog closes) and `false` otherwise
 * (the dialog stays open with the draft intact).
 */
export const useMutateReportContentSwr = () => {
    const t = useTranslations("communityHub")
    const { requireAuth } = useRequireAuth()

    return useCallback(
        async (
            targetType: ReportTargetType,
            targetId: string,
            reasonCode: ReportReasonCode,
            detail?: string,
        ): Promise<boolean> => {
            if (!requireAuth("auth.context.generic")) {
                return false
            }
            try {
                await report({ targetType, targetId, reasonCode, detail })
            } catch (error) {
                toast.danger(t(communityErrorMessageKey(error, "engagement.reportFailed")))
                return false
            }
            toast.success(t("engagement.reportSent"))
            return true
        },
        [requireAuth, t],
    )
}
