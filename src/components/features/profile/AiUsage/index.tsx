"use client"

import React, {
    useCallback,
    useMemo,
} from "react"
import {
    Button,
    Chip,
    Typography,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import {
    SettingsBreadcrumb,
} from "../Settings/SettingsBreadcrumb"
import {
    QuotaLane,
} from "@/components/modals/AiQuotaModal/QuotaLane"
import {
    AiUsageHistory,
} from "./AiUsageHistory"
import { useQueryMyAiQuotaSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyAiQuotaSwr"
import { pathConfig } from "@/resources/path"
import { AiSubTier } from "@/modules/api/graphql/queries/query-my-ai-settings"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { QuotaLaneVariant } from "@/components/modals/AiQuotaModal/types/quota-lane-variant"

/**
 * Full AI quota / usage page — Auto + Premium lanes and usage history.
 * Mounted by `/[locale]/profile/ai-usage`.
 */
export const AiUsage = () => {
    const t = useTranslations()
    const router = useRouter()
    const locale = useLocale()
    const { data: quota } = useQueryMyAiQuotaSwr()


    const subscriptionHref = useMemo(
        () => `${pathConfig().locale(locale).profile().build()}/ai-subscription`,
        [
            locale,
        ],
    )

    const onSubscribe = useCallback(() => {
        router.push(subscriptionHref)
    }, [
        router,
        subscriptionHref,
    ])

    // upsell prompt under the credit card: free → "buy a plan"; paid-but-not-max →
    // "upgrade"; on the MAX plan there is nothing left to sell, so it hides.
    const tier = quota?.tier ?? null
    const showUpsell = tier !== AiSubTier.Max
    const upsellText = tier
        ? t("aiQuota.upgradeWarning", { tier: tier.toUpperCase() })
        : t("aiQuota.subscriptionNone")
    const upsellCta = tier ? t("aiQuota.upgradeCta") : t("aiQuota.subscribeCta")

    return (
        <div className="flex flex-col gap-10">
            <PageHeader
                breadcrumb={<SettingsBreadcrumb current={t("aiQuota.fullPageTitle")} />}
                title={t("aiQuota.fullPageTitle")}
                description={t("aiQuota.fullPageDescription")}
            />
            <div className="flex flex-col gap-6">

                {/* one unified credit pool (5h + week windows) — the lane it is billed under is a
                backend concern, not a display axis. Only the tier chip sits in the label action;
                the subscribe/upgrade CTA moved below the card into the upsell prompt. */}
                <LabeledCard
                    label={t("aiQuota.creditPool")}
                    action={(
                        <Chip
                            size="sm"
                            variant="soft"
                            color={quota?.tier === "max" ? "warning" : "default"}
                        >
                            <Chip.Label>
                                {quota?.tier
                                    ? quota.tier.toUpperCase()
                                    : t("aiQuota.freeTier")}
                            </Chip.Label>
                        </Chip>
                    )}
                >
                    <QuotaLane variant={QuotaLaneVariant.Premium} />
                </LabeledCard>

                {/* upsell prompt — urges free users to buy / paid users to upgrade; hidden on MAX */}
                {showUpsell ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <Typography type="body-sm" className="text-warning">
                            {upsellText}
                        </Typography>
                        <Button
                            variant="primary"
                            onPress={onSubscribe}
                            className="sm:shrink-0"
                        >
                            {upsellCta}
                        </Button>
                    </div>
                ) : null}

                {/* usage insight — chart / by-provider / history, each its own card */}
                <AiUsageHistory />
            </div>
        </div>
    )
}
