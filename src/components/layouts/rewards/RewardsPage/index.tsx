"use client"

import React, {
    useCallback,
    useState,
} from "react"
import {
    Button,
    Spinner,
    cn,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    Gift as GiftIcon,
    Snowflake as SnowflakeIcon,
    ShoppingBag as ShoppingBagIcon,
} from "@gravity-ui/icons"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useMutateRedeemRewardSwr } from "@/hooks/swr/api/graphql/mutations/useMutateRedeemRewardSwr"
import { useQueryMyRewardWalletSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyRewardWalletSwr"
import { useQueryRewardsSwr } from "@/hooks/swr/api/graphql/queries/useQueryRewardsSwr"
import { useGraphQLWithToast } from "@/modules/toast/hooks"
import { SectionCard } from "@/components/reuseable/SectionCard"
import type { QueryRewardData } from "@/modules/api/graphql/queries/types/rewards"

/** The streak-freeze reward key (drives its distinct icon). */
const STREAK_FREEZE_KEY = "streakFreeze"

/** Props for {@link RewardsPage}. */
export type RewardsPageProps = WithClassNames<undefined>

/**
 * The "điểm quà" gifts store page: the viewer's spendable reward-point balance on
 * top, a catalog grid of redeemable rewards (digital + physical), and their past
 * redemptions. Spending reward points never touches the lifetime points that drive
 * the league/leaderboard. Self-fetches catalog + wallet; redeems via the mutation.
 * @param props - optional className for the root element.
 */
export const RewardsPage = ({
    className,
}: RewardsPageProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const runGraphQL = useGraphQLWithToast()
    const { data: rewards } = useQueryRewardsSwr()
    const {
        data: wallet,
        mutate: mutateWallet,
    } = useQueryMyRewardWalletSwr()
    const { trigger: triggerRedeem } = useMutateRedeemRewardSwr()
    /** The reward key currently being redeemed (single in-flight redeem). */
    const [redeeming, setRedeeming] = useState<string | null>(null)
    /** The physical reward whose shipping form is open (null = none). */
    const [shippingFor, setShippingFor] = useState<string | null>(null)
    /** Shipping form fields (for physical rewards). */
    const [ship, setShip] = useState({
        recipientName: "",
        phone: "",
        address: "",
    })

    const balance = wallet?.balance ?? 0

    /** Redeem one reward (with shipping for physical), toast, then revalidate. */
    const onRedeem = useCallback(
        async (rewardKey: string, shipping?: typeof ship) => {
            setRedeeming(rewardKey)
            try {
                const ok = await runGraphQL(async () => {
                    const result = await triggerRedeem({
                        rewardKey,
                        ...shipping,
                    })
                    return result.data!.redeemReward
                })
                if (ok) {
                    await mutateWallet()
                    // close + reset the shipping form on success
                    setShippingFor(null)
                    setShip({
                        recipientName: "",
                        phone: "",
                        address: "",
                    })
                }
            } finally {
                setRedeeming(null)
            }
        },
        [
            triggerRedeem,
            mutateWallet,
            runGraphQL,
        ],
    )

    /** Pick the card icon for a reward by its key/kind. */
    const iconFor = (reward: QueryRewardData) => {
        if (reward.key === STREAK_FREEZE_KEY) {
            return <SnowflakeIcon className="size-5 text-accent" />
        }
        return <GiftIcon className="size-5 text-accent" />
    }

    // first load — catalog not back yet
    if (!rewards) {
        return (
            <div className="flex justify-center p-12">
                <Spinner size="lg" />
            </div>
        )
    }

    return (
        <div className={cn("mx-auto flex w-full max-w-3xl flex-col gap-6 p-3", className)}>
            {/* header + balance */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-1.5">
                    <ShoppingBagIcon className="size-5 text-accent" />
                    <h1 className="text-lg font-semibold text-foreground">
                        {t("rewards.title")}
                    </h1>
                </div>
                <div className="flex flex-col gap-0 rounded-large bg-accent/10 p-3">
                    <span className="text-base font-semibold text-foreground">
                        {t("rewards.balance", {
                            count: balance,
                        })}
                    </span>
                    <span className="text-xs text-muted">
                        {t("rewards.balanceNote")}
                    </span>
                </div>
            </div>

            {/* catalog grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {rewards.map((reward) => {
                    const affordable = balance >= reward.cost
                    const isPhysical = reward.kind === "physical"
                    const formOpen = shippingFor === reward.key
                    // physical rewards need a complete shipping form before redeem
                    const shipReady = Boolean(
                        ship.recipientName.trim()
                        && ship.phone.trim()
                        && ship.address.trim(),
                    )
                    return (
                        <SectionCard
                            key={reward.key}
                            icon={iconFor(reward)}
                            title={reward.title}
                        >
                            <span className="text-sm text-muted">
                                {reward.description}
                            </span>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-semibold text-foreground">
                                    {t("rewards.cost", {
                                        count: reward.cost,
                                    })}
                                </span>
                                {!formOpen ? (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        isDisabled={!affordable || redeeming !== null}
                                        isPending={redeeming === reward.key}
                                        onPress={() => {
                                            // physical → open the shipping form first
                                            if (isPhysical) {
                                                setShippingFor(reward.key)
                                            } else {
                                                void onRedeem(reward.key)
                                            }
                                        }}
                                    >
                                        {affordable
                                            ? t("rewards.redeem")
                                            : t("rewards.cannotAfford")}
                                    </Button>
                                ) : null}
                            </div>

                            {/* shipping form for a physical reward being redeemed */}
                            {formOpen ? (
                                <div className="flex flex-col gap-1.5">
                                    <input
                                        value={ship.recipientName}
                                        onChange={(event) => setShip((prev) => ({
                                            ...prev,
                                            recipientName: event.target.value,
                                        }))}
                                        placeholder={t("rewards.shipName")}
                                        className="rounded-medium border border-default/40 bg-transparent px-3 py-1.5 text-sm text-foreground outline-none focus:border-accent"
                                    />
                                    <input
                                        value={ship.phone}
                                        onChange={(event) => setShip((prev) => ({
                                            ...prev,
                                            phone: event.target.value,
                                        }))}
                                        placeholder={t("rewards.shipPhone")}
                                        className="rounded-medium border border-default/40 bg-transparent px-3 py-1.5 text-sm text-foreground outline-none focus:border-accent"
                                    />
                                    <input
                                        value={ship.address}
                                        onChange={(event) => setShip((prev) => ({
                                            ...prev,
                                            address: event.target.value,
                                        }))}
                                        placeholder={t("rewards.shipAddress")}
                                        className="rounded-medium border border-default/40 bg-transparent px-3 py-1.5 text-sm text-foreground outline-none focus:border-accent"
                                    />
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            isDisabled={!shipReady || redeeming !== null}
                                            isPending={redeeming === reward.key}
                                            onPress={() => void onRedeem(reward.key, ship)}
                                        >
                                            {t("rewards.confirmRedeem")}
                                        </Button>
                                        <Button
                                            variant="tertiary"
                                            size="sm"
                                            onPress={() => setShippingFor(null)}
                                        >
                                            {t("rewards.cancel")}
                                        </Button>
                                    </div>
                                </div>
                            ) : null}
                        </SectionCard>
                    )
                })}
            </div>

            {/* redemption history */}
            <div className="flex flex-col gap-3">
                <h2 className="text-base font-semibold text-foreground">
                    {t("rewards.redeemedTitle")}
                </h2>
                {wallet && wallet.redemptions.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                        {wallet.redemptions.map((redemption, index) => (
                            <div
                                key={`${redemption.rewardKey}-${redemption.createdAt}-${index}`}
                                className="flex items-center justify-between gap-3 rounded-medium border border-default/40 px-3 py-1.5"
                            >
                                <div className="flex min-w-0 flex-col gap-0">
                                    <span className="truncate text-sm text-foreground">
                                        {redemption.title}
                                    </span>
                                    <span className="text-xs text-muted">
                                        {new Date(redemption.createdAt).toLocaleDateString(locale)}
                                    </span>
                                </div>
                                <div className="flex shrink-0 items-center gap-3">
                                    <span className="text-xs text-muted">
                                        {t(`rewards.status.${redemption.status}`)}
                                    </span>
                                    <span className="text-xs font-medium text-foreground">
                                        {t("rewards.cost", {
                                            count: redemption.cost,
                                        })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <span className="text-sm text-muted">
                        {t("rewards.noRedemptions")}
                    </span>
                )}
            </div>
        </div>
    )
}
