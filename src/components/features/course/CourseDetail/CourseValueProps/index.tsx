"use client"

import React from "react"
import {
    Typography,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    SealCheckIcon,
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

/** Props for {@link CourseValueProps}. */
export type CourseValuePropsProps = WithClassNames<undefined>

/**
 * "What you'll get" section: the course value propositions as a checked grid —
 * placed high (right after the hero) so the benefit lands before the price.
 * Self-contained (reads redux + the course SWR flags); hides entirely when the
 * course has no value props.
 *
 * @param props - optional className (placement only).
 */
export const CourseValueProps = ({ className }: CourseValuePropsProps) => {
    const t = useTranslations()
    const { isLoading, error, mutate } = useQueryCourseSwr()
    const items = useAppSelector((state) => state.course.entity?.valuePropositions) ?? []

    // settled + genuinely empty → hide the whole section (no empty card)
    if (!isLoading && !error && items.length === 0) {
        return null
    }

    return (
        <LabeledCard
            className={className}
            label={t("courseLanding.valueProps")}
            icon={<SealCheckIcon aria-hidden focusable="false" className="size-5" />}
            frameless
        >
            <AsyncContent
                isLoading={isLoading && items.length === 0}
                skeleton={(
                    <div className="overflow-hidden rounded-3xl border border-default bg-surface">
                        {[0, 1, 2, 3].map((row) => (
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
                {/* shared check-list card (elements/card.md §3b): surface list, tick-led rows */}
                <CheckListCard>
                    {items.map((item) => (
                        <CheckListItem key={item.id}>
                            <Typography type="body-sm">{item.text}</Typography>
                        </CheckListItem>
                    ))}
                </CheckListCard>
            </AsyncContent>
        </LabeledCard>
    )
}
