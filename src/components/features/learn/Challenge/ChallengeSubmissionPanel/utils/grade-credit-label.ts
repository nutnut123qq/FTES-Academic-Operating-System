import type {
    useTranslations,
} from "next-intl"
import type {
    QueryMyCreditUsageResponseData,
} from "@/modules/api/graphql/queries/types/my-credit-usage"
import {
    GradeCreditDisplayKind,
} from "../types/grade-credit-display"
import type {
    GradeCreditDisplay,
} from "../types/grade-credit-display"
import { AiMode } from "@/modules/api/graphql/queries/query-my-ai-settings"

/** Params for {@link resolveGradeCreditDisplay}. */
export interface ResolveGradeCreditDisplayParams {
    /** Grading lane selected for this submission row. */
    mode: AiMode
    /** Credit usage snapshot from `myCreditUsage`; omitted when still loading. */
    creditUsage: QueryMyCreditUsageResponseData | undefined
    /** Credits per Auto run from `systemConfig.ai.auto.creditCost` (app.yaml). */
    autoCreditCost: number | undefined
    /** next-intl translator. */
    t: ReturnType<typeof useTranslations>
}

/**
 * Whether the next Auto grading cannot be afforded in either rolling window.
 * @param creditUsage - Snapshot from `myCreditUsage`.
 * @param autoCreditCost - Cost per run from mounted app config.
 * @returns True when either window has fewer remaining credits than one run.
 */
const isAutoGradingBlocked = (
    creditUsage: QueryMyCreditUsageResponseData,
    autoCreditCost: number,
): boolean => {
    return creditUsage.window5h.remainingCredits < autoCreditCost
        || creditUsage.windowWeek.remainingCredits < autoCreditCost
}

/**
 * Compact credit label beside the grade picker (usage line or quota-reached).
 * @param params - {@link ResolveGradeCreditDisplayParams}
 * @returns Display model for the submission row.
 */
export const resolveGradeCreditDisplay = ({
    mode,
    creditUsage,
    autoCreditCost,
    t,
}: ResolveGradeCreditDisplayParams): GradeCreditDisplay => {
    if (mode === AiMode.Byok) {
        return {
            kind: GradeCreditDisplayKind.Byok,
            text: t("challenge.quota.laneUsage.byok"),
        }
    }
    if (!creditUsage) {
        return { kind: GradeCreditDisplayKind.Hidden }
    }
    if (
        mode === AiMode.Auto
        && autoCreditCost !== undefined
        && isAutoGradingBlocked(creditUsage, autoCreditCost)
    ) {
        return {
            kind: GradeCreditDisplayKind.QuotaReached,
            text: t("challenge.quota.quotaReached"),
        }
    }
    const key = mode === AiMode.Premium
        ? "challenge.quota.laneUsage.premium"
        : "challenge.quota.laneUsage.auto"
    return {
        kind: GradeCreditDisplayKind.Usage,
        text: t(key, {
            used: creditUsage.windowWeek.usedCredits,
            quota: creditUsage.windowWeek.quota,
        }),
    }
}
