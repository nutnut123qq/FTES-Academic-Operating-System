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
import { CheckIcon, ShoppingCartIcon, TrashIcon } from "@phosphor-icons/react"
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

/** Delay before the preview opens, so grazing the grid doesn't flash popups. */
const OPEN_DELAY_MS = 300

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
/** Grace period to travel from the card into the panel without it closing. */
const CLOSE_DELAY_MS = 100
/** Gap between the card edge and the panel. */
const GAP_PX = 12
/** Minimum distance the panel keeps from the viewport edges. */
const VIEWPORT_MARGIN_PX = 16

/**
 * The panel's "Thêm vào giỏ" CTA — the catalog card itself stays uncluttered, so this
 * is the only add-to-cart reachable from the grid. Runs the SAME purchase hook as the
 * course detail page ({@link useCourseEnrollment}), so the cart line, the pending state
 * and the "Đã ở trong giỏ" ↔ remove flip behave identically on both surfaces.
 *
 * Renders NOTHING when there is nothing to add: the viewer already owns the course, the
 * course is free, it is sold per-package (PACKAGE → the package must be picked on the
 * detail page), or the COURSE_UNLOCK product doesn't resolve (`canBuy` false) — mirroring
 * the detail card, which withholds the buy context for the same cases.
 *
 * @param props.course - The catalog card model (slug, price, sale mode).
 * @param props.rawId - The BE course UUID from the lazily-loaded detail; the product
 *   lookup stays idle until it arrives.
 */
