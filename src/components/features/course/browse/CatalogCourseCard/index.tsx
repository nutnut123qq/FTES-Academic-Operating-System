"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Chip, Typography, cn } from "@heroui/react"
import { CaretRightIcon, CheckCircleIcon, StarIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { SaveButton } from "@/components/blocks/buttons/SaveButton"
import type { WithClassNames } from "@/modules/types/base/class-name"
import type { Course } from "../../hooks/useQueryCoursesSwr"
import { useQueryMyEnrolledSlugsSwr } from "../../hooks/useQueryMyEnrolledSlugsSwr"

/** Props for {@link CatalogCourseCard}. */
export interface CatalogCourseCardProps extends WithClassNames<undefined> {
    /** The mock catalog course summarised by this card. */
    course: Course
}

/**
 * Shared catalog course card (Udemy anatomy), bound to the REST `Course` —
 * distinct from `blocks/cards/CourseCard`, which binds the GraphQL
 * `CourseEntity` and stays untouched. Used by the category shelves, the
 * filtered browse grid and the category landing page. A hand-rolled bordered
 * panel (the course feature family's idiom — see decision/card.md) whose whole
 * surface links to the course detail; the save toggle swallows its press so it
 * never navigates.
 *
 * Anatomy top → bottom: an INSET cover, the title, the course code, ONE meta row
 * (level chip · rating · learners) and the CTA footer. The long-form fields
 * (description, "what you'll learn", duration) belong to
 * {@link CourseHoverPreview}, not the card — and the BE list endpoint does not
 * carry them anyway. Every field
 * degrades gracefully: a missing cover falls back to the branded gradient, a
 * missing rating/learner count drops only its own segment.
 *
 * @param props - {@link CatalogCourseCardProps}
 */
export const CatalogCourseCard = ({ course, className }: CatalogCourseCardProps) => {
    const t = useTranslations()
    // hide the mock cover if it 404s (offline) — the gradient behind it takes over
    const [coverFailed, setCoverFailed] = useState(false)
    // Already enrolled → the card jumps straight into the learn shell and adds a
    // "Tiếp tục học" cue (the only footer row left).
    const { enrolledSlugs } = useQueryMyEnrolledSlugsSwr()
    const isEnrolled = enrolledSlugs.has(course.id)

    return (
        <Link
            href={isEnrolled ? `/courses/${course.id}/learn` : `/courses/${course.id}`}
            className={cn(
                // ponytail: card pads around an INSET cover (reference layout) and is
                // barely rounded — rounded-lg (12px), down from rounded-3xl (36px)
                "group flex flex-col rounded-lg border border-separator p-3 no-underline transition-colors hover:bg-default/40",
                className,
            )}
        >
            {/* cover 16:9 — inset by the card padding, one radius step tighter than
                the card; branded gradient fallback when missing/broken */}
            <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-md">
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
                {course.saleMode === "PACKAGE" ? (
                    <Chip size="sm" variant="soft" color="accent" className="absolute right-2 top-2">
                        {t("courseSystem.browse.saleMode.package")}
                    </Chip>
                ) : null}
            </div>

            <div className="flex flex-1 flex-col gap-1.5 pt-3">
                {/* title FIRST (what people scan), the course code under it as the
                    secondary identifier — mirrors the reference card */}
                <div className="flex items-start justify-between gap-2">
                    <Typography weight="semibold" className="line-clamp-2 min-w-0 flex-1">
                        {course.name}
                    </Typography>
                    {/* toggle must not trigger the card navigation (block swallows the press) */}
                    <SaveButton entityType="course" entityId={course.id} />
                </div>

                <Typography type="body-xs" color="muted">
                    {course.code}
                </Typography>

                {/* ONE meta row — [level chip] ★ rating · learners. The chip keeps its
                    own bounds, so no separator before the rating; the middot only
                    splits the two plain-text segments. */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                    <Chip size="sm" variant="soft" color="accent">
                        {t(`courseSystem.levels.${course.level}`)}
                    </Chip>
                    {course.rating != null ? (
                        <span className="inline-flex items-center gap-0.5">
                            <StarIcon
                                aria-hidden
                                focusable="false"
                                weight="fill"
                                className="size-3.5 text-warning"
                            />
                            {course.rating.toFixed(1)}
                        </span>
                    ) : null}
                    {(course.enrollmentCount ?? 0) > 0 ? (
                        <>
                            {course.rating != null ? <span aria-hidden>·</span> : null}
                            <span>{t("courses.learners", { count: course.enrollmentCount ?? 0 })}</span>
                        </>
                    ) : null}
                </div>

                {/* footer: one CTA cue — enrolled → "Tiếp tục học", else "Xem khóa học".
                    The whole card is the link, so the caret just slides on hover. */}
                <div className="mt-auto flex items-center justify-end border-t border-separator pt-2">
                    <span
                        className={cn(
                            "inline-flex shrink-0 items-center gap-1 text-sm font-medium",
                            isEnrolled ? "text-success" : "text-accent",
                        )}
                    >
                        {isEnrolled ? (
                            <CheckCircleIcon aria-hidden focusable="false" weight="fill" className="size-4" />
                        ) : null}
                        {isEnrolled ? t("courses.continueLearning") : t("courses.viewCourse")}
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
