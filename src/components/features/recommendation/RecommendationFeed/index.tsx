"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import {
    BookOpenIcon,
    GraduationCapIcon,
    PuzzlePieceIcon,
    UsersThreeIcon,
    ChalkboardTeacherIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
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
    <div className="flex w-64 shrink-0 flex-col gap-3 rounded-large border border-separator p-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent">
            <Icon size={22} aria-hidden />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
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

/**
 * Recommendation Engine (§17) — the "for you" feed. Feature owns data (mock) + the
 * per-kind grouping; tokens own the look. One section per recommendation kind, each a
 * horizontal-wrapping grid of suggestion cards. ponytail: hand-rolled cards + mock
 * data, no real personalization.
 */
export const RecommendationFeed = () => {
    const t = useTranslations("recommendation")
    const { recommendations } = useQueryRecommendationsSwr()

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
                <Typography type="h4" weight="bold">
                    {t("title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("subtitle")}
                </Typography>
            </div>

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
    )
}
