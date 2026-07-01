"use client"

import React, { useMemo } from "react"
import {
    useTranslations,
} from "next-intl"
import {
    FoundationCard,
} from "../FoundationCard"
import {
    FoundationCardSkeleton,
} from "../FoundationCardSkeleton"
import {
    compareFoundations,
} from "../utils"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useAppSelector } from "@/redux/hooks"
import { useQueryFoundationsSwr } from "@/hooks/swr/api/graphql/queries/useQueryFoundationsSwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { SurfaceListCard } from "@/components/blocks/cards/SurfaceListCard"

/** Props for {@link FoundationsList}. */
export type FoundationsListProps = WithClassNames<undefined>

/** Number of skeleton rows shown while the resources load. */
const SKELETON_ROWS = 6

/**
 * Foundations master list: reads from Redux + SWR; shows skeletons while loading,
 * empty state, or the joined link-and-caret list.
 * @param props.className - Optional root class names.
 */
export const FoundationsList = ({
    className,
}: FoundationsListProps) => {
    const t = useTranslations()
    const foundations = useAppSelector((state) => state.foundation.entities)
    const { data: foundationsData, isLoading, error } = useQueryFoundationsSwr()
    const isFirstLoad = (isLoading && !foundationsData) || foundations === undefined

    /** Foundations sorted into display order (StarCi video → roadmap → cheatsheet → rest). */
    const sortedFoundations = useMemo(() => {
        if (!foundations?.length) {
            return []
        }
        return [...foundations].sort(compareFoundations)
    }, [foundations])

    return (
        <AsyncContent
            isLoading={isFirstLoad}
            error={!foundationsData ? error : undefined}
            errorContent={{ title: t("foundations.empty") }}
            isEmpty={sortedFoundations.length === 0}
            emptyContent={{ title: t("foundations.empty") }}
            skeleton={(
                <SurfaceListCard className={className}>
                    {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
                        <FoundationCardSkeleton
                            key={index}
                            divider={index < SKELETON_ROWS - 1}
                        />
                    ))}
                </SurfaceListCard>
            )}
        >
            <SurfaceListCard className={className}>
                {sortedFoundations.map((foundation, index) => (
                    <FoundationCard
                        key={foundation.id}
                        foundation={foundation}
                        displayIndex={index}
                    />
                ))}
            </SurfaceListCard>
        </AsyncContent>
    )
}
