"use client"

import React, {
    useState,
} from "react"
import {
    Button,
    Chip,
    Link,
    Typography,
    cn,
    Spinner,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    CodeIcon,
} from "@phosphor-icons/react"
import {
    FaGithub,
} from "react-icons/fa6"
import {
    SettingsBreadcrumb,
} from "../SettingsBreadcrumb"
import {
    EntityToken,
} from "@/components/features/dashboard/EntityToken"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useQueryMyChallengeSubmissionsSwr, MY_CHALLENGE_SUBMISSIONS_LIMIT } from "@/hooks/swr/api/graphql/queries/useQueryMyChallengeSubmissionsSwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { ListRow } from "@/components/blocks/lists/ListRow"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/** Props for {@link MySubmissions}. */
export type MySubmissionsProps = WithClassNames<undefined>

/** Map a submission status to a HeroUI Chip color. */
const STATUS_COLOR_MAP: Record<string, "success" | "danger" | "warning"> = {
    passed: "success",
    failed: "danger",
    pending: "warning",
}

/**
 * The learner's challenge submissions as a list — title, course, status chip,
 * score, language, repo link and date. "Load more" grows the page window via a
 * single offset=0 query (`myChallengeSubmissions`).
 *
 * @param props - optional root className.
 */
export const MySubmissions = ({
    className,
}: MySubmissionsProps) => {
    const t = useTranslations()
    const locale = useLocale()

    /** How many pages have been requested (drives the growing window). */
    const [pageCount, setPageCount] = useState(1)

    const swr = useQueryMyChallengeSubmissionsSwr(
        0,
        MY_CHALLENGE_SUBMISSIONS_LIMIT * pageCount,
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
                breadcrumb={<SettingsBreadcrumb current={t("profileSettings.learning.submissions.title")} />}
                title={t("profileSettings.learning.submissions.title")}
                description={t("profileSettings.learning.submissions.subtitle")}
            />

            <LabeledCard
                label={t("profileSettings.learning.submissions.title")}
                icon={<CodeIcon aria-hidden focusable="false" className="size-5 text-accent" />}
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
                        title: t("profileSettings.learning.submissions.empty"),
                        description: t("profileSettings.learning.submissions.emptyHint"),
                    }}
                    error={!swr.data ? swr.error : undefined}
                    errorContent={{
                        title: t("profileSettings.learning.submissions.empty"),
                        onRetry: () => { void swr.mutate() },
                        retryLabel: t("profileSettings.learning.loadMore"),
                    }}
                >
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-0">
                            {items.map((item, index) => (
                                <ListRow
                                    key={item.id}
                                    title={item.challengeTitle}
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
                                                color={STATUS_COLOR_MAP[item.status] ?? "warning"}
                                            >
                                                <Chip.Label>
                                                    {t(`profileSettings.learning.submissions.status.${item.status}`)}
                                                </Chip.Label>
                                            </Chip>
                                            <Typography type="body-sm">
                                                {item.score}
                                            </Typography>
                                            <Typography type="body-xs" color="muted">
                                                {item.selectedLang ?? "—"}
                                            </Typography>
                                            <Typography type="body-xs" color="muted">
                                                {formatDate(item.submittedAt)}
                                            </Typography>
                                        </>
                                    )}
                                    trailing={item.submissionUrl ? (
                                        <Link
                                            href={item.submissionUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-accent"
                                        >
                                            <FaGithub aria-hidden focusable="false" className="size-5" />
                                            {t("profileSettings.learning.submissions.open")}
                                        </Link>
                                    ) : (
                                        <Typography type="body-xs" color="muted">—</Typography>
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
