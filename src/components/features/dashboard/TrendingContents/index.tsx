"use client"

import React from "react"
import {
    useTranslations,
} from "next-intl"
import {
    FlameIcon,
} from "@phosphor-icons/react"
import {
    TrendingRow,
} from "./TrendingRow"
import {
    TrendingContentsSkeleton,
} from "./TrendingContentsSkeleton"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { SurfaceListCard } from "@/components/blocks/cards/SurfaceListCard"
import { useQueryTrendingContentsSwr } from "@/hooks/swr/api/graphql/queries/useQueryTrendingContentsSwr"

/** Props for {@link TrendingContents}. */
export type TrendingContentsProps = WithClassNames<undefined>

/**
 * "Trending this week" discovery card for the explore feed — the lessons read
 * most across the platform in the last 7 days, as clickable route tokens. Turns
 * the explore tab from a social stream into "find something to learn".
 * Self-fetches its own leaf query (layout container — no data props); shows a
 * skeleton while loading, then hides itself when there's nothing trending.
 * @param props - optional className for the root element.
 */
export const TrendingContents = ({
    className,
}: TrendingContentsProps) => {
    const t = useTranslations()
    const { data, isLoading } = useQueryTrendingContentsSwr()

    return (
        // skeleton while loading; hide when nothing trends (empty / error → no
        // emptyContent/errorContent → renders null).
        <AsyncContent
            isLoading={isLoading}
            skeleton={<TrendingContentsSkeleton className={className} />}
            isEmpty={!data || data.length === 0}
        >
            <LabeledCard
                frameless
                className={className}
                label={t("dashboard.trending.title")}
                icon={<FlameIcon aria-hidden focusable="false" className="size-5 text-accent" />}
            >
                <SurfaceListCard>
                    {(data ?? []).map((item, index) => (
                        <TrendingRow
                            key={item.globalId}
                            rank={index + 1}
                            title={item.title}
                            globalId={item.globalId}
                        />
                    ))}
                </SurfaceListCard>
            </LabeledCard>
        </AsyncContent>
    )
}
