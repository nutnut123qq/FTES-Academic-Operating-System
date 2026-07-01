"use client"

import React, {
    useCallback,
    useState,
} from "react"
import {
    Button,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    Snowflake as SnowflakeIcon,
} from "@gravity-ui/icons"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useMutateRedeemRewardSwr } from "@/hooks/swr/api/graphql/mutations/useMutateRedeemRewardSwr"
import { useQueryMyWeeklyStatsSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyWeeklyStatsSwr"
import { useGraphQLWithToast } from "@/modules/toast/hooks"
import { SectionCard } from "@/components/reuseable/SectionCard"

/** Maximum number of streak freezes a user may own. */
const MAX_FREEZES = 3

/** Points cost of one streak freeze. */
const FREEZE_COST = 100

/** Props for {@link StreakFreezeCard}. */
export type StreakFreezeCardProps = WithClassNames<undefined>

/**
 * Right-rail "streak freeze" card. A freeze keeps the daily streak alive when the
 * viewer misses a single day; this card shows how many they own (of
 * {@link MAX_FREEZES}) and lets them buy another for {@link FREEZE_COST} points.
 * Owns the `buyStreakFreeze` mutation (toasting the result) and revalidates the
 * shared `myWeeklyStats` leaf query on success. Self-fetches its own stats;
 * renders nothing until they are known.
 * @param props - optional className for the root element.
 */
export const StreakFreezeCard = ({
    className,
}: StreakFreezeCardProps) => {
    const t = useTranslations()
    const { data, mutate } = useQueryMyWeeklyStatsSwr()
    const { trigger: triggerRedeem } = useMutateRedeemRewardSwr()
    const runGraphQL = useGraphQLWithToast()
    // whether a purchase is currently in flight
    const [buying, setBuying] = useState(false)

    /** Buy one freeze, toast the result, then revalidate the weekly stats. */
    const onBuy = useCallback(
        async () => {
            setBuying(true)
            try {
                const ok = await runGraphQL(async () => {
                    const result = await triggerRedeem({
                        rewardKey: "streakFreeze",
                    })
                    return result.data!.redeemReward
                })
                if (ok) {
                    await mutate()
                }
            } finally {
                setBuying(false)
            }
        },
        [
            triggerRedeem,
            mutate,
            runGraphQL,
        ],
    )

    // signed out / not loaded → no card
    if (!data) {
        return null
    }

    const owned = data.streakFreezes
    const full = owned >= MAX_FREEZES

    return (
        <SectionCard
            icon={<SnowflakeIcon className="size-5 text-accent" />}
            title={t("streakFreeze.title")}
            className={className}
        >
            <span className="text-sm font-medium text-foreground">
                {t("streakFreeze.owned", {
                    count: owned,
                    max: MAX_FREEZES,
                })}
            </span>
            <span className="text-xs text-muted">
                {t("streakFreeze.explainer")}
            </span>
            <Button
                variant="tertiary"
                size="sm"
                isDisabled={full || buying}
                isPending={buying}
                onPress={() => void onBuy()}
            >
                {full
                    ? t("streakFreeze.full")
                    : t("streakFreeze.buy", {
                        cost: FREEZE_COST,
                    })}
            </Button>
        </SectionCard>
    )
}
