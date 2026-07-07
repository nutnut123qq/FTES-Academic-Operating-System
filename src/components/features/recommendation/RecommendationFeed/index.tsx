"use client"

import React from "react"
import { Button, Skeleton, Typography } from "@heroui/react"
import {
    BookOpenIcon,
    GraduationCapIcon,
    PuzzlePieceIcon,
    UsersThreeIcon,
    ChalkboardTeacherIcon,
    SparkleIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import {
    useQueryRecommendationsSwr,
    type Recommendation,
    type RecommendationsByKind,
} from "../hooks/useQueryRecommendationsSwr"

/** The kinds rendered as sections, in order, with their icon. */
const KINDS: Array<{ key: keyof RecommendationsByKind; Icon: typeof BookOpenIcon }> = [
    { key: "subjects", Icon: BookOpenIcon },
    { key: "courses", Icon: GraduationCapIcon },
    { key: "groups", Icon: UsersThreeIcon },
    { key: "mentors", Icon: ChalkboardTeacherIcon },
    { key: "challenges", Icon: PuzzlePieceIcon },
]

/** One "for you" card: icon badge + title + reason caption + a mock "Xem" action. */
const RecommendationCard = ({
    item,
    Icon,
    viewLabel,
}: {
    item: Recommendation
    Icon: typeof BookOpenIcon
    viewLabel: string
}) => (
    <div className="flex w-64 shrink-0 flex-col gap-3 rounded-2xl border border-separator p-4 transition-colors hover:bg-default/40">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent">
            <Icon size={22} aria-hidden />
        </div>
        <div className="flex min-w-0 flex-col gap-0">
            <Typography type="body-sm" weight="medium" className="line-clamp-2">
                {item.title}
            </Typography>
            <Typography type="body-xs" color="muted" className="line-clamp-2">
                {item.reason}
            </Typography>
        </div>
        <Button size="sm" variant="secondary" className="self-start">
            {viewLabel}
        </Button>
    </div>
)

/** Loading skeleton — mirrors two kind sections, each a heading + a row of cards. */
const RecommendationFeedSkeleton = () => (
    <div className="flex flex-col gap-6">
        {[0, 1].map((section) => (
            <div key={section} className="flex flex-col gap-3">
                <Skeleton className="h-5 w-32 rounded-full" />
                <div className="flex flex-wrap gap-3">
                    {[0, 1, 2].map((card) => (
                        <div
                            key={card}
                            className="flex w-64 shrink-0 flex-col gap-3 rounded-2xl border border-separator p-4"
                        >
                            <Skeleton className="size-11 rounded-large" />
                            <div className="flex flex-col gap-2">
                                <Skeleton className="h-4 w-48 rounded-full" />
                                <Skeleton className="h-3 w-40 rounded-full" />
                            </div>
                            <Skeleton className="h-8 w-16 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        ))}
    </div>
)

/**
 * Recommendation Engine (§17) — the "for you" feed. Feature owns data (mock) + the
 * per-kind grouping; tokens own the look. One section per recommendation kind, each a
 * horizontal-wrapping grid of suggestion cards. ponytail: hand-rolled cards + mock
 * data, no real personalization.
 */
export const RecommendationFeed = () => {
    const t = useTranslations("recommendation")
    const { recommendations, isLoading, error, mutate } = useQueryRecommendationsSwr()

    const total = recommendations
        ? KINDS.reduce((sum, { key }) => sum + (recommendations[key]?.length ?? 0), 0)
        : 0

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <div className="flex flex-col gap-0">
                <Typography type="h4" weight="bold">
                    {t("title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("subtitle")}
                </Typography>
            </div>

            <AsyncContent
                isLoading={isLoading && !recommendations}
                skeleton={<RecommendationFeedSkeleton />}
                isEmpty={total === 0}
                emptyContent={{
                    icon: <SparkleIcon aria-hidden focusable="false" className="size-8 text-muted" />,
                    title: t("empty.title"),
                    description: t("empty.description"),
                }}
                error={!recommendations ? error : undefined}
                errorContent={{
                    title: t("error.title"),
                    onRetry: () => void mutate(),
                    retryLabel: t("error.retry"),
                }}
            >
                <div className="flex flex-col gap-6">
                    {KINDS.map(({ key, Icon }) => {
                        const items = recommendations?.[key] ?? []
                        if (items.length === 0) return null
                        return (
                            <section key={key} className="flex flex-col gap-3">
                                <Typography type="body" weight="bold">
                                    {t(`kinds.${key}`)}
                                </Typography>
                                <div className="flex flex-wrap gap-3">
                                    {items.map((item) => (
                                        <RecommendationCard
                                            key={item.id}
                                            item={item}
                                            Icon={Icon}
                                            viewLabel={t("view")}
                                        />
                                    ))}
                                </div>
                            </section>
                        )
                    })}
                </div>
            </AsyncContent>
        </div>
    )
}