const HoverAddToCartButton = ({ course, rawId }: { course: Course, rawId?: string }) => {
    const t = useTranslations("courseSystem")
    // Shared SWR key with every catalog card → no extra request for the ownership check.
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
        // nuốt click như SaveButton: panel là portal nhưng sự kiện React vẫn nổi lên
        // cây cha, đừng để lọt ra điều hướng của card
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
 * hover-capable desktop pointers only — opens a detail panel beside it after a
 * short delay, showing badges, an "updated" line, meta, description, top
 * "what you'll learn" outcomes, an enroll CTA, the save toggle and — for a course
 * that is actually on sale — the grid's only "Thêm vào giỏ" CTA. The panel is
 * a sibling of the card link (never nested inside the `<a>` — it carries its
 * own interactive controls) and is portaled to `document.body` with fixed
 * positioning so the shelf carousels' `overflow-x-auto` cannot clip it; the
 * side flips left when the right side would leave the viewport. The primary CTA
 * mirrors the catalog card: a viewer already enrolled in the course gets
 * "Tiếp tục học" into the learn shell, everyone else gets the enroll CTA onto the
 * detail page. Touch/coarse pointers never see the panel (CSS hover/pointer media
 * gate), keeping the card's tap-to-navigate untouched, and keyboard users lose
 * nothing — all the panel offers also lives on the course detail page.
 *
 * @param props - {@link CourseHoverPreviewProps}
 */
export const CourseHoverPreview = ({ course, children, className }: CourseHoverPreviewProps) => {
    const t = useTranslations()
    const format = useFormatter()
    const router = useRouter()
    // Already enrolled → the CTA continues into the learn shell instead of the
    // enroll flow. Same shared-key hook the catalog card uses
    // (`useQueryMyEnrolledSlugsSwr`), so every card + preview reuses one
    // `GET /courses/me/enrollments` fetch (deduped, token-gated) — hovering never
    // fires a per-card request, and `course.id` is the slug the set is keyed on.
    const { enrolledSlugs } = useQueryMyEnrolledSlugsSwr()
    const isEnrolled = enrolledSlugs.has(course.id)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const openTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
    const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
    const [open, setOpen] = useState(false)
    /** Fixed-position coordinates; `null` until the first post-open measure. */
    const [position, setPosition] = useState<{ left: number, top: number, arrowTop: number, side: "left" | "right" } | null>(null)

    const onEnter = useCallback(() => {
        clearTimeout(closeTimer.current)
        if (open) return
        clearTimeout(openTimer.current)
        openTimer.current = setTimeout(() => setOpen(true), OPEN_DELAY_MS)
    }, [open])

    const onLeave = useCallback(() => {
        clearTimeout(openTimer.current)
        clearTimeout(closeTimer.current)
        closeTimer.current = setTimeout(() => {
            setOpen(false)
            setPosition(null)
        }, CLOSE_DELAY_MS)
    }, [])

    // timers must not fire after unmount (route change while hovering)
    useEffect(() => () => {
        clearTimeout(openTimer.current)
        clearTimeout(closeTimer.current)
    }, [])

    // measure once per open: pick the side with room, center on the card and
    // clamp to the viewport; the arrow keeps pointing at the card's center
    useLayoutEffect(() => {
        if (!open) return
        const wrapper = wrapperRef.current
        const panel = panelRef.current
        if (!wrapper || !panel) return
        const rect = wrapper.getBoundingClientRect()
        const panelRect = panel.getBoundingClientRect()
        const side = rect.right + GAP_PX + panelRect.width <= window.innerWidth
            ? "right" as const
            : "left" as const
        const left = side === "right"
            ? rect.right + GAP_PX
            : rect.left - GAP_PX - panelRect.width
        const centerY = rect.top + rect.height / 2
        const top = Math.min(
            Math.max(centerY - panelRect.height / 2, VIEWPORT_MARGIN_PX),
            Math.max(window.innerHeight - panelRect.height - VIEWPORT_MARGIN_PX, VIEWPORT_MARGIN_PX),
        )
        const arrowTop = Math.min(
            Math.max(centerY - top, VIEWPORT_MARGIN_PX),
            panelRect.height - VIEWPORT_MARGIN_PX,
        )
        setPosition({ left, top, arrowTop, side })
    }, [open])

    // ponytail: fixed coords go stale on scroll/resize — just close (hover
    // previews are short-lived; re-hover reopens correctly positioned)
    useEffect(() => {
        if (!open) return
        const close = () => {
            setOpen(false)
            setPosition(null)
        }
        window.addEventListener("scroll", close, true)
        window.addEventListener("resize", close)
        return () => {
            window.removeEventListener("scroll", close, true)
            window.removeEventListener("resize", close)
        }
    }, [open])

    // Enrolled viewers continue into the course content; everyone else lands on the
    // detail/enroll page. Same routes the catalog card uses (`/courses/{slug}/learn`
    // vs `/courses/{slug}`); the i18n router applies the locale prefix, so plain
    // paths are correct here.
    const onCta = useCallback(
        () => router.push(isEnrolled ? `/courses/${course.id}/learn` : `/courses/${course.id}`),
        [router, course.id, isEnrolled],
    )

    // Lazy-fetch the course detail once the panel opens (the list summary carries
    // no description/lessons/topics) — SWR-cached per course so re-hover is free.
    const { data: detail } = useSWR(
        open ? ["course-hover-detail", course.id] : null,
        () => getCourseDetail(course.id),
    )
    const lessonCount = detail
        ? detail.sections.reduce((sum, section) => sum + (section.lessons?.length ?? 0), 0)
        : course.lessons
    // "Khoá học này bao gồm" — the per-course selling points the BE keeps in
    // `infoCourse` (already in this detail payload). Fall back to the summary's
    // learn-outcomes only when infoCourse is absent, so the panel never empties.
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
            onPointerEnter={onEnter}
            onPointerLeave={onLeave}
        >
            {children}
            {open ? createPortal(
                <div
                    ref={panelRef}
                    onPointerEnter={onEnter}
                    onPointerLeave={onLeave}
                    style={position ? { left: position.left, top: position.top } : undefined}
                    className={cn(
                        // desktop-only gate: touch/coarse pointers never render the panel
                        "fixed z-40 hidden w-80 rounded-2xl border border-separator bg-surface p-4 shadow-lg",
                        "[@media(hover:hover)_and_(pointer:fine)]:block",
                        position ? "visible" : "invisible",
                    )}
                >
                    {/* caret pointing back at the card (rotated square under the panel edge) */}
                    <div
                        aria-hidden
                        style={position ? { top: position.arrowTop } : undefined}
                        className={cn(
                            "absolute size-3 -translate-y-1/2 rotate-45 border-separator bg-surface",
                            position?.side === "right"
                                ? "-left-1.5 border-b border-l"
                                : "-right-1.5 border-r border-t",
                        )}
                    />
                    <div className="flex flex-col gap-3">
                        <Typography type="h6" weight="bold">
                            {course.name}
                        </Typography>
                        <div className="flex flex-wrap items-center gap-2">
                            {course.badge ? (
                                <Chip
                                    size="sm"
                                    variant="soft"
                                    color={course.badge === "bestseller" ? "warning" : "success"}
                                >
                                    {t(`courseSystem.browse.badge.${course.badge}`)}
                                </Chip>
                            ) : null}
                            <Chip size="sm" variant="soft" color="accent">
                                {t(`courseSystem.levels.${course.level}`)}
                            </Chip>
                        </div>
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
                        {includes.length > 0 ? (
                            <div className="flex flex-col gap-2">
                                <Typography type="body-sm" weight="semibold">
                                    {t("courseSystem.browse.preview.includesTitle")}
                                </Typography>
                                <ul className="flex flex-col gap-2">
                                    {includes.map((item, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <CheckIcon
                                                aria-hidden
                                                focusable="false"
                                                className="mt-0.5 size-4 shrink-0 text-success"
                                            />
                                            <Typography type="body-xs" color="muted">
                                                {item}
                                            </Typography>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}
                        <div className="flex items-center gap-2">
                            <Button className="flex-1" onPress={onCta}>
                                {isEnrolled
                                    ? t("courses.continueLearning")
                                    : t("courseSystem.browse.preview.enroll")}
                            </Button>
                            <SaveButton entityType="course" entityId={course.id} />
                        </div>
                        {/* đường thêm vào giỏ DUY NHẤT từ lưới danh mục (card nhỏ không
                            nhồi thêm nút); tự ẩn khi khoá miễn phí / đã sở hữu / bán theo gói */}
                        <HoverAddToCartButton course={course} rawId={detail?.course.id} />
                    </div>
                </div>,
                document.body,
            ) : null}
        </div>
    )
}
