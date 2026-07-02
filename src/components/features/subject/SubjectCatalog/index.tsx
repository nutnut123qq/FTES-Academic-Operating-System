"use client"

import React, { useState } from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { useQuerySubjectsSwr } from "../hooks/useQuerySubjectsSwr"
import type { Subject } from "../hooks/useQuerySubjectSwr"

/** Difficulty filter options: "all" + every difficulty. */
const DIFFICULTIES: Array<Subject["difficulty"] | "all"> = ["all", "basic", "intermediate", "advanced"]

/**
 * Subject catalog (§3) — the `/subjects` list. Mirrors the house catalog archetype
 * (see `CourseCatalog`): text search + difficulty filter + a grid of subject cards
 * linking into each subject workspace. Feature owns data (mock) + filtering; tokens
 * own the look. ponytail: plain search input + hand-rolled cards, mock data.
 */
export const SubjectCatalog = () => {
    const t = useTranslations("subjects")
    const { subjects } = useQuerySubjectsSwr()
    const [query, setQuery] = useState("")
    const [difficulty, setDifficulty] = useState<Subject["difficulty"] | "all">("all")

    const filtered = subjects.filter((subject) => {
        const matchesDifficulty = difficulty === "all" || subject.difficulty === difficulty
        const matchesQuery =
            query.trim() === "" ||
            `${subject.code} ${subject.name}`.toLowerCase().includes(query.trim().toLowerCase())
        return matchesDifficulty && matchesQuery
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

            {/* search + difficulty filter */}
            <div className="flex flex-col gap-3">
                <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t("catalog.searchPlaceholder")}
                    className="w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
                />
                <div className="flex flex-wrap gap-2">
                    {DIFFICULTIES.map((option) => (
                        <Button
                            key={option}
                            size="sm"
                            variant={difficulty === option ? "secondary" : "ghost"}
                            onPress={() => setDifficulty(option)}
                        >
                            {option === "all" ? t("catalog.all") : t(`difficulty.${option}`)}
                        </Button>
                    ))}
                </div>
            </div>

            {/* subject grid */}
            {filtered.length === 0 ? (
                <Typography type="body-sm" color="muted">
                    {t("catalog.empty")}
                </Typography>
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((subject) => (
                        <Link
                            key={subject.id}
                            href={`/subjects/${subject.id}`}
                            className="flex flex-col gap-3 rounded-large border border-separator p-4 no-underline transition-colors hover:bg-default/40"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex size-11 shrink-0 items-center justify-center rounded-large bg-accent/10 text-xs font-bold text-accent">
                                    {subject.code.slice(0, 3).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <Typography type="body-sm" weight="medium" truncate>
                                        {subject.code}
                                    </Typography>
                                    <Typography type="body-xs" color="muted" className="truncate">
                                        {subject.name}
                                    </Typography>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Chip size="sm" variant="soft" color="accent">
                                    {t(`difficulty.${subject.difficulty}`)}
                                </Chip>
                                <Typography type="body-xs" color="muted">
                                    {t("credits", { count: subject.credits })}
                                </Typography>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
