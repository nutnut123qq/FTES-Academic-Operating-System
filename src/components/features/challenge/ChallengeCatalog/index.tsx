"use client"

import React, { useState } from "react"
import { Button, Chip, Typography } from "@heroui/react"
import {
    CodeIcon,
    DatabaseIcon,
    PaintBrushIcon,
    SparkleIcon,
    BriefcaseIcon,
    TrophyIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryChallengesSwr, type Challenge } from "../hooks/useQueryChallengesSwr"

/** Type filter options: "all" + every challenge type. */
const TYPES: Array<Challenge["type"] | "all"> = ["all", "coding", "sql", "uiux", "ai", "business"]

/** BE lifecycle statuses that have an i18n label (`challengeSystem.status.*`). */
const KNOWN_STATUSES = new Set(["PUBLISHED", "RUNNING", "CLOSED"])

/** Per-type icon for the card badge (confirmed-compiling phosphor set). */
const TYPE_ICONS: Record<Challenge["type"], React.ReactNode> = {
    coding: <CodeIcon className="size-6" aria-hidden focusable="false" />,
    sql: <DatabaseIcon className="size-6" aria-hidden focusable="false" />,
    uiux: <PaintBrushIcon className="size-6" aria-hidden focusable="false" />,
    ai: <SparkleIcon className="size-6" aria-hidden focusable="false" />,
    business: <BriefcaseIcon className="size-6" aria-hidden focusable="false" />,
}

/**
 * Challenge catalog (§10) — the `/challenges` list. Mirrors the house catalog
 * archetype (see `SubjectCatalog`): text search + type filter + a grid of challenge
 * cards linking into each challenge. Feature owns data (mock) + filtering; tokens own
 * the look. ponytail: plain search input + hand-rolled cards, mock data.
 */
export const ChallengeCatalog = () => {
    const t = useTranslations("challengeSystem")
    const { challenges, isLoading, error, mutate } = useQueryChallengesSwr()
    const [query, setQuery] = useState("")
    const [type, setType] = useState<Challenge["type"] | "all">("all")

    const filtered = challenges.filter((challenge) => {
        const matchesType = type === "all" || challenge.type === type
        const matchesQuery =
            query.trim() === "" ||
            challenge.title.toLowerCase().includes(query.trim().toLowerCase())
        return matchesType && matchesQuery
    })

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <div className="flex flex-col gap-0">
                <Typography type="h4" weight="bold">
                    {t("catalog.title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("catalog.subtitle")}
                </Typography>
            </div>

            {/* search + type filter — static chrome, stays outside the skeleton */}
            <div className="flex flex-col gap-3">
                <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t("catalog.searchPlaceholder")}
                    className="w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
                />
                <div className="flex flex-wrap gap-2">
                    {TYPES.map((option) => (
                        <Button
                            key={option}
                            size="sm"
                            variant={type === option ? "secondary" : "ghost"}
                            onPress={() => setType(option)}
                        >
                            {option === "all" ? t("catalog.all") : t(`types.${option}`)}
                        </Button>
                    ))}
                </div>
            </div>

            {/* challenge grid — skeleton while loading; empty + error states via house blocks */}
            <AsyncContent
                isLoading={isLoading}
                skeleton={
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }, (_, index) => (
                            <ChallengeCardSkeleton key={index} />
                        ))}
                    </div>
                }
                error={error}
                errorContent={{
                    title: t("catalog.errorTitle"),
                    description: t("catalog.errorDescription"),
                    onRetry: () => {
                        void mutate()
                    },
                    retryLabel: t("catalog.retry"),
                    className: "py-16",
                }}
                isEmpty={filtered.length === 0}
                emptyContent={{
                    icon: <TrophyIcon className="size-8 text-muted" aria-hidden focusable="false" />,
                    title: t("catalog.empty"),
                    className: "py-16",
                }}
            >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((challenge) => (
                        <Link
                            key={challenge.id}
                            href={`/challenges/${challenge.id}`}
                            className="flex flex-col gap-3 rounded-2xl border border-separator p-4 no-underline transition-colors hover:bg-default/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                                    {TYPE_ICONS[challenge.type]}
                                </div>
                                <div className="min-w-0">
                                    <Typography type="body-sm" weight="medium" truncate>
                                        {challenge.title}
                                    </Typography>
                                    <Typography type="body-xs" color="muted" className="truncate">
                                        {t(`types.${challenge.type}`)}
                                    </Typography>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Chip size="sm" variant="soft" color="accent">
                                    {t(`types.${challenge.type}`)}
                                </Chip>
                                <Chip
                                    size="sm"
                                    variant="soft"
                                    color={challenge.status === "RUNNING" ? "success" : undefined}
                                >
                                    {KNOWN_STATUSES.has(challenge.status)
                                        ? t(`status.${challenge.status}`)
                                        : challenge.status}
                                </Chip>
                            </div>
                        </Link>
                    ))}
                </div>
            </AsyncContent>
        </div>
    )
}

/**
 * Skeleton mirroring one challenge card: badge + identity row, chip row, meta row —
 * same boxes, same proportions, so the grid never jumps on resolve.
 */
const ChallengeCardSkeleton = () => (
    <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
        <div className="flex items-center gap-3">
            <Skeleton className="size-12 shrink-0 rounded-xl" />
            <div className="flex min-w-0 flex-1 flex-col gap-0">
                <Skeleton.Typography type="body-sm" width="2/3" />
                <Skeleton.Typography type="body-xs" width="1/3" />
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Skeleton.Chip />
            <Skeleton.Chip />
        </div>
        <div className="flex items-center gap-4">
            <Skeleton.Typography type="body-xs" width="1/4" />
            <Skeleton.Typography type="body-xs" width="1/4" />
        </div>
    </div>
)
