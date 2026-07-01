"use client"

import React, {
    useState,
} from "react"
import {
    Button,
    Chip,
    Typography,
    cn,
    Spinner,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    ListChecksIcon,
} from "@phosphor-icons/react"
import {
    SettingsBreadcrumb,
} from "../SettingsBreadcrumb"
import {
    EntityToken,
} from "@/components/features/dashboard/EntityToken"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useQueryMyMilestoneTaskAttemptsSwr, MY_MILESTONE_TASK_ATTEMPTS_LIMIT } from "@/hooks/swr/api/graphql/queries/useQueryMyMilestoneTaskAttemptsSwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { ListRow } from "@/components/blocks/lists/ListRow"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/** Props for {@link MyAttempts}. */
export type MyAttemptsProps = WithClassNames<undefined>

/**
 * The learner's milestone-task attempts as a list — task, milestone, course,
 * pass/fail chip, score and date (failed attempts included). "Load more" grows
 * the page window via a single offset=0 query (`myMilestoneTaskAttempts`).
 *
 * @param props - optional root className.
 */
export const MyAttempts = ({
    className,
}: MyAttemptsProps) => {
    const t = useTranslations()
    const locale = useLocale()

    /** How many pages have been requested (drives the growing window). */
    const [pageCount, setPageCount] = useState(1)

    const swr = useQueryMyMilestoneTaskAttemptsSwr(
        0,
        MY_MILESTONE_TASK_ATTEMPTS_LIMIT * pageCount,
    )
    const items = swr.data?.items ?? []
    const total = swr.data?.total ?? 0
    const hasMore = items.length < total

    const formatDate = (iso: string): string =>
        new Date(iso).toLocaleDateString(locale, {
            year: "numeric",
            month: "short",
            day: "numeric",
        })

    return (
        <div className={cn("flex flex-col gap-10", className)}>
            <PageHeader
                breadcrumb={<SettingsBreadcrumb current={t("profileSettings.learning.attempts.title")} />}
                title={t("profileSettings.learning.attempts.title")}
                description={t("profileSettings.learning.attempts.subtitle")}
            />

            <LabeledCard
                label={t("profileSettings.learning.attempts.title")}
                icon={<ListChecksIcon aria-hidden focusable="false" className="size-5 text-accent" />}
            >
                <AsyncContent
                    isLoading={!swr.data && !swr.error}
                    skeleton={(
                        <div className="flex flex-col gap-2">
                            {[0, 1, 2].map((row) => (
                                <Skeleton.ListRow key={row} withTrailing />
                            ))}
                        </div>
                    )}
                    isEmpty={items.length === 0}
                    emptyContent={{
                        title: t("profileSettings.learning.attempts.empty"),
                        description: t("profileSettings.learning.attempts.emptyHint"),
                    }}
                    error={!swr.data ? swr.error : undefined}
                    errorContent={{
                        title: t("profileSettings.learning.attempts.empty"),
                        onRetry: () => { void swr.mutate() },
                        retryLabel: t("profileSettings.learning.loadMore"),
                    }}
                >
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-0">
                            {items.map((item, index) => (
                                <ListRow
                                    key={item.id}
                                    title={item.taskTitle}
                                    subtitle={item.milestoneTitle}
                                    divider={index < items.length - 1}
                                    meta={(
                                        <>
                                            <EntityToken
                                                globalId={item.courseGlobalId}
                                                label={item.courseTitle}
                                            />
                                            <Chip
                                                size="sm"
                                                variant="soft"
                                                color={item.passed ? "success" : "danger"}
                                            >
                                                <Chip.Label>
                                                    {item.passed
                                                        ? t("profileSettings.learning.attempts.passed")
                                                        : t("profileSettings.learning.attempts.failed")}
                                                </Chip.Label>
                                            </Chip>
                                            <Typography type="body-sm">
                                                {item.score}
                                            </Typography>
                                            <Typography type="body-xs" color="muted">
                                                {formatDate(item.attemptedAt)}
                                            </Typography>
                                        </>
                                    )}
                                />
                            ))}
                        </div>
                        {hasMore ? (
                            <div className="flex justify-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    isDisabled={swr.isValidating}
                                    onPress={() => setPageCount((count) => count + 1)}
                                >
                                    {swr.isValidating ? (
                                        <Spinner color="current" size="sm" />
                                    ) : null}
                                    {t("profileSettings.learning.loadMore")}
                                </Button>
                            </div>
                        ) : null}
                    </div>
                </AsyncContent>
            </LabeledCard>
        </div>
    )
}
