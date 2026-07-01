"use client"

import React from "react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    LeagueCardSkeleton,
} from "./LeagueCardSkeleton"
import {
    LeagueCardContent,
} from "./LeagueCardContent"
import { useQueryMyLeagueSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyLeagueSwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"

/** Props for {@link LeagueCard}. */
export interface LeagueCardProps extends WithClassNames<undefined> {
    /**
     * When true, render the league inside a `LabeledCard` (title as a Label OUTSIDE
     * the card) instead of the flat inline heading — used on the dashboard Community
     * tab so it matches the other LabeledCard sections. Defaults to the flat layout
     * (the standalone /league page).
     */
    framed?: boolean
}

/**
 * Compact weekly-league card for the dashboard. Thin container: self-fetches the
 * league leaf query and runs the standard {@link AsyncContent} switch — a
 * layout-mirroring {@link LeagueCardSkeleton} while loading, self-hiding (no
 * emptyContent) until the viewer is placed in a cohort, then {@link LeagueCardContent}
 * once resolved. `isLoading` uses the nullish form so the skeleton holds until data
 * actually arrives (and never on a falsy-but-valid value).
 * @param props - {@link LeagueCardProps}
 */
export const LeagueCard = ({
    className,
    framed = false,
}: LeagueCardProps) => {
    const { data, isLoading } = useQueryMyLeagueSwr()
    // nothing to show until the viewer is placed in a cohort (self-hide → no emptyContent)
    const isEmpty = data === null || data === undefined || data.entries.length === 0

    return (
        <AsyncContent
            isLoading={data === null || data === undefined || isLoading}
            skeleton={<LeagueCardSkeleton className={className} />}
            isEmpty={isEmpty}
        >
            {data ? (
                <LeagueCardContent
                    data={data}
                    framed={framed}
                    className={className}
                />
            ) : null}
        </AsyncContent>
    )
}

export default LeagueCard
