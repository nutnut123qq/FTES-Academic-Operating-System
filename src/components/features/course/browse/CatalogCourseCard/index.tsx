"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Chip, Typography, cn } from "@heroui/react"
import {
    CaretRightIcon,
    CheckCircleIcon,
    ClockIcon,
    StarIcon,
    UsersIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { PriceTag } from "@/components/blocks/commerce/PriceTag"
import { SaveButton } from "@/components/blocks/buttons/SaveButton"
import type { WithClassNames } from "@/modules/types/base/class-name"
import type { Course } from "../../hooks/useQueryCoursesSwr"

/** Props for {@link CatalogCourseCard}. */
export interface CatalogCourseCardProps extends WithClassNames<undefined> {
    /** The mock catalog course summarised by this card. */
    course: Course
}

/**
 * Shared catalog course card (Coursera/Udemy anatomy), bound to the MOCK
 * `Course` — distinct from `blocks/cards/CourseCard`, which binds the GraphQL
 * `CourseEntity` and stays untouched. Used by the category shelves, the
 * filtered browse grid and the category landing page. A hand-rolled bordered
 * panel (the course feature family's idiom — see decision/card.md) whose whole
 * surface links to the course detail; the save toggle swallows its press so it
 * never navigates. Every field degrades gracefully: a missing cover falls back
 * to the branded gradient, a missing rating/price/badge hides only its own row.
 *
 * @param props - {@link CatalogCourseCardProps}
 */
export const CatalogCourseCard = ({ course, className }: CatalogCourseCardProps) => {
    const t = useTranslations()
    // hide the mock cover if it 404s (offline) — the gradient behind it takes over
    const [coverFailed, setCoverFailed] = useState(false)

    return (
        <Link
            href={`/courses/${course.id}`}
            className={cn(
                "group flex flex-col overflow-hidden rounded-3xl border border-separator no-underline transition-colors hover:bg-default/40",
                className,
            )}
        >
            {/* cover 16:9 — full-bleed; branded gradient fallback when missing/broken */}
            <div className="relative aspect-video w-full overflow-hidden">
                <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-br from-accent/40 via-accent/20 to-accent/5"
                />
                {course.coverUrl && !coverFailed ? (
                    // ponytail: mock picsum cover — `unoptimized` skips the Next
                    // optimizer (no remotePatterns needed); drop when real covers land
                    <Image
                        src={course.coverUrl}
                        alt={course.name}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={() => setCoverFailed(true)}
                    />
                ) : null}
                {course.badge ? (
                    <Chip
                        size="sm"
                        variant="soft"
                        color={course.badge === "bestseller" ? "warning" : "success"}
                        className="absolute left-2 top-2"
                    >
                        {t(`courseSystem.browse.badge.${course.badge}`)}
                    </Chip>
                ) : null}
            </div>

            <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <Typography type="body-xs" color="muted">
                            {course.code}
                        </Typography>
                        <Typography type="body-sm" weight="semibold" className="line-clamp-2">
                            {course.name}
                        </Typography>
                    </div>
                    {/* toggle must not trigger the card navigation (block swallows the press) */}
                    <SaveButton entityType="course" entityId={course.id} />
                </div>

                {/* rating + learners */}
                {course.rating != null || (course.enrollmentCount ?? 0) > 0 ? (
                    <div className="flex flex-wrap items-center gap-3">
                        {course.rating != null ? (
                            <div className="flex items-center gap-2">
                                <StarIcon
                                    aria-hidden
                                    focusable="false"
                                    weight="fill"
                                    className="size-4 text-warning"
                                />
                                <Typography type="body-xs" weight="medium">
                                    {course.rating.toFixed(1)}
                                </Typography>
                                {course.ratingCount != null ? (
                                    <Typography type="body-xs" color="muted">
                                        {t("courseSystem.browse.ratingCount", { count: course.ratingCount })}
                                    </Typography>
                                ) : null}
                            </div>
                        ) : null}
                        {(course.enrollmentCount ?? 0) > 0 ? (
                            <div className="flex items-center gap-2">
                                <UsersIcon aria-hidden focusable="false" className="size-4 text-muted" />
                                <Typography type="body-xs" color="muted">
                                    {t("courses.learners", { count: course.enrollmentCount ?? 0 })}
                                </Typography>
                            </div>
                        ) : null}
                    </div>
                ) : null}

                {/* short description */}
                {course.description ? (
                    <Typography type="body-sm" color="muted" className="line-clamp-2">
                        {course.description}
                    </Typography>
                ) : null}

                {/* top 3 value propositions ("what you'll learn") */}
                {course.learnOutcomes && course.learnOutcomes.length > 0 ? (
                    <ul className="flex flex-col gap-2">
                        {course.learnOutcomes.slice(0, 3).map((outcome, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <CheckCircleIcon
                                    aria-hidden
                                    focusable="false"
                                    className="mt-0.5 size-4 shrink-0 text-success"
                                />
                                <Typography type="body-xs" color="muted" className="line-clamp-1">
                                    {outcome}
                                </Typography>
                            </li>
                        ))}
                    </ul>
                ) : null}

                {/* meta: level + duration */}
                <div className="flex flex-wrap items-center gap-2">
                    <Chip size="sm" variant="soft" color="accent">
                        {t(`courseSystem.levels.${course.level}`)}
                    </Chip>
                    <ClockIcon aria-hidden focusable="false" className="size-4 text-muted" />
                    <Typography type="body-xs" color="muted">
                        {course.durationHours != null
                            ? t("courseSystem.browse.hours", { count: course.durationHours })
                            : t("courseSystem.detail.credits", { count: course.credits })}
                    </Typography>
                </div>

                {/* footer: price + view-course affordance (whole card is the link, so this
                    is a decorative cue — the caret slides on card hover) */}
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-separator pt-3">
                    {course.priceVnd != null ? (
                        <PriceTag discounted={course.priceVnd} size="sm" />
                    ) : (
                        <span />
                    )}
                    <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent">
                        {t("courses.viewCourse")}
                        <CaretRightIcon
                            aria-hidden
                            focusable="false"
                            className="size-4 transition-transform group-hover:translate-x-0.5"
                        />
                    </span>
                </div>
            </div>
        </Link>
    )
}
