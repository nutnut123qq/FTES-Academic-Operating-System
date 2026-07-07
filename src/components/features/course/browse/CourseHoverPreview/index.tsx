"use client"

import React, {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react"
import { createPortal } from "react-dom"
import { Button, Chip, Typography, cn } from "@heroui/react"
import { CheckIcon } from "@phosphor-icons/react"
import { useFormatter, useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { SaveButton } from "@/components/blocks/buttons/SaveButton"
import type { WithClassNames } from "@/modules/types/base/class-name"
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
/** Grace period to travel from the card into the panel without it closing. */
const CLOSE_DELAY_MS = 100
/** Gap between the card edge and the panel. */
const GAP_PX = 12
/** Minimum distance the panel keeps from the viewport edges. */
const VIEWPORT_MARGIN_PX = 16

/**
 * Udemy-style hover preview for a catalog course card: wraps the card and — on
 * hover-capable desktop pointers only — opens a detail panel beside it after a
 * short delay, showing badges, an "updated" line, meta, description, top
 * "what you'll learn" outcomes, an enroll CTA and the save toggle. The panel is
 * a sibling of the card link (never nested inside the `<a>` — it carries its
 * own interactive controls) and is portaled to `document.body` with fixed
 * positioning so the shelf carousels' `overflow-x-auto` cannot clip it; the
 * side flips left when the right side would leave the viewport. Touch/coarse
 * pointers never see the panel (CSS hover/pointer media gate), keeping the
 * card's tap-to-navigate untouched, and keyboard users lose nothing — all the
 * panel offers also lives on the course detail page.
 *
 * @param props - {@link CourseHoverPreviewProps}
 */
export const CourseHoverPreview = ({ course, children, className }: CourseHoverPreviewProps) => {
    const t = useTranslations()
    const format = useFormatter()
    const router = useRouter()
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

    const onEnroll = useCallback(
        () => router.push(`/courses/${course.id}`),
        [router, course.id],
    )

    const outcomes = (course.learnOutcomes ?? []).slice(0, 3)
    const metaLine = [
        course.durationHours != null ? t("courseSystem.browse.hours", { count: course.durationHours }) : null,
        t(`courseSystem.levels.${course.level}`),
        t("courseSystem.catalog.lessonsCount", { count: course.lessons }),
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
                        {course.description ? (
                            <Typography type="body-sm" color="muted">
                                {course.description}
                            </Typography>
                        ) : null}
                        {outcomes.length > 0 ? (
                            <ul className="flex flex-col gap-2">
                                {outcomes.map((outcome, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <CheckIcon
                                            aria-hidden
                                            focusable="false"
                                            className="mt-0.5 size-4 shrink-0 text-success"
                                        />
                                        <Typography type="body-xs" color="muted">
                                            {outcome}
                                        </Typography>
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                        <div className="flex items-center gap-2">
                            <Button className="flex-1" onPress={onEnroll}>
                                {t("courseSystem.browse.preview.enroll")}
                            </Button>
                            <SaveButton entityType="course" entityId={course.id} />
                        </div>
                    </div>
                </div>,
                document.body,
            ) : null}
        </div>
    )
}
