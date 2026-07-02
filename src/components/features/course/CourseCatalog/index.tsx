"use client"

import React, { useState } from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { SaveButton } from "@/components/blocks/buttons/SaveButton"
import {
    useQueryCoursesSwr,
    type CourseLevel,
} from "../hooks/useQueryCoursesSwr"
import { FeaturedSlider } from "./FeaturedSlider"

/** Level filter options: "all" + every level. */
const LEVELS: Array<CourseLevel | "all"> = ["all", "basic", "intermediate", "advanced"]

/**
 * Course catalog (§4). DEFAULT on-canon layout: a text search + level filter +
 * a grid of course cards linking to each course. ponytail: plain search input +
 * hand-rolled cards; mock data.
 */
export const CourseCatalog = () => {
    const t = useTranslations("courseSystem")
    const { courses } = useQueryCoursesSwr()
    const [query, setQuery] = useState("")
    const [level, setLevel] = useState<CourseLevel | "all">("all")

    const filtered = courses.filter((course) => {
        const matchesLevel = level === "all" || course.level === level
        const matchesQuery =
            query.trim() === "" ||
            `${course.code} ${course.name}`.toLowerCase().includes(query.trim().toLowerCase())
        return matchesLevel && matchesQuery
    })

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            {/* featured hero slider — merchandising surface; catalog below is unchanged */}
            <FeaturedSlider />

            <Typography type="h4" weight="bold">
                {t("catalog.title")}
            </Typography>

            {/* search + level filter */}
            <div className="flex flex-col gap-3">
                <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t("catalog.searchPlaceholder")}
                    className="w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
                />
                <div className="flex flex-wrap gap-2">
                    {LEVELS.map((option) => (
                        <Button
                            key={option}
                            size="sm"
                            variant={level === option ? "secondary" : "ghost"}
                            onPress={() => setLevel(option)}
                        >
                            {option === "all" ? t("catalog.all") : t(`levels.${option}`)}
                        </Button>
                    ))}
                </div>
            </div>

            {/* course grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((course) => (
                    <Link
                        key={course.id}
                        href={`/courses/${course.id}`}
                        className="flex flex-col gap-3 rounded-large border border-separator p-4 no-underline transition-colors hover:bg-default/40"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-large bg-accent/10 text-xs font-bold text-accent">
                                {course.code.slice(0, 3).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <Typography type="body-sm" weight="medium" truncate>
                                    {course.code}
                                </Typography>
                                <Typography type="body-xs" color="muted" className="truncate">
                                    {course.name}
                                </Typography>
                            </div>
                            {/* toggle must not trigger the card navigation (block swallows the press) */}
                            <SaveButton entityType="course" entityId={course.id} />
                        </div>
                        <div className="flex items-center gap-2">
                            <Chip size="sm" variant="soft" color="accent">
                                {t(`levels.${course.level}`)}
                            </Chip>
                            <Typography type="body-xs" color="muted">
                                {t("catalog.lessonsCount", { count: course.lessons })}
                            </Typography>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
