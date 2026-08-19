"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Chip, Typography, cn } from "@heroui/react"
import { BookOpenIcon, CaretRightIcon, CheckCircleIcon, StarIcon } from "@phosphor-icons/react"
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
 * Anatomy top → bottom: an INSET cover, the title, a meta row
 * (level chip · N lessons · rating + count · learners), a 2-line description, the
 * mentor (avatar + name) and the CTA footer. Every field degrades gracefully: a
 * missing cover falls back to the branded gradient, and each meta segment /
 * description / mentor row drops out entirely when the BE summary omits it (so a
 * course with no resolvable mentor or no description simply shows fewer rows). The
 * deeper "what you'll learn" bullets still live in {@link CourseHoverPreview}.
 *
 * Neighbours in a grid/shelf must line up, so the optional rows are never allowed to
 * shift the fixed ones: the card is `h-full`, the title row reserves two lines
 * (`min-h-14`) so the meta row always starts at the same y, and mentor + CTA form a
 * single bottom-pinned group (one `mt-auto`) so the slack collects in the middle
 * instead of between them. Keep {@link CatalogCourseCardSkeleton} on these same boxes.
 *
 * @param props - {@link CatalogCourseCardProps}
 */
/** `next/image` sizes khớp lưới danh mục 1 / 2 / 3 cột. */
const COVER_SIZES = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"

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
                // barely rounded — rounded-lg (12px), down from rounded-3xl (36px).
                // h-full is baked in (not left to the caller) so a card always fills
                // its grid/shelf cell — neighbours share one height, never staggered.
                "group flex h-full flex-col rounded-lg border border-separator p-3 no-underline transition-colors hover:bg-default/40",
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
                    /* Ảnh bìa đi QUA optimizer. Trước đây gắn `unoptimized` vì bìa còn là ảnh
                       picsum giả; bìa thật đã lên rồi, và bỏ sót cờ này rất đắt: đo trên
                       production, một thẻ 16:9 rộng ~300px đang tải nguyên bản gốc 2,2–4,0 MB,
                       cả trang danh mục 73 MB. Qua optimizer ở w=640 còn ~73 KB — nhỏ hơn 30–55
                       lần, và trình duyệt thật còn nhận WebP nên nhỏ hơn nữa.

                       `sizes` là BẮT BUỘC khi dùng `fill`: thiếu nó Next mặc định 100vw và
                       trình duyệt chọn ảnh to nhất trong srcset cho một ô bé xíu. */
                    <Image
                        src={course.coverUrl}
                        alt={course.name}
                        fill
                        sizes={COVER_SIZES}
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
                {/* title — what people scan. The raw BE course code (an internal identifier
                    like DEMO-JAVA-201 / *_PACKAGE_MAIN that can even mismatch the title) is
                    intentionally NOT shown on the catalog card.
                    The row reserves a FIXED two-line box (min-h-14 = 2 × the `body`
                    line-height of 28px) whether the title wraps or not, so every card in a
                    row starts its meta row at the same y — a 1-line title used to pull the
                    whole stack up and stagger the neighbours. */}
                <div className="flex min-h-14 items-start justify-between gap-2">
                    <Typography weight="semibold" className="line-clamp-2 min-w-0 flex-1">
                        {course.name}
                    </Typography>
                    {/* toggle must not trigger the card navigation (block swallows the press) */}
                    <SaveButton entityType="course" entityId={course.id} />
                </div>

                {/* meta row — [level chip] · N bài · ★ rating (count) · learners. The
                    chip keeps its own bounds (no dot after it); middots split the
                    plain-text segments, each prepended only when a segment precedes it. */}
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted">
                    <Chip size="sm" variant="soft" color="accent">
                        {t(`courseSystem.levels.${course.level}`)}
                    </Chip>
                    {course.lessons > 0 ? (
                        <span className="inline-flex items-center gap-0.5">
                            <BookOpenIcon aria-hidden focusable="false" className="size-3.5" />
                            {t("courseSystem.catalog.lessonsCount", { count: course.lessons })}
                        </span>
                    ) : null}
                    {course.rating != null ? (
                        <>
                            {course.lessons > 0 ? <span aria-hidden>·</span> : null}
                            <span className="inline-flex items-center gap-0.5">
                                <StarIcon
                                    aria-hidden
                                    focusable="false"
                                    weight="fill"
                                    className="size-3.5 text-warning"
                                />
                                {course.rating.toFixed(1)}
                                {course.ratingCount != null ? (
                                    <span>({course.ratingCount})</span>
                                ) : null}
                            </span>
                        </>
                    ) : null}
                    {(course.enrollmentCount ?? 0) > 0 ? (
                        <>
                            {course.lessons > 0 || course.rating != null ? (
                                <span aria-hidden>·</span>
                            ) : null}
                            <span>{t("courses.learners", { count: course.enrollmentCount ?? 0 })}</span>
                        </>
                    ) : null}
                </div>

                {/* short description — 2 lines, only when the BE summary carries one */}
                {course.description ? (
                    <Typography type="body-xs" color="muted" className="line-clamp-2">
                        {course.description}
                    </Typography>
                ) : null}

                {/* mentor + CTA are ONE bottom-pinned group (a single mt-auto): the
                    optional description above absorbs the slack, so the mentor row sits at
                    a fixed offset from the footer on every card instead of drifting with
                    however many rows happen to render. */}
                <div className="mt-auto flex flex-col gap-1.5">
                    {/* mentor — avatar (or initial fallback) + name, only when present */}
                    {course.mentorName ? (
                        <div className="flex items-center gap-1.5">
                            {course.mentorAvatarUrl ? (
                                // plain <img> (avatar delivery URL) — no next/image optimizer config,
                                // mirrors PostMediaGrid's remote-image handling.
                                <img
                                    src={course.mentorAvatarUrl}
                                    alt=""
                                    className="size-5 shrink-0 rounded-full object-cover"
                                />
                            ) : (
                                <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] font-semibold text-accent">
                                    {course.mentorName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <Typography type="body-xs" color="muted" truncate>
                                {course.mentorName}
                            </Typography>
                        </div>
                    ) : null}

                    {/* footer: one CTA cue — enrolled → "Tiếp tục học", else "Xem khóa học".
                        The whole card is the link, so the caret just slides on hover. */}
                    <div className="flex items-center justify-end border-t border-separator pt-2">
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
            </div>
        </Link>
    )
}
