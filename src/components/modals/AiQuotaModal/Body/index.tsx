"use client"

import React from "react"
import {
    AiQuotaAutoTab,
} from "../AutoTab"
import {
    AiQuotaHistoryTab,
} from "../HistoryTab"
import {
    AiQuotaSubscriptionTab,
} from "../SubscriptionTab"
import { useAppSelector } from "@/redux/hooks"
import { AiQuotaTab } from "@/redux/slices/tabs"

/**
 * AI quota modal body — renders the active tab panel from Redux.
 */
export const AiQuotaBody = () => {
    const tab = useAppSelector((state) => state.tabs.aiQuotaTab)

    switch (tab) {
    case AiQuotaTab.Auto:
        return <AiQuotaAutoTab />
    case AiQuotaTab.Subscription:
        return <AiQuotaSubscriptionTab />
    case AiQuotaTab.History:
        return <AiQuotaHistoryTab />
    default:
        return <AiQuotaAutoTab />
    }
}
