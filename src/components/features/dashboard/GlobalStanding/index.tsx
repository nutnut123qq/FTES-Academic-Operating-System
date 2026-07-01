"use client"

import React, {
    useCallback,
} from "react"
import {
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
    pathConfig,
} from "@/resources/path"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    GlobalStandingSkeleton,
} from "./GlobalStandingSkeleton"
import { useQueryGlobalLeaderboardSwr } from "@/hooks/swr/api/graphql/queries/useQueryGlobalLeaderboardSwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"

/** Props for {@link GlobalStanding}. */
export type GlobalStandingProps = WithClassNames<undefined>

/**
 * Dashboard "Community" tab — the viewer's standing across the WHOLE platform
 * (one rank line), distinct from the weekly league cohort. Self-fetches the global
 * leaderboard; shows a skeleton while loading and self-hides once resolved without
 * a global rank. A "see more" link opens the full board.
 * @param props - {@link GlobalStandingProps}
 */
export const GlobalStanding = ({
    className,
}: GlobalStandingProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const { data, isLoading } = useQueryGlobalLeaderboardSwr()

    /** Open the full leaderboard page. */
    const onSeeMore = useCallback(
        () => router.push(pathConfig().locale(locale).league().build()),
        [router, locale],
    )

    // empty (after load) when the viewer has no global rank
    const isEmpty = !data || data.myRank === null || data.myRank === undefined

    return (
        <AsyncContent
            isLoading={data === null || data === undefined || isLoading}
            skeleton={<GlobalStandingSkeleton className={className} />}
            isEmpty={isEmpty}
        >
            {!isEmpty && data ? (
                <LabeledCard
                    label={t("dashboard.community.globalStanding.title")}
                    onSeeMore={onSeeMore}
                    seeMoreLabel={t("dashboard.community.globalStanding.seeMore")}
                    className={className}
                >
                    <Typography type="body">
                        {t("dashboard.community.globalStanding.line", {
                            rank: data.myRank,
                            points: data.myPoints,
                        })}
                    </Typography>
                </LabeledCard>
            ) : null}
        </AsyncContent>
    )
}
