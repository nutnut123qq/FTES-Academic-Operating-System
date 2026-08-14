"use client"

import React, {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react"
import { createPortal } from "react-dom"
import useSWR from "swr"
import { Button, Chip, Typography, cn } from "@heroui/react"
import { CheckIcon, ShoppingCartIcon, StarIcon, TrashIcon, UsersIcon } from "@phosphor-icons/react"
import { useFormatter, useTranslations } from "next-intl"
import { getCourseDetail } from "@/modules/api/rest/course"
import { useRouter } from "@/i18n/navigation"
import { SaveButton } from "@/components/blocks/buttons/SaveButton"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useCourseEnrollment } from "../../hooks/useCourseEnrollment"
import { useQueryMyEnrolledSlugsSwr } from "../../hooks/useQueryMyEnrolledSlugsSwr"
import type { Course } from "../../hooks/useQueryCoursesSwr"

/** Props for {@link CourseHoverPreview}. */
export interface CourseHoverPreviewProps extends WithClassNames<undefined> {
    /** The course the preview details. */
    course: Course
    /** The card (or any trigger surface) the preview attaches to. */
    children: React.ReactNode
}

/**
 * Parses the "what this course includes" bullets out of the BE `infoCourse`
 * JSON string (`{"additionalProp1": "...", ...}`). Keeps the additionalProp1..N
 * order and drops blanks; returns [] for missing/malformed JSON (degrades clean).
 */
const parseIncludes = (infoCourse: string | null | undefined): Array<string> => {
    if (!infoCourse) return []
    try {
        const parsed = JSON.parse(infoCourse) as Record<string, unknown>
        return Object.entries(parsed)
            .sort(([a], [b]) => {
                const na = Number(a.replace(/\D/g, "")) || 0
                const nb = Number(b.replace(/\D/g, "")) || 0
                return na - nb
            })
            .map(([, value]) => (typeof value === "string" ? value.trim() : ""))
            .filter(Boolean)
    } catch {
        return []
    }
}

/** Gap between card edge and panel in pixels. */
const GAP_PX = 0
/** Minimum distance the panel keeps from the viewport edges. */
const VIEWPORT_MARGIN_PX = 16

/**
 * The panel's "Thêm vào giỏ" CTA — the catalog card itself stays uncluttered, so this
 * is the only add-to-cart reachable from the grid. Runs the SAME purchase hook as the
 * course detail page ({@link useCourseEnrollment}), so the cart line, the pending state
 * and the "Đã ở trong giỏ" ↔ remove flip behave identically on both surfaces.
 */
const HoverAddToCartButton = ({ course, rawId }: { course: Course, rawId?: string }) => {
    const t = useTranslations("courseSystem")
    const { enrolledSlugs } = useQueryMyEnrolledSlugsSwr()
    const sellable = course.saleMode !== "PACKAGE" && (course.priceVnd ?? 0) > 0
    const { isEnrolled, canBuy, inCart, onAddToCart, onRemoveFromCart, isTogglingCart } =
        useCourseEnrollment(
            course.id,
            { isEnrolled: enrolledSlugs.has(course.id) },
            sellable ? { rawId, title: course.name, priceVnd: course.priceVnd } : undefined,
        )

    if (isEnrolled || !canBuy) return null

    return (
        <span
            className="flex"
            onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
            }}
        >
            {inCart ? (
                <Button
                    variant="secondary"
                    fullWidth
                    onPress={onRemoveFromCart}
                    isPending={isTogglingCart}
                >
                    <CheckIcon aria-hidden focusable="false" className="size-5" />
                    {t("detail.inCart")}
                    <TrashIcon aria-hidden focusable="false" className="size-4" />
                </Button>
            ) : (
                <Button
                    variant="secondary"
                    fullWidth
                    onPress={onAddToCart}
                    isPending={isTogglingCart}
                >
                    <ShoppingCartIcon aria-hidden focusable="false" className="size-5" />
                    {t("detail.package.addToCart")}
                </Button>
            )}
        </span>
    )
}

/**
 * Udemy-style hover preview for a catalog course card: wraps the card and — on
 * hover-capable desktop pointers only — opens a detail panel beside it when the pointer
 * arrives, showing badges, an "updated" line, meta, description, top
 * "what you'll learn" outcomes, an enroll CTA, the save toggle and — for a course
 * that is on sale — the grid's "Thêm vào giỏ" CTA.
 */
