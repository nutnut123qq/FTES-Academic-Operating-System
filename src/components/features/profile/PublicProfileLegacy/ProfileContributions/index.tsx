"use client"

import React, {
    useState,
} from "react"
import {
    Typography,
} from "@heroui/react"
import {
    Flame as FireIcon,
} from "@gravity-ui/icons"
import {
    useTranslations,
} from "next-intl"
import {
    useProfileUsername,
} from "../useProfileUsername"
import {
    ContributionCalendarView,
} from "@/components/reuseable/ContributionCalendarView"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useQueryUserContributionCalendarSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserContributionCalendarSwr"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"
import { useQueryUserWeeklyStatsSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserWeeklyStatsSwr"

/** Props for {@link ProfileContributions}. */
export type ProfileContributionsProps = WithClassNames<undefined>

/**
 * A profile owner's contribution heatmap (GitHub-style) plus their streak
 * (current + longest), shown on the public profile so anyone can read another
 * user's learning persistence — a first-class credibility signal for active-but-new
 * learners. Self-contained container: reads the username from the route, resolves
 * it to the entity id the calendar + streak queries key off (the profile fetch is
 * SWR-deduped with the parent + tabs), owns the selected year, and renders the
 * shared {@link ContributionCalendarView} above the streak line.
 *
 * @param props - optional className for the root element.
 */
export const ProfileContributions = ({
    className,
}: ProfileContributionsProps) => {
    const t = useTranslations()
    // route carries the username; resolve it to the entity id the queries key off
    const username = useProfileUsername()
    const { data: user } = useQueryUserProfileSwr(username)
    const userId = user?.id ?? null

    /** The year currently shown (defaults to the current calendar year). */
    const [year, setYear] = useState(() => new Date().getFullYear())

    // active days for the selected year (null userId → hook is disabled)
    const { data } = useQueryUserContributionCalendarSwr(userId, year)
    // streak (current + longest) — the persistence headline under the heatmap
    const { data: weekly } = useQueryUserWeeklyStatsSwr(userId)

    return (
        <div className={className}>
            <ContributionCalendarView
                days={data ?? []}
                year={year}
                onYearChange={setYear}
            />
            {/* streak headline — current run + longest-ever, the persistence signal */}
            <div className="flex items-center gap-2 px-3 pb-3">
                <FireIcon
                    aria-hidden="true"
                    focusable="false"
                    className="size-5 text-accent"
                />
                <Typography type="body-sm" weight="medium">
                    {t("profile.streakLine", {
                        streak: weekly?.streak ?? 0,
                        longest: weekly?.longestStreak ?? 0,
                    })}
                </Typography>
            </div>
        </div>
    )
}
