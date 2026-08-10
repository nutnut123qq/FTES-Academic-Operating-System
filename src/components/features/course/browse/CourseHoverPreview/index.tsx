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
/**
 * No gap between card edge and panel: the panel sits FLUSH against the card so the
 * pointer moving from one onto the other reports the other as its `relatedTarget`
 * (see {@link CourseHoverPreview} onLeave) — there is no dead zone in between where the
 * pointer would be over neither. Closing is driven purely by `relatedTarget` (no timer),
 * so the panel stays open the whole time the pointer is over the card OR the panel and
 * closes the instant it leaves both.
 */
const GAP_PX = 0
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
 * side flips left when the right side would leave the viewport. Its height is
 * capped at the card's height and its top edge is pinned to the card's top, so
 * it reads as the SAME height as the card (never floating above/below it): the
 * header and CTAs stay pinned while the compact "includes" list scrolls if a
 * short card can't fit it. The primary CTA
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
    const [open, setOpen] = useState(false)
    /** Fixed-position coordinates + the card-matched height cap; `null` until the first post-open measure. */
    const [position, setPosition] = useState<{ left: number, top: number, arrowTop: number, side: "left" | "right", maxHeight: number } | null>(null)

    // Bound to BOTH the card wrapper and the portaled panel. Opening is delayed a
    // touch so grazing the grid doesn't flash popups.
    const onEnter = useCallback(() => {
        if (open) return
        clearTimeout(openTimer.current)
        openTimer.current = setTimeout(() => setOpen(true), OPEN_DELAY_MS)
    }, [open])

    // Close is driven by WHERE the pointer went, not a timer. `relatedTarget` is the
    // element the pointer entered on leaving; while it is still inside the card wrapper
    // OR the (flush, portaled) panel, the pointer never actually left the hover region,
    // so keep the panel open. Only when it moves to something OUTSIDE both — or to
    // nothing (null: off the window) — hide it, immediately. No grace timer means no
    // lingering; checking `relatedTarget` means it never closes while still hovered
    // (including while crossing between the card and the panel).
    const onLeave = useCallback((event: React.PointerEvent) => {
        clearTimeout(openTimer.current)
        const next = event.relatedTarget as Node | null
        if (next && (wrapperRef.current?.contains(next) || panelRef.current?.contains(next))) {
            return
        }
        setOpen(false)
        setPosition(null)
    }, [])

    // the open timer must not fire after unmount (route change while hovering)
    useEffect(() => () => {
        clearTimeout(openTimer.current)
    }, [])

    // measure once per open: pick the side with room, cap the panel at the
    // card's height and PIN its top edge to the card's top — so the panel reads
    // as the same height as the card and grows downward within its bounds
    // instead of floating above and below it. The arrow still points at the
    // card's center.
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
        // Never taller than the card (the whole point of the fix), and never
        // taller than the viewport — the includes list scrolls to absorb any
        // overflow while the header + CTAs stay pinned.
        const maxHeight = Math.min(
            rect.height,
            window.innerHeight - VIEWPORT_MARGIN_PX * 2,
        )
        // Actual rendered height once capped, used to align the top edge and
        // keep the arrow inside the panel.
        const height = Math.min(panelRect.height, maxHeight)
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

    // ponytail: the panel is fixed-positioned against the card, so a PAGE/ancestor
    // scroll (which slides the card out from under it) or a resize makes the coords
    // stale — close then (re-hover reopens correctly positioned). But scrolling the
    // panel's OWN content (the includes list) must NOT close it: the pointer is
    // still on the panel and the viewer is reading it. So ignore scroll events that
    // originate inside the panel — otherwise the panel would vanish mid-hover the
    // moment the viewer scrolled it. Resize always closes (its target is the window,
    // never inside the panel).
    useEffect(() => {
        if (!open) return
        const close = (event?: Event) => {
            if (event && panelRef.current?.contains(event.target as Node)) return
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
                    style={position
                        ? { left: position.left, top: position.top, maxHeight: position.maxHeight }
                        : undefined}
                    className={cn(
                        // desktop-only gate: touch/coarse pointers never render the panel.
                        // flex-col so the header + CTAs pin and the includes list scrolls,
                        // keeping the whole panel inside the card-matched maxHeight.
                        "fixed z-40 hidden w-80 flex-col gap-3 rounded-2xl border border-separator bg-surface p-4 shadow-lg",
                        "[@media(hover:hover)_and_(pointer:fine)]:flex",
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
                    {/* header — pinned (never scrolls), stays at the card's top edge */}
                    <div className="flex shrink-0 flex-col gap-2">
                        <Typography type="h6" weight="bold" className="line-clamp-2">
                            {course.name}
                        </Typography>
                        {/* merchandising badge only — the course LEVEL is no longer a
                            standalone chip here: it lives in the meta line below
                            ("{level} · {N} bài"), so it is not shown twice */}
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
                        {/* level + lesson count on ONE line (the surviving level label) */}
                        <Typography type="body-xs" color="muted">
                            {metaLine}
                        </Typography>
                        {/* extra detail row, freed up by dropping the duplicate level chip:
                            rating + learners when the summary carries them (mirrors the
                            catalog card), else a one-line pitch from the lazily-loaded
                            detail. Pinned in the header region (never scrolls). */}
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
                    {/* includes — the ONLY scrollable region, so a long list never pushes
                        the panel past the card height; capped to a few compact bullets so a
                        typical card fits with no scroll at all (scroll is the fallback) */}
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
                    {/* CTAs — pinned (never scroll), always within the card-matched height */}
                    <div className="flex shrink-0 flex-col gap-2">
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
