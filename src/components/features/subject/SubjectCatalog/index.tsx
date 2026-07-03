"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Button, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQuerySubjectsSwr } from "../hooks/useQuerySubjectsSwr"
import type { Subject } from "../hooks/useQuerySubjectSwr"

/** Difficulty filter options: "all" + every difficulty. */
const DIFFICULTIES: Array<Subject["difficulty"] | "all"> = ["all", "basic", "intermediate", "advanced"]

/** `next/image` sizes matching the 1 / 2 / 3-column catalog grid. */
const THUMBNAIL_SIZES = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"

/**
 * Subject catalog (§3) — the `/subjects` list. Mirrors the house catalog archetype
 * (see `CourseCatalog`): text search + difficulty filter + a grid of subject cards
 * linking into each subject workspace. Feature owns data (mock) + filtering; tokens
 * own the look. ponytail: plain search input + hand-rolled cards, mock data.
 */
export const SubjectCatalog = () => {
    const t = useTranslations("subjects")
    const { subjects, isLoading, error } = useQuerySubjectsSwr()
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

            {/* search + difficulty filter — static chrome, stays outside the skeleton */}
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

            {/* subject grid — skeleton while loading (or errored with no data) */}
            <AsyncContent
                isLoading={isLoading || Boolean(error)}
                skeleton={
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }, (_, index) => (
                            <SubjectCardSkeleton key={index} />
                        ))}
                    </div>
                }
            >
                {filtered.length === 0 ? (
                    <Typography type="body-sm" color="muted">
                        {t("catalog.empty")}
                    </Typography>
                ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((subject) => (
                            <SubjectCard key={subject.id} subject={subject} />
                        ))}
                    </div>
                )}
            </AsyncContent>
        </div>
    )
}

/** Props for {@link SubjectCard}. */
interface SubjectCardProps {
    /** The subject to render. */
    subject: Subject
}

/**
 * One catalog card: 16:9 cover thumbnail (when the subject has artwork) above the
 * identity row + chip row. `imageUrl: null` or a failed load renders today's
 * image-less layout — the code-initials badge stays the visual mark, no broken
 * glyph, no empty box.
 */
const SubjectCard = ({ subject }: SubjectCardProps) => {
    const t = useTranslations("subjects")
    // broken image → fall back to the image-less layout (spec: never show a broken glyph)
    const [imageBroken, setImageBroken] = useState(false)
    const imageUrl = imageBroken ? null : subject.imageUrl

    return (
        <Link
            href={`/subjects/${subject.id}`}
            className="flex flex-col overflow-hidden rounded-2xl border border-separator no-underline transition-colors hover:bg-default/40"
        >
            {imageUrl !== null ? (
                <div className="relative aspect-video w-full">
                    <Image
                        src={imageUrl}
                        alt={subject.name}
                        fill
                        sizes={THUMBNAIL_SIZES}
                        className="object-cover"
                        onError={() => setImageBroken(true)}
                    />
                </div>
            ) : null}
            <div className="flex flex-col gap-3 p-4">
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
            </div>
        </Link>
    )
}

/**
 * Skeleton mirroring {@link SubjectCard}: 16:9 thumbnail box, identity row
 * (badge + two text lines), chip-row line — same boxes, same proportions.
 */
const SubjectCardSkeleton = () => (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-separator">
        <Skeleton className="aspect-video w-full rounded-none" />
        <div className="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-3">
                <Skeleton className="size-11 shrink-0 rounded-large" />
                <div className="flex min-w-0 flex-1 flex-col">
                    <Skeleton.Typography type="body-sm" width="1/3" />
                    <Skeleton.Typography type="body-xs" width="2/3" />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Skeleton.Chip />
                <Skeleton.Typography type="body-xs" width="1/4" />
            </div>
        </div>
    </div>
)
