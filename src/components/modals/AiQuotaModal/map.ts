import { AiQuotaTab } from "@/redux/slices/tabs"

/** Ordered tabs shown in the AI quota modal. */
export const AI_QUOTA_TAB_ORDER: Array<AiQuotaTab> = [
    AiQuotaTab.Auto,
    AiQuotaTab.Subscription,
    AiQuotaTab.History,
]

/** next-intl keys for each {@link AiQuotaTab} label. */
export const AI_QUOTA_TAB_LABEL_KEY_MAP: Record<AiQuotaTab, string> = {
    [AiQuotaTab.Auto]: "aiQuota.tabs.auto",
    [AiQuotaTab.Subscription]: "aiQuota.tabs.subscription",
    [AiQuotaTab.History]: "aiQuota.tabs.history",
}
