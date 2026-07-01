"use client"

import React from "react"
import {
    cn,
    Spinner,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    useProfileUsername,
} from "../useProfileUsername"
import {
    EntityToken,
} from "@/components/features/dashboard/EntityToken"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useQueryUserCoursesSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserCoursesSwr"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"
import { SectionCard } from "@/components/reuseable/SectionCard"
import { EmptyState } from "@/components/blocks/feedback/EmptyState"
import { ErrorState } from "@/components/blocks/feedback/ErrorState"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { StatusChip } from "@/components/blocks/chips/StatusChip"

/** Props for {@link ProfileCourses}. */
export type ProfileCoursesProps = WithClassNames<undefined>

/**
 * Courses tab of the public profile — every course the profile owner has joined,
 * each as a clickable token plus up to three progress meters (content / challenge /
 * milestone). A dimension renders only when it has tasks (total > 0), so a course
 * with no challenges does not show an empty "0/0" line. Self-contained container:
 * reads the target user id from the route and drives its own SWR. Mirrors the
 * dashboard rail's course block but for any user.
 *
 * @param props - optional className for the root element.
 */
export const ProfileCourses = ({
    className,
}: ProfileCoursesProps) => {
    const t = useTranslations()
    // route carries the username; resolve it to the entity id the courses query
    // keys off (the profile fetch is SWR-deduped with the parent + tabs)
    const username = useProfileUsername()
    const { data: user } = useQueryUserProfileSwr(username)
    const userId = user?.id ?? null
    const {
        data,
        isLoading,
        error,
        mutate,
    } = useQueryUserCoursesSwr(userId)

    // first load in flight (username not yet resolved, or query running) → spinner
    if (!data && (isLoading || !userId)) {
        return (
            <div className="flex justify-center p-12">
                <Spinner size="lg" />
            </div>
        )
    }

    // fetch failed → recoverable error state with retry
    if (!data && error) {
        return (
            <ErrorState
                className={className}
                title={t("publicProfile.loadError")}
                retryLabel={t("publicProfile.loadErrorRetry")}
                onRetry={() => {
                    void mutate()
                }}
            />
        )
    }

    // no joined courses → action-aware empty state (no large blank card for guests)
    if (!data || data.length === 0) {
        return (
            <EmptyState
                className={className}
                title={t("publicProfile.coursesEmpty")}
            />
        )
    }

    return (
        <div className={cn("flex flex-col gap-6", className)}>
            {data.map((item) => {
                // three progress dimensions per course; only render a meter when that
                // dimension actually has tasks (total > 0)
                const metrics = [
                    {
                        key: "content",
                        completed: item.contentCompleted,
                        total: item.contentTotal,
                    },
                    {
                        key: "challenge",
                        completed: item.challengeCompleted,
                        total: item.challengeTotal,
                    },
                    {
                        key: "milestone",
                        completed: item.completed,
                        total: item.total,
                    },
                ]
                // no progress in any dimension yet → show a "start" nudge instead
                // of three sad 0/N bars (don't lead with zeros)
                const hasProgress = metrics.some((metric) => metric.completed > 0)
                return (
                    <SectionCard key={item.globalId}>
                        <EntityToken
                            globalId={item.globalId}
                            label={item.label}
                        />
                        {hasProgress ? (
                            metrics
                                .filter((metric) => metric.total > 0)
                                .map((metric) => (
                                    <ProgressMeter
                                        key={metric.key}
                                        label={`${t(`dashboard.courseProgress.${metric.key}`)} · ${metric.completed}/${metric.total}`}
                                        value={metric.completed}
                                        max={metric.total}
                                        showValue
                                    />
                                ))
                        ) : (
                            <StatusChip tone="accent" className="w-fit">
                                {t("publicProfile.courseStart")}
                            </StatusChip>
                        )}
                    </SectionCard>
                )
            })}
        </div>
    )
}