export const CourseHoverPreview = ({ course, children, className }: CourseHoverPreviewProps) => {
    const t = useTranslations()
    const format = useFormatter()
    const router = useRouter()
    const { enrolledSlugs } = useQueryMyEnrolledSlugsSwr()
    const isEnrolled = enrolledSlugs.has(course.id)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    const [open, setOpen] = useState(false)
    const [position, setPosition] = useState<{
        left: number
        top: number
        arrowTop: number
        side: "left" | "right"
        maxHeight: number
    } | null>(null)

    const handleEnter = useCallback(() => {
        setOpen(true)
    }, [])

    const handleLeave = useCallback((event: React.PointerEvent) => {
        const next = event.relatedTarget as Node | null
        if (next && (wrapperRef.current?.contains(next) || panelRef.current?.contains(next))) {
            return
        }
        setOpen(false)
        setPosition(null)
    }, [])

    // Calculate position
    const updatePosition = useCallback(() => {
        if (!open) return
        const wrapper = wrapperRef.current
        const panel = panelRef.current
        if (!wrapper || !panel) return

        const rect = wrapper.getBoundingClientRect()
        const panelRect = panel.getBoundingClientRect()

        const side = rect.right + GAP_PX + panelRect.width <= window.innerWidth - VIEWPORT_MARGIN_PX
            ? "right" as const
            : "left" as const

        const left = side === "right"
            ? rect.right + GAP_PX
            : Math.max(VIEWPORT_MARGIN_PX, rect.left - GAP_PX - panelRect.width)

        const maxHeight = Math.min(
            rect.height,
            window.innerHeight - VIEWPORT_MARGIN_PX * 2,
        )

        const height = Math.min(panelRect.height || maxHeight, maxHeight)
        const top = Math.min(
            Math.max(rect.top, VIEWPORT_MARGIN_PX),
            Math.max(window.innerHeight - height - VIEWPORT_MARGIN_PX, VIEWPORT_MARGIN_PX),
        )

        const centerY = rect.top + rect.height / 2
        const arrowTop = Math.min(
            Math.max(centerY - top, VIEWPORT_MARGIN_PX),
            height - VIEWPORT_MARGIN_PX,
        )

        setPosition({ left, top, arrowTop, side, maxHeight })
    }, [open])

    useLayoutEffect(() => {
        updatePosition()
    }, [updatePosition])

    // Lazy-fetch course detail when panel is open
    const { data: detail } = useSWR(
        open ? ["course-hover-detail", course.id] : null,
        () => getCourseDetail(course.id),
    )

    // Re-align position once detail loads and renders content
    useLayoutEffect(() => {
        if (detail) {
            updatePosition()
        }
    }, [detail, updatePosition])

    // Handle scroll and resize safely:
    // Only close if the page-level scroll occurs or the container containing the card scrolls.
    // Unrelated scrolls (e.g. FeaturedSlider auto-play) are IGNORED.
    useEffect(() => {
        if (!open) return

        const handleScroll = (event: Event) => {
            const target = event.target
            if (!target) return

            // Ignore scrolling inside the preview panel itself
            if (panelRef.current && target instanceof Node && panelRef.current.contains(target)) return

            // Close on window / page-level scroll
            if (
                target === document ||
                target === document.documentElement ||
                target === document.body ||
                target === window
            ) {
                setOpen(false)
                setPosition(null)
                return
            }

            // Close if the scroll occurred in an ancestor of the card (e.g. category shelf carousel)
            if (
                wrapperRef.current &&
                target instanceof HTMLElement &&
                target.contains(wrapperRef.current)
            ) {
                setOpen(false)
                setPosition(null)
            }
        }

        const handleResize = () => {
            setOpen(false)
            setPosition(null)
        }

        window.addEventListener("scroll", handleScroll, true)
        window.addEventListener("resize", handleResize)
        return () => {
            window.removeEventListener("scroll", handleScroll, true)
            window.removeEventListener("resize", handleResize)
        }
    }, [open])

    const onCta = useCallback(
        () => router.push(isEnrolled ? `/courses/${course.id}/learn` : `/courses/${course.id}`),
        [router, course.id, isEnrolled],
    )

    const lessonCount = detail
        ? detail.sections.reduce((sum, section) => sum + (section.lessons?.length ?? 0), 0)
        : course.lessons

    const includes = (() => {
        const parsed = parseIncludes(detail?.infoCourse)
        return parsed.length > 0 ? parsed : (course.learnOutcomes ?? [])
    })()

    const metaLine = [
        course.durationHours != null ? t("courseSystem.browse.hours", { count: course.durationHours }) : null,
        t(`courseSystem.levels.${course.level}`),
        t("courseSystem.catalog.lessonsCount", { count: lessonCount }),
    ].filter(Boolean).join(" · ")

    return (
        <div
            ref={wrapperRef}
            className={cn("relative", className)}
            onPointerEnter={handleEnter}
            onPointerLeave={handleLeave}
        >
            {children}
            {open ? createPortal(
                <div
                    ref={panelRef}
                    onPointerEnter={handleEnter}
                    onPointerLeave={handleLeave}
                    style={position
                        ? { left: position.left, top: position.top, maxHeight: position.maxHeight }
                        : undefined}
                    className={cn(
                        "fixed z-50 hidden w-80 flex-col gap-3 rounded-2xl border border-separator bg-surface p-4 shadow-xl",
                        "[@media(hover:hover)_and_(pointer:fine)]:flex",
                        position ? "visible" : "invisible pointer-events-none",
                    )}
                >
                    {/* Caret pointing back at card with pointer-events-none to prevent mouse collision */}
                    <div
                        aria-hidden
                        style={position ? { top: position.arrowTop } : undefined}
                        className={cn(
                            "pointer-events-none absolute size-3 -translate-y-1/2 rotate-45 border-separator bg-surface",
                            position?.side === "right"
                                ? "-left-1.5 border-b border-l"
                                : "-right-1.5 border-r border-t",
                        )}
                    />

                    {/* Header */}
                    <div className="flex shrink-0 flex-col gap-2">
                        <Typography type="h6" weight="bold" className="line-clamp-2">
                            {course.name}
                        </Typography>

                        {course.badge ? (
                            <div className="flex flex-wrap items-center gap-2">
                                <Chip
                                    size="sm"
                                    variant="soft"
                                    color={course.badge === "bestseller" ? "warning" : "success"}
                                >
                                    {t(`courseSystem.browse.badge.${course.badge}`)}
                                </Chip>
                            </div>
                        ) : null}

                        {course.updatedAt ? (
                            <Typography type="body-xs" weight="medium" className="text-success">
                                {t("courseSystem.browse.preview.updated", {
                                    date: format.dateTime(new Date(course.updatedAt), { month: "long", year: "numeric" }),
                                })}
                            </Typography>
                        ) : null}

                        <Typography type="body-xs" color="muted">
                            {metaLine}
                        </Typography>

                        {course.rating != null || (course.enrollmentCount ?? 0) > 0 ? (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                {course.rating != null ? (
                                    <span className="flex items-center gap-1">
                                        <StarIcon
                                            aria-hidden
                                            focusable="false"
                                            weight="fill"
                                            className="size-4 text-warning"
                                        />
                                        <Typography type="body-xs" weight="medium">
                                            {course.rating.toFixed(1)}
                                        </Typography>
                                    </span>
                                ) : null}
                                {(course.enrollmentCount ?? 0) > 0 ? (
                                    <span className="flex items-center gap-1">
                                        <UsersIcon
                                            aria-hidden
                                            focusable="false"
                                            className="size-4 text-muted"
                                        />
                                        <Typography type="body-xs" color="muted">
                                            {t("courses.learners", { count: course.enrollmentCount ?? 0 })}
                                        </Typography>
                                    </span>
                                ) : null}
                            </div>
                        ) : detail?.description ? (
                            <Typography type="body-xs" color="muted" className="line-clamp-1">
                                {detail.description}
                            </Typography>
                        ) : null}
                    </div>

                    {/* Includes list */}
                    {includes.length > 0 ? (
                        <div className="flex min-h-0 flex-col gap-2 overflow-y-auto">
                            <Typography type="body-sm" weight="semibold" className="shrink-0">
                                {t("courseSystem.browse.preview.includesTitle")}
                            </Typography>
                            <ul className="flex flex-col gap-2">
                                {includes.slice(0, 4).map((item, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <CheckIcon
                                            aria-hidden
                                            focusable="false"
                                            className="mt-0.5 size-4 shrink-0 text-success"
                                        />
                                        <Typography type="body-xs" color="muted" className="line-clamp-2">
                                            {item}
                                        </Typography>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}

                    {/* CTAs */}
                    <div className="flex shrink-0 flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Button className="flex-1" onPress={onCta}>
                                {isEnrolled
                                    ? t("courses.continueLearning")
                                    : t("courseSystem.browse.preview.enroll")}
                            </Button>
                            <SaveButton entityType="course" entityId={course.id} />
                        </div>
                        <HoverAddToCartButton course={course} rawId={detail?.course.id} />
                    </div>
                </div>,
                document.body,
            ) : null}
        </div>
    )
}
