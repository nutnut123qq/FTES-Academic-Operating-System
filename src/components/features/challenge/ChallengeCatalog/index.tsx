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
    UsersIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { useQueryChallengesSwr, type Challenge } from "../hooks/useQueryChallengesSwr"

/** Type filter options: "all" + every challenge type. */
const TYPES: Array<Challenge["type"] | "all"> = ["all", "coding", "sql", "uiux", "ai", "business"]

/** Per-type icon for the card badge (confirmed-compiling phosphor set). */
const TYPE_ICONS: Record<Challenge["type"], React.ReactNode> = {
    coding: <CodeIcon className="size-6" />,
    sql: <DatabaseIcon className="size-6" />,
    uiux: <PaintBrushIcon className="size-6" />,
    ai: <SparkleIcon className="size-6" />,
    business: <BriefcaseIcon className="size-6" />,
}

/**
 * Challenge catalog (§10) — the `/challenges` list. Mirrors the house catalog
 * archetype (see `SubjectCatalog`): text search + type filter + a grid of challenge
 * cards linking into each challenge. Feature owns data (mock) + filtering; tokens own
 * the look. ponytail: plain search input + hand-rolled cards, mock data.
 */
export const ChallengeCatalog = () => {
    const t = useTranslations("challengeSystem")
    const { challenges } = useQueryChallengesSwr()
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
            <div className="flex flex-col gap-1">
                <Typography type="h4" weight="bold">
                    {t("catalog.title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("catalog.subtitle")}
                </Typography>
            </div>

            {/* search + type filter */}
            <div className="flex flex-col gap-3">
                <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t("catalog.searchPlaceholder")}
                    className="w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
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

            {/* challenge grid */}
            {filtered.length === 0 ? (
                <Typography type="body-sm" color="muted">
                    {t("catalog.empty")}
                </Typography>
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((challenge) => (
                        <Link
                            key={challenge.id}
                            href={`/challenges/${challenge.id}`}
                            className="flex flex-col gap-3 rounded-2xl border border-separator p-4 no-underline transition-colors hover:bg-default/40"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex size-11 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent">
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
                                <Chip size="sm" variant="soft">
                                    {t(`difficulty.${challenge.difficulty}`)}
                                </Chip>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1 text-muted">
                                    <TrophyIcon className="size-4" />
                                    <Typography type="body-xs" color="muted">
                                        {t("pointsCount", { count: challenge.points })}
                                    </Typography>
                                </span>
                                <span className="flex items-center gap-1 text-muted">
                                    <UsersIcon className="size-4" />
                                    <Typography type="body-xs" color="muted">
                                        {t("participantsCount", { count: challenge.participants })}
                                    </Typography>
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
