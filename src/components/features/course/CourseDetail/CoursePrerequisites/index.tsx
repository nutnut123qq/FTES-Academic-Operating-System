"use client"

import React, {
    useMemo,
} from "react"
import {
    Typography,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import _ from "lodash"
import {
    ListBulletsIcon,
} from "@phosphor-icons/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { CheckListCard, CheckListItem } from "@/components/blocks/cards/CheckListCard"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryCourseSwr } from "@/hooks/swr/api/graphql/queries/useQueryCourseSwr"
import { useAppSelector } from "@/redux/hooks"

/** Props for {@link CoursePrerequisites}. */
export type CoursePrerequisitesProps = WithClassNames<undefined>

/**
 * "Before you start" section: the course prerequisites as a neutral bullet list
 * (informational, NOT a warning alert). Self-contained (reads redux + the course
 * SWR flags); hides entirely when the course lists none.
 *
 * @param props - optional className (placement only).
 */
export const CoursePrerequisites = ({ className }: CoursePrerequisitesProps) => {
    const t = useTranslations()
    const { isLoading, error, mutate } = useQueryCourseSwr()
    const rawItems = useAppSelector((state) => state.course.entity?.prerequisites)

    const items = useMemo(
        () => _.cloneDeep(rawItems ?? []).sort((a, b) => a.sortIndex - b.sortIndex),
        [rawItems],
    )

    if (!isLoading && !error && items.length === 0) {
        return null
    }

    return (
        <LabeledCard
            className={className}
            label={t("courseLanding.prerequisites")}
            icon={<ListBulletsIcon aria-hidden focusable="false" className="size-5" />}
            frameless
        >
            <AsyncContent
                isLoading={isLoading && items.length === 0}
                skeleton={(
                    <div className="overflow-hidden rounded-3xl border border-default bg-surface">
                        {[0, 1, 2].map((row) => (
                            <div key={row} className="px-4 py-4">
                                <Skeleton.Typography type="body-sm" />
                            </div>
                        ))}
                    </div>
                )}
                error={error}
                errorContent={{
                    title: t("courseLanding.errorTitle"),
                    onRetry: () => mutate(),
                    retryLabel: t("courseLanding.retry"),
                }}
            >
                {/* shared check-list card (elements/card.md §3b); prerequisites = NO tick
                    (things you need beforehand, not achievements) */}
                <CheckListCard>
                    {items.map((item) => (
                        <CheckListItem key={item.id} showCheck={false}>
                            <Typography type="body-sm">{item.text}</Typography>
                        </CheckListItem>
                    ))}
                </CheckListCard>
            </AsyncContent>
        </LabeledCard>
    )
}
