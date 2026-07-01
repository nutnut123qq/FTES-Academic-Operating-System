"use client"

import React, {
    useCallback,
} from "react"
import {
    Button,
    Skeleton,
} from "@heroui/react"
import {
    useTranslations,
    useLocale,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import {
    QuotaLane,
} from "../QuotaLane"
import {
    QuotaLaneVariant,
} from "../types"
import { useAiQuotaOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useQueryMyAiQuotaSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyAiQuotaSwr"
import { pathConfig } from "@/resources/path"

/**
 * AI quota modal — subscription tab (Premium lane + subscribe CTA).
 */
export const AiQuotaSubscriptionTab = () => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const { setOpen } = useAiQuotaOverlayState()
    const { data: quota, isLoading } = useQueryMyAiQuotaSwr()

    const onSubscribe = useCallback(() => {
        setOpen(false)
        router.push(`${pathConfig().locale(locale).profile().build()}/ai-subscription`)
    }, [
        setOpen,
        router,
        locale,
    ])

    if (isLoading || !quota) {
        return <Skeleton className="h-24 w-full rounded-xl" />
    }

    if (!quota.tier) {
        return (
            <div className="flex flex-col gap-3">
                <p className="text-sm text-muted">
                    {t("aiQuota.subscriptionNone")}
                </p>
                <Button
                    variant="primary"
                    className="self-start"
                    onPress={onSubscribe}
                >
                    {t("aiQuota.subscribeCta")}
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-3">
            <QuotaLane variant={QuotaLaneVariant.Premium} />
            <p className="text-sm text-muted">
                {t("aiQuota.subscriptionActive", { tier: quota.tier.toUpperCase() })}
            </p>
        </div>
    )
}
