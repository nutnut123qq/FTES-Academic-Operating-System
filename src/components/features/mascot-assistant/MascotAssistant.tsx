"use client"

import React, { useCallback, useEffect, useId, useRef, useState } from "react"
import Image from "next/image"
import { cn } from "@heroui/react"
import {
    CaretRightIcon,
    MapTrifoldIcon,
    ReadCvLogoIcon,
    SparkleIcon,
    XIcon,
    type Icon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { Link, usePathname } from "@/i18n/navigation"
import { useTour } from "@/components/features/onboarding"
import { useCookieConsentStore } from "@/hooks/zustand/cookieConsent/store"

/**
 * Standing FrosTES artwork (full body, waving, transparent background) — the same
 * "plain" sticker set the learn FAB uses, so the assistant and the reader bubble
 * read as the SAME character. Intrinsic size is 365×512; the rendered width comes
 * from the wrapper class and the height follows via `h-auto` (no distortion).
 */
const MASCOT_SRC = "/mascot/plain/greeting.webp"
const MASCOT_WIDTH = 365
const MASCOT_HEIGHT = 512

/**
 * Routes that already own the bottom-right corner with their own floating entry
 * point, where a second floating mascot would sit ON TOP of the existing button:
 *
 *  - `/courses/<id>/learn/...` → `ContentAiFab` (lesson-scoped, grounded AI chat,
 *    and draggable, so it can be parked anywhere down the right edge).
 *  - `/community/...` → `CommunityLiveChatFab`, which only exists BELOW `xl`
 *    (from `xl` the live-chat rail replaces it) — so the mascot is hidden there
 *    with the `max-xl:hidden` class rather than removed outright.
 *
 * Everywhere else the assistant shows.
 */
const LEARN_READER_ROUTE = /^\/courses\/[^/]+\/learn(?:\/|$)/
const COMMUNITY_ROUTE = /^\/community(?:\/|$)/

/** One entry in the assistant's option list. */
interface AssistantOption {
    /** i18n leaf under `mascot.assistant.options` (`<key>.label` + `<key>.description`). */
    readonly key: string
    /** Target route — every one of these is verified to exist in `src/app/[locale]`. */
    readonly href: string
    /** Leading icon. */
    readonly icon: Icon
}

/**
 * The three things FrosTES can hand off to, in the order a learner needs them.
 * `planner` is the AI STUDY-PLAN tool (`/ai/tools/planner`) — NOT the career
 * roadmap page — per the product decision recorded for this change.
 */
const OPTIONS: readonly AssistantOption[] = [
    { key: "planner", href: "/ai/tools/planner", icon: MapTrifoldIcon },
    { key: "cv", href: "/profile/cv", icon: ReadCvLogoIcon },
    { key: "chat", href: "/ai", icon: SparkleIcon },
]

/**
 * FrosTES, the floating assistant: a STANDING, waving mascot parked in the
 * bottom-right corner of every page (no circular button frame — the character
 * itself is the affordance). Hovering with a mouse, tapping on touch, or pressing
 * Enter/Space on the keyboard opens a small panel of shortcuts (study planner /
 * CV / AI chat).
 *
 * Interaction notes:
 *  - Hover open/close is bound to `pointerType === "mouse"` only, so a tap does
 *    not both "hover" and "click" (which would toggle the panel twice on touch).
 *  - The toggle is a PLAIN `<button onClick>` (not a HeroUI `onPress`) so it stays
 *    clickable in headless verification runs.
 *  - The whole wave/idle motion is CSS keyframes (`.mascot-wave` in `globals.css`),
 *    never `requestAnimationFrame`, and is fully disabled under
 *    `prefers-reduced-motion: reduce`.
 *
 * Mobile: the wrapper is `pointer-events-none` (only the mascot and the panel
 * itself take taps, so the transparent parts never swallow a tap meant for the
 * page), the figure is FAB-sized (64px wide), it sits above the safe-area inset,
 * and the panel is capped at `100vw - 2rem` so it never runs off screen. It is
 * also hidden while a guided tour is running (tour spotlights stay clear, and two
 * mascots never share the screen) and while the cookie-consent bar is up (that bar
 * owns the same bottom band + z-layer).
 */
export const MascotAssistant = () => {
    const t = useTranslations("mascot.assistant")
    const pathname = usePathname()
    const { isActive: tourActive } = useTour()
    // The cookie-consent bar is `fixed inset-x-0 bottom-0 z-40` — the SAME band and
    // z-layer this mascot sits in, so on a phone the mascot would land on top of the
    // Accept / Reject buttons. `decided`: null = store not hydrated yet, false = bar
    // is up. Only show the mascot once the visitor has actually decided (`true`),
    // which also makes this a client-only render (no SSR/hydration mismatch).
    const consentDecided = useCookieConsentStore((state) => state.decided)
    const panelId = useId()
    const containerRef = useRef<HTMLDivElement>(null)
    const [isOpen, setIsOpen] = useState(false)

    // Navigating away (usually BY one of the options) closes the panel — the
    // component is mounted once at the root, so it survives route changes.
    useEffect(() => {
        setIsOpen(false)
    }, [pathname])

    // Escape closes; an outside tap closes (touch has no "pointer leave").
    useEffect(() => {
        if (!isOpen) {
            return
        }
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsOpen(false)
            }
        }
        const onPointerDown = (event: PointerEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("keydown", onKeyDown)
        document.addEventListener("pointerdown", onPointerDown)
        return () => {
            document.removeEventListener("keydown", onKeyDown)
            document.removeEventListener("pointerdown", onPointerDown)
        }
    }, [isOpen])

    // Mouse only: a touch tap also fires pointerenter, and letting it open here
    // would fight the click toggle below (open → toggle back closed).
    const onPointerEnter = useCallback((event: React.PointerEvent) => {
        if (event.pointerType === "mouse") {
            setIsOpen(true)
        }
    }, [])
    const onPointerLeave = useCallback((event: React.PointerEvent) => {
        if (event.pointerType === "mouse") {
            setIsOpen(false)
        }
    }, [])

    // Deliberately NO "open on focus": a tap/click focuses the toggle FIRST and
    // then fires `click`, so open-on-focus + toggle-on-click would cancel each
    // other out and the panel would never stay open on touch. Keyboard users open
    // it with Enter/Space on the toggle (which fires the same `click`). This blur
    // guard only closes once focus has left the whole assistant.
    const onBlur = useCallback((event: React.FocusEvent) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsOpen(false)
        }
    }, [])

    const pathnameValue = pathname ?? ""
    // `decided === null` = store chưa hydrate → chưa render (tránh lệch SSR/hydration).
    // `decided === false` = banner cookie đang hiện: VẪN render, chỉ đẩy linh vật lên
    // trên banner. Ẩn hẳn ở nhánh này là sai yêu cầu "hiện ở TOÀN BỘ các trang", mà
    // người mới — nhóm cần trợ lý nhất — lại đúng là nhóm chưa bấm đồng ý cookie.
    if (consentDecided === null || tourActive || LEARN_READER_ROUTE.test(pathnameValue)) {
        return null
    }
    const consentBarUp = consentDecided === false

    return (
        <div
            ref={containerRef}
            data-testid="mascot-assistant"
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
            onBlur={onBlur}
            // `flex-col-reverse` = the TOGGLE comes first in the DOM but renders at
            // the BOTTOM, with the panel stacked above it. That keeps the visual
            // order (mascot low, options above) while Tab still walks toggle →
            // options instead of jumping past them.
            //
            // `pointer-events-none` on the shell + `pointer-events-auto` on the two
            // real surfaces: the gap between panel and mascot stays hoverable (the
            // mouse can travel into the panel) without blocking taps on the page.
            className={cn(
                "pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col-reverse items-end gap-2 pb-[env(safe-area-inset-bottom)] sm:bottom-6 sm:right-6",
                // Banner cookie là `fixed inset-x-0 bottom-0 z-40` — cùng dải, cùng lớp z.
                // Nhấc linh vật lên trên nó thay vì ẩn đi, để không đè nút Đồng ý/Từ chối.
                consentBarUp && "bottom-40 sm:bottom-44",
                COMMUNITY_ROUTE.test(pathnameValue) && "max-xl:hidden",
            )}
        >
            <button
                type="button"
                data-testid="mascot-assistant-toggle"
                aria-label={t("open")}
                aria-expanded={isOpen}
                aria-controls={isOpen ? panelId : undefined}
                onClick={() => setIsOpen((previous) => !previous)}
                // NO circular frame / background: the standing character IS the button.
                className="pointer-events-auto block w-16 cursor-pointer border-0 bg-transparent p-0 outline-none focus-visible:rounded-2xl focus-visible:ring-2 focus-visible:ring-accent sm:w-24"
            >
                <Image
                    src={MASCOT_SRC}
                    alt=""
                    aria-hidden
                    width={MASCOT_WIDTH}
                    height={MASCOT_HEIGHT}
                    draggable={false}
                    className="mascot-wave h-auto w-full select-none object-contain drop-shadow-lg"
                />
            </button>
            {isOpen ? (
                <nav
                    id={panelId}
                    aria-label={t("title")}
                    // Width is capped at the viewport minus the page gutter (the same
                    // `calc(100vw-2rem)` cap the hovercard / streak popover use), so on a
                    // narrow phone the panel never runs off the right edge.
                    className="mascot-assistant-panel pointer-events-auto w-[17rem] max-w-[calc(100vw-2rem)] rounded-3xl border border-default bg-surface p-2 shadow-lg ring-1 ring-accent/10"
                >
                    <div className="flex items-start gap-2 px-2 pb-1 pt-1">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground">{t("title")}</p>
                            <p className="text-xs text-muted">{t("subtitle")}</p>
                        </div>
                        {/* Touch has no "move the pointer away" — give the panel an explicit
                            close so a phone user can always get the page back. */}
                        <button
                            type="button"
                            aria-label={t("close")}
                            onClick={() => setIsOpen(false)}
                            className="-mr-1 -mt-1 rounded-full p-1 text-muted hover:bg-default hover:text-foreground"
                        >
                            <XIcon aria-hidden focusable="false" className="size-4" />
                        </button>
                    </div>
                    <ul className="flex flex-col">
                        {OPTIONS.map(({ key, href, icon: OptionIcon }) => (
                            <li key={key}>
                                <Link
                                    href={href}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-default"
                                >
                                    <OptionIcon
                                        aria-hidden
                                        focusable="false"
                                        weight="duotone"
                                        className="size-5 shrink-0 text-accent"
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium text-foreground">
                                            {t(`options.${key}.label`)}
                                        </span>
                                        <span className="block truncate text-xs text-muted">
                                            {t(`options.${key}.description`)}
                                        </span>
                                    </span>
                                    <CaretRightIcon
                                        aria-hidden
                                        focusable="false"
                                        className="size-4 shrink-0 text-muted"
                                    />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            ) : null}
        </div>
    )
}

export default MascotAssistant
