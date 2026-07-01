"use client"

import React, {
    useState,
} from "react"
import {
    Button,
    Card,
    CardContent,
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
    ChatCircleIcon,
} from "@phosphor-icons/react"
import {
    SettingsBreadcrumb,
} from "../SettingsBreadcrumb"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useQueryMyLearningFeedbacksSwr, MY_LEARNING_FEEDBACKS_LIMIT } from "@/hooks/swr/api/graphql/queries/useQueryMyLearningFeedbacksSwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/** Props for {@link MyFeedback}. */
export type MyFeedbackProps = WithClassNames<undefined>

/** Map a feedback source to a HeroUI Chip color. */
const SOURCE_COLOR_MAP: Record<string, "accent" | "warning" | "success"> = {
    challenge: "accent",
    task: "warning",
    cv: "success",
}

/**
 * The learner's received feedback as a list — source chip, title, related course
 * and summary. "Load more" grows the page window via a single offset=0 query
 * (`myLearningFeedbacks`).
 *
 * @param props - optional root className.
 */
export const MyFeedback = ({
    className,
}: MyFeedbackProps) => {
    const t = useTranslations()
    const locale = useLocale()

    /** How many pages have been requested (drives the growing window). */
    const [pageCount, setPageCount] = useState(1)

    const swr = useQueryMyLearningFeedbacksSwr(
        0,
        MY_LEARNING_FEEDBACKS_LIMIT * pageCount,
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
                breadcrumb={<SettingsBreadcrumb current={t("profileSettings.learning.feedback.title")} />}
                title={t("profileSettings.learning.feedback.title")}
                description={t("profileSettings.learning.feedback.subtitle")}
            />

            <LabeledCard
                label={t("profileSettings.learning.feedback.title")}
                icon={<ChatCircleIcon aria-hidden focusable="false" className="size-5 text-accent" />}
            >
                <AsyncContent
                    isLoading={!swr.data && !swr.error}
                    skeleton={(
                        <div className="flex flex-col gap-3">
                            {[0, 1, 2].map((row) => (
                                <Card key={row}>
                                    <CardContent className="flex flex-col gap-2">
                                        <div className="flex items-center gap-3">
                                            <Skeleton.Chip />
                                            <Skeleton.Typography type="body-sm" width="1/3" />
                                        </div>
                                        <Skeleton.Typography type="body-sm" width="3/4" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                    isEmpty={items.length === 0}
                    emptyContent={{
                        title: t("profileSettings.learning.feedback.empty"),
                    }}
                    error={!swr.data ? swr.error : undefined}
                    errorContent={{
                        title: t("profileSettings.learning.feedback.empty"),
                        onRetry: () => { void swr.mutate() },
                        retryLabel: t("profileSettings.learning.loadMore"),
                    }}
                >
                    <div className="flex flex-col gap-3">
                        {items.map((item) => (
                            <Card key={item.id}>
                                <CardContent className="flex flex-col gap-2">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Chip
                                            size="sm"
                                            variant="soft"
                                            color={SOURCE_COLOR_MAP[item.source] ?? "accent"}
                                        >
                                            <Chip.Label>
                                                {t(`profileSettings.learning.feedback.source.${item.source}`)}
                                            </Chip.Label>
                                        </Chip>
                                        <Typography type="body-sm" weight="medium">
                                            {item.title}
                                        </Typography>
                                        <Typography type="body-xs" color="muted" className="ml-auto">
                                            {formatDate(item.createdAt)}
                                        </Typography>
                                    </div>
                                    {item.courseTitle ? (
                                        <Typography type="body-xs" color="muted">
                                            {item.courseTitle}
                                        </Typography>
                                    ) : null}
                                    <Typography type="body-sm" color="muted">
                                        {item.summary}
                                    </Typography>
                                </CardContent>
                            </Card>
                        ))}
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
