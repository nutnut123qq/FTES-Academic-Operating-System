"use client"

import React from "react"
import {
    cn,
} from "@heroui/react"
import {
    FreeTierCard,
} from "../FreeTierCard"
import {
    TierCard,
} from "./TierCard"
import { useQueryAiSubscriptionTiersSwr } from "@/hooks/swr/api/graphql/queries/useQueryAiSubscriptionTiersSwr"
import { useQueryMyAiSettingsSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyAiSettingsSwr"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link TierGrid}. */
export type TierGridProps = WithClassNames<undefined>

/**
 * Responsive grid of subscription tiers: the static free tier followed by the
 * purchasable paid tiers.
 *
 * Container: reads eligible tiers from the AI subscription SWR singleton and
 * the user's current tier from the AI settings SWR singleton. Each
 * {@link TierCard} is a list item that self-opens the payment overlay for the
 * buy action.
 * @param props.className - Optional wrapper class merged into the root element.
 */
export const TierGrid = ({
    className,
}: TierGridProps) => {
    const { data: tiersData } = useQueryAiSubscriptionTiersSwr()
    const { data: mySettings } = useQueryMyAiSettingsSwr()

    /** Purchasable paid tiers from the query (empty until loaded). */
    const tiers = tiersData ?? []
    /** The user's current tier slug, or null for the free tier. */
    const currentTier = mySettings?.tier ?? null

    return (
        <div className={cn("grid grid-cols-1 gap-6 sm:grid-cols-2", className)}>
            <FreeTierCard isCurrent={currentTier === null} />
            {tiers.map((tier) => (
                <TierCard
                    key={tier.tier}
                    tier={tier}
                    isCurrent={currentTier === tier.tier}
                />
            ))}
        </div>
    )
}
