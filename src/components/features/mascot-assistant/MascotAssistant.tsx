"use client"

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { cn } from "@heroui/react"
import { CaretRightIcon, XIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { Link, usePathname, useRouter } from "@/i18n/navigation"
import { useTour } from "@/components/features/onboarding"
import { useCookieConsentStore } from "@/hooks/zustand/cookieConsent/store"
import { useContentAiChatOverlayState } from "@/hooks/zustand/overlay/hooks"
import { getAssistantBubbles, getAssistantOptions, type AssistantBubble } from "./options"

/**
 * The waving FrosTES artwork (transparent background, white sticker outline baked
 * in, loops forever on its own). Animated WebP with an animated-GIF fallback for
 * the browsers that never shipped animated WebP — served through a plain
 * `<picture>`, NOT `next/image` (the image optimizer would flatten an animated
 * source to a single frame, and `<picture>` is the only way to express the
 * fallback). Intrinsic size is the WebP's 260×365; the rendered width comes from
 * the wrapper class and the height follows via `h-auto` (no distortion).
 */
const MASCOT_WEBP = "/fes-mascot-wave.webp"
const MASCOT_GIF = "/fes-mascot-wave.gif"
const MASCOT_WIDTH = 260
const MASCOT_HEIGHT = 365

/**
 * `/community/...` carries `CommunityLiveChatFab`, which only exists BELOW `xl`
 * (from `xl` the live-chat rail replaces it) — so the mascot steps aside there with
 * `max-xl:hidden` rather than being removed outright. Everywhere else it shows,
 * INCLUDING the lesson reader: the reader's old circular button was retired in
 * favour of this mascot, whose panel and proactive line open the same grounded chat.
 */
const COMMUNITY_ROUTE = /^\/community(?:\/|$)/

/** How many proactive bubbles one visit may ever see (anti-nag cap). */
const BUBBLE_MAX_PER_VISIT = 3
/** First bubble lands somewhere in this window after the visit starts (ms). */
const BUBBLE_FIRST_DELAY: readonly [number, number] = [30_000, 60_000]
/** Later bubbles land somewhere in this window after the previous one closed (ms). */
const BUBBLE_REPEAT_DELAY: readonly [number, number] = [180_000, 300_000]
/** A bubble hides itself after this long if nobody touches it (ms). */
const BUBBLE_VISIBLE_MS = 8_000

/**
 * Grace period between the mouse leaving the assistant and a HOVER-opened panel
 * closing (ms).
 *
 * Without it hover-to-open is nearly unusable with a mouse: the shell is
 * `pointer-events-none` so the GAP between the character and the panel is not
 * hoverable, and the character sits in the corner while the panel opens up-and-left
 * of it — so the natural diagonal travel from one to the other crosses dead space,
 * fires `pointerleave`, and the panel vanishes before the pointer arrives.
 *
 * With it, leaving only ARMS a close; entering the character or the panel disarms it
 * again. So the panel lingers just long enough to be walked into, and still closes on
 * its own if the visitor was only passing by.
 *
 * Only HOVER-opened panels are on this timer — see {@link OpenSource}.
 */
const HOVER_CLOSE_DELAY_MS = 2_000

/**
 * What opened the panel, which decides how it is allowed to close.
 *
 *  - `"hover"` — the mouse arrived. The panel is on the {@link HOVER_CLOSE_DELAY_MS}
 *    timer, and a click on the mascot ADOPTS it (`"hover"` → `"click"`) instead of
 *    toggling it shut.
 *  - `"click"` — a deliberate click, tap or Enter. The panel stays until the visitor
 *    dismisses it (click the mascot again / Escape / outside tap / close button /
 *    navigation); the mouse merely wandering off does NOT close it.
 */
type OpenSource = "hover" | "click"

/**
 * Bubbles shown SO FAR IN THIS VISIT. Deliberately a module-level counter rather
 * than component state: the assistant remounts on some route transitions, and a
 * state counter would reset the cap each time (a visitor who browses ten pages
 * would get thirty bubbles). A full page load starts a new module instance = a new
 * visit, which is exactly the "in-memory / per-session" scope the spec asks for —
 * so no storage is involved.
 */
let bubblesShownThisVisit = 0

/** Uniform integer in `[min, max]`. */
const randomBetween = ([min, max]: readonly [number, number]) =>
    min + Math.floor(Math.random() * (max - min + 1))

/**
 * FrosTES, the floating assistant: the WAVING mascot parked in the bottom-right
 * corner of every page (no circular button frame — the character itself is the
 * affordance, and the wave is the artwork's own animation, not code). Hovering
 * with a mouse, tapping on touch, or pressing Enter/Space on the keyboard opens a
 * panel of shortcuts.
 *
 * The shortcut list is CONTEXTUAL ({@link getAssistantOptions}): the default set is
 * the ENTIRE AI feature roster (the account menu no longer has an AI entry — this
 * panel replaced it); on a lesson the grounded lesson chat leads; and inside a
 * subject workspace (`/subjects/<id>/…`) the panel becomes that subject's AI
 * toolbox, which is why the workspace rail no longer carries an `AI` nav row.
 *
 * Every so often the mascot also floats a PROACTIVE bubble to invite a first
 * interaction: the first ~30–60s into the visit, then at random 3–5 minute gaps,
 * capped at {@link BUBBLE_MAX_PER_VISIT} per visit and never while the panel is
 * open. The LINE MATCHES THE PAGE ({@link getAssistantBubbles}) and so does what
 * clicking it does — on a lesson it asks whether you have a question and opens the
 * grounded chat directly, and only where the route suggests nothing does it fall
 * back to small talk that merely opens the menu.
 *
 * Interaction notes:
 *  - Hover open/close is bound to `pointerType === "mouse"` only, so a tap does
 *    not both "hover" and "click" (which would toggle the panel twice on touch).
 *  - A click on a HOVER-opened panel ADOPTS it rather than closing it. That is
 *    what góp ý #5 was really about: hover opened the panel, the reflex click that
 *    followed fell into the toggle's close branch, and pointing at the mascot and
 *    clicking it looked like it "turned the assistant off". The first click now
 *    just takes ownership ({@link OpenSource}); a SECOND click closes.
 *  - Leaving with the mouse ARMS a close ({@link HOVER_CLOSE_DELAY_MS}) instead of
 *    closing outright, so the pointer can cross the un-hoverable gap into the panel
 *    — and only for a hover-opened panel, so a panel the visitor deliberately
 *    clicked open never evaporates just because the mouse wandered off.
 *  - The toggle is a PLAIN `<button onClick>` (not a HeroUI `onPress`) so it stays
 *    clickable in headless verification runs.
 *  - The idle bob is CSS keyframes (`.mascot-float` in `globals.css`), never
 *    `requestAnimationFrame`, and is fully disabled under
 *    `prefers-reduced-motion: reduce` (the artwork keeps waving — a decoded
 *    animated image is not ours to freeze).
 *
 * The character PEEKS: it is drawn larger than its slot and pushed diagonally past
 * the bottom-right corner, so the viewport edge crops it to a half-body leaning in
 * from off-screen rather than a whole figurine standing in the page.
 *
 * Mobile: the wrapper is `pointer-events-none` (only the mascot, the bubble and
 * the panel take taps, so the transparent parts never swallow a tap meant for the
 * page), the figure is 128px wide before cropping, it sits above the safe-area
 * inset, and the panel is capped at `100vw - 2rem` so it never runs off screen. It
 * is also hidden while a guided tour is running (tour spotlights stay clear, and
 * two mascots never share the screen).
 */
export const MascotAssistant = () => {
    const t = useTranslations("mascot.assistant")
    // The option rows come from `options.ts` with ABSOLUTE keys (they mix namespaces:
    // `mascot.assistant.*` for the default set, `subjects.aiTools.*` for the subject
    // toolbox), so they resolve against the ROOT translator, not `t`.
    const tRoot = useTranslations()
    const pathname = usePathname()
    const { isActive: tourActive } = useTour()
    // The cookie-consent bar is `fixed inset-x-0 bottom-0 z-40` — the SAME band and
    // z-layer this mascot sits in, so on a phone the mascot would land on top of the
    // Accept / Reject buttons. `decided`: null = store not hydrated yet, false = bar
    // is up. Rendering waits for hydration (no SSR mismatch); once hydrated the
    // mascot shows either way, lifted above the bar while it is up.
    const consentDecided = useCookieConsentStore((state) => state.decided)
    const router = useRouter()
    // The lesson chat has no route: it is a floating panel hosted by the learn layout
    // and opened through the shared overlay store. That is what an `openLessonChat`
    // target drives.
    const { open: openLessonChat } = useContentAiChatOverlayState()
    const panelId = useId()
    const containerRef = useRef<HTMLDivElement>(null)
    const [isOpen, setIsOpen] = useState(false)
    /** The line currently floating above the mascot, `null` when none is. */
    const [bubble, setBubble] = useState<AssistantBubble | null>(null)

    const pathnameValue = pathname ?? ""
    // `decided === null` = store chưa hydrate → chưa render (tránh lệch SSR/hydration).
    // `decided === false` = banner cookie đang hiện: VẪN render, chỉ đẩy linh vật lên
    // trên banner. Ẩn hẳn ở nhánh này là sai yêu cầu "hiện ở TOÀN BỘ các trang", mà
    // người mới — nhóm cần trợ lý nhất — lại đúng là nhóm chưa bấm đồng ý cookie.
    // Tính TRƯỚC các effect (không phải ngay chỗ `return null`) để vòng hẹn bong bóng
    // biết mà nằm im: trang đang chạy tour thì không có linh vật, hẹn giờ ở đó chỉ
    // tiêu hết quota 3 bong bóng/phiên vào hư không.
    const isHidden = consentDecided === null || tourActive

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

    // Schedule the NEXT proactive bubble. Runs whenever the corner goes quiet
    // (no panel, no bubble): the first wait is short, later ones are minutes apart.
    // Opening the panel counts as "the visitor engaged", so the pending timer is
    // dropped by this effect re-running with `isOpen` true.
    useEffect(() => {
        if (isHidden || isOpen || bubble !== null || bubblesShownThisVisit >= BUBBLE_MAX_PER_VISIT) {
            return
        }
        const timer = setTimeout(
            () => {
                bubblesShownThisVisit += 1
                // Read the candidates AT FIRING TIME, not when the timer was armed:
                // the visitor may have walked from a course page into a lesson during
                // the wait, and the line must match where they are NOW.
                const candidates = getAssistantBubbles(pathnameValue)
                setBubble(candidates[Math.floor(Math.random() * candidates.length)])
            },
            randomBetween(bubblesShownThisVisit === 0 ? BUBBLE_FIRST_DELAY : BUBBLE_REPEAT_DELAY),
        )
        return () => clearTimeout(timer)
    }, [isHidden, isOpen, bubble, pathnameValue])

    // A bubble nobody answers gets out of the way on its own.
    useEffect(() => {
        if (bubble === null) {
            return
        }
        const timer = setTimeout(() => setBubble(null), BUBBLE_VISIBLE_MS)
        return () => clearTimeout(timer)
    }, [bubble])

    /** Pending "close because the mouse left" timer, `null` when none is armed. */
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const cancelPendingClose = useCallback(() => {
        if (closeTimerRef.current !== null) {
            clearTimeout(closeTimerRef.current)
            closeTimerRef.current = null
        }
    }, [])
    // A timer must never outlive the component.
    useEffect(() => cancelPendingClose, [cancelPendingClose])

    /**
     * What opened the CURRENTLY open panel. A ref, not state: the click handler has
     * to read it synchronously in the middle of the same gesture that may change it,
     * and nothing about it is rendered.
     */
    const openSourceRef = useRef<OpenSource | null>(null)
    // Whoever closed the panel — Escape, an outside tap, the close button, a route
    // change, a chosen option — ownership dies with it. Resetting here rather than at
    // each of those call sites means a new close path cannot forget to do it and
    // leave the next hover-opened panel wrongly marked "click".
    useEffect(() => {
        if (!isOpen) {
            openSourceRef.current = null
        }
    }, [isOpen])

    // Opening the panel (hover, tap, click, keyboard) always retires the bubble — the
    // two must never share the corner — and disarms any pending close, so a panel that
    // was just reopened can never be shut by a timer armed before it.
    const openPanel = useCallback(
        (source: OpenSource) => {
            cancelPendingClose()
            openSourceRef.current = source
            setBubble(null)
            setIsOpen(true)
        },
        [cancelPendingClose],
    )

    /**
     * Send the visitor where a row or a bubble points. A route navigates; the lesson
     * tutor has no route, so it opens the grounded chat that the learn layout already
     * hosts. Small talk (neither) simply opens the menu instead of going nowhere.
     */
    const runTarget = useCallback(
        (target: { href?: string; action?: "openLessonChat" }) => {
            setBubble(null)
            setIsOpen(false)
            if (target.action === "openLessonChat") {
                openLessonChat()
                return
            }
            if (target.href !== undefined) {
                router.push(target.href)
            }
        },
        [openLessonChat, router],
    )

    // Mouse only: a touch tap also fires pointerenter, and letting it open here
    // would fight the click toggle below (open → toggle back closed). Entering ANY
    // part of the assistant — character or panel — lands here, which is what makes
    // the walk from one to the other survivable.
    const onPointerEnter = useCallback(
        (event: React.PointerEvent) => {
            if (event.pointerType !== "mouse") {
                return
            }
            // Re-entering disarms a pending close. Already open by CLICK stays owned by
            // the click — the mouse passing back over it must not put a deliberate
            // panel back on the hover timer.
            cancelPendingClose()
            if (!isOpen) {
                openPanel("hover")
            }
        },
        [cancelPendingClose, isOpen, openPanel],
    )
    // Leaving only ARMS the close; it does not close. See HOVER_CLOSE_DELAY_MS for why
    // an immediate close makes the panel nearly unreachable with a mouse. A panel the
    // visitor CLICKED open is not on this timer at all — that one is theirs to dismiss.
    const onPointerLeave = useCallback(
        (event: React.PointerEvent) => {
            if (event.pointerType !== "mouse" || openSourceRef.current !== "hover") {
                return
            }
            cancelPendingClose()
            closeTimerRef.current = setTimeout(() => {
                closeTimerRef.current = null
                setIsOpen(false)
            }, HOVER_CLOSE_DELAY_MS)
        },
        [cancelPendingClose],
    )

    /**
     * The mascot's own click. Three branches, and the middle one is the whole point of
     * góp ý #5: pointing at the mascot ALREADY opened the panel by hover, so the click
     * that naturally follows must not be read as "close". It ADOPTS the open panel
     * instead — after which a second, deliberate click closes it like any toggle.
     */
    const onToggleClick = useCallback(() => {
        if (!isOpen) {
            openPanel("click")
            return
        }
        if (openSourceRef.current === "hover") {
            cancelPendingClose()
            openSourceRef.current = "click"
            return
        }
        setIsOpen(false)
    }, [cancelPendingClose, isOpen, openPanel])

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

    // Which shortcuts the panel offers depends on WHERE the visitor is (subject
    // workspace → that subject's AI tools; everywhere else → the full AI roster).
    const optionSet = useMemo(() => getAssistantOptions(pathnameValue), [pathnameValue])
    if (isHidden) {
        return null
    }
    const consentBarUp = consentDecided === false

    return (
        <div
            ref={containerRef}
            data-testid="mascot-assistant"
            // On the SHELL, not the toggle: React's synthetic enter/leave treats the
            // whole subtree as one region, so walking mascot → panel never leaves it
            // and the pointer can cross the un-hoverable gap between them.
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
            onBlur={onBlur}
            // `flex-col-reverse` = the TOGGLE comes first in the DOM but renders at
            // the BOTTOM, with the bubble/panel stacked above it. That keeps the
            // visual order (mascot low, options above) while Tab still walks toggle →
            // options instead of jumping past them.
            //
            // `pointer-events-none` on the shell + `pointer-events-auto` on the real
            // surfaces: the gap between panel and mascot stays hoverable (the mouse
            // can travel into the panel) without blocking taps on the page.
            //
            // The shell is pinned top AND bottom (`top-4 … bottom-4`) even though the
            // content sits at the bottom: that gives it a BOUNDED height, which is what
            // lets the panel shrink to the room actually left above the mascot instead
            // of running off the top of a short window (a `max-h-[60vh]` guess does not
            // survive the cookie bar lifting the whole stack by 10rem). `justify-start`
            // in `flex-col-reverse` packs everything back down at the bottom edge.
            className={cn(
                "pointer-events-none fixed bottom-4 right-4 top-4 z-40 flex flex-col-reverse items-end justify-start gap-2 pb-[env(safe-area-inset-bottom)] sm:bottom-6 sm:right-6 sm:top-6",
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
                onClick={onToggleClick}
                // NO circular frame / background: the waving character IS the button.
                //
                // PEEKING POSE: the character leans and is pushed diagonally into the corner, so
                // the viewport edge crops it — head, waving paw and the shirt-front stay on
                // screen, the legs and the outer half of the paw go off it.
                //
                // THESE NUMBERS WERE SOLVED, NOT GUESSED, and they are coupled — do not nudge one
                // by hand. The preview pane in this repo's tooling cannot be screenshotted, so the
                // pose was fitted offline: rasterise the artwork at `w`, rotate it, find the
                // rightmost OPAQUE pixel among the rows that will actually be on screen (the
                // widest part of the body is the hips, which are cropped away — measuring the
                // whole silhouette leaves the visible head/chest short of the corner), then place
                // it so that pixel lands just PAST the screen edge (a 12px / 18px overshoot, which
                // is what tucks the paw into the corner instead of parking it beside it) and 68%
                // of the body height remains. Re-run that fit if the artwork, the width or the
                // angle ever changes.
                //   mobile  84px  · -14° → translate(31px, 52px)
                //   ≥ sm    126px · -14° → translate(47px, 78px)
                //
                // The rotation uses the DEFAULT (center) origin — the fit above assumes it. An
                // `origin-bottom-right` here silently invalidates every number.
                //
                // Each push is PAIRED with the negative `-mt` beside it: the translate moves only
                // the drawn character, not its layout slot, so without an equal negative top margin
                // the panel would still open from where the character USED to be and float far
                // above its head. Change one, change the other.
                //
                // The transform lives on the BUTTON, not the image: the hit area travels with the
                // visual, and the `<img>` keeps its own `.mascot-float` bob independent of this pose.
                className="pointer-events-auto -mt-[52px] block w-[84px] shrink-0 translate-x-[31px] translate-y-[52px] rotate-[-14deg] cursor-pointer border-0 bg-transparent p-0 outline-none focus-visible:rounded-2xl focus-visible:ring-2 focus-visible:ring-accent sm:-mt-[78px] sm:w-[126px] sm:translate-x-[47px] sm:translate-y-[78px]"
            >
                <picture>
                    <source srcSet={MASCOT_WEBP} type="image/webp" />
                    {/* Plain <img>, not next/image: the optimizer would flatten the
                        animation to a single frame, and only <picture>/<source> can
                        express the WebP→GIF fallback. */}
                    <img
                        src={MASCOT_GIF}
                        alt=""
                        aria-hidden
                        width={MASCOT_WIDTH}
                        height={MASCOT_HEIGHT}
                        draggable={false}
                        className="mascot-float h-auto w-full select-none object-contain drop-shadow-lg"
                    />
                </picture>
            </button>
            {bubble !== null && !isOpen ? (
                <button
                    type="button"
                    data-testid="mascot-assistant-bubble"
                    // A line that names a feature goes STRAIGHT there — that is the whole
                    // point of asking "cần giải đáp buổi học không?" instead of "xin chào".
                    // Small talk has nowhere to go, so it opens the menu.
                    onClick={() =>
                        bubble.href !== undefined || bubble.action !== undefined
                            ? runTarget(bubble)
                            : openPanel("click")
                    }
                    // The tail is the rotated corner of a second square sharing the
                    // bubble's border + fill, tucked under the right edge so it points
                    // down at the mascot.
                    className="mascot-assistant-panel pointer-events-auto relative mr-4 max-w-[calc(100vw-2rem)] shrink-0 cursor-pointer rounded-2xl border border-default bg-surface px-3 py-2 text-left text-sm text-foreground shadow-lg after:absolute after:-bottom-1.5 after:right-5 after:size-3 after:rotate-45 after:border-b after:border-r after:border-default after:bg-surface after:content-['']"
                >
                    {tRoot(bubble.messageKey)}
                </button>
            ) : null}
            {isOpen ? (
                <nav
                    id={panelId}
                    aria-label={tRoot(optionSet.titleKey)}
                    // Width is capped at the viewport minus the page gutter (the same
                    // `calc(100vw-2rem)` cap the hovercard / streak popover use), so on a
                    // narrow phone the panel never runs off the right edge.
                    className="mascot-assistant-panel pointer-events-auto flex min-h-0 w-[19rem] max-w-[calc(100vw-2rem)] flex-col rounded-3xl border border-default bg-surface p-2 shadow-lg ring-1 ring-accent/10"
                >
                    <div className="flex shrink-0 items-start gap-2 px-2 pb-1 pt-1">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground">
                                {tRoot(optionSet.titleKey)}
                            </p>
                            <p className="text-xs text-muted">{tRoot(optionSet.subtitleKey)}</p>
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
                    {/* The full AI roster is 8 rows — taller than a short phone, so the
                        LIST takes whatever height is left in the shell and scrolls,
                        instead of the panel running off the top of the window. */}
                    <ul className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                        {optionSet.options.map(({ key, href, action, icon: OptionIcon, labelKey, descriptionKey }) => {
                            const body = (
                                <>
                                    <OptionIcon
                                        aria-hidden
                                        focusable="false"
                                        weight="duotone"
                                        className="size-5 shrink-0 text-accent"
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium text-foreground">
                                            {tRoot(labelKey)}
                                        </span>
                                        {/* Two lines, not `truncate`: at 19rem the one-line
                                            version clipped 6 of 8 descriptions mid-word. */}
                                        <span className="line-clamp-2 block text-xs text-muted">
                                            {tRoot(descriptionKey)}
                                        </span>
                                    </span>
                                    <CaretRightIcon
                                        aria-hidden
                                        focusable="false"
                                        className="size-4 shrink-0 text-muted"
                                    />
                                </>
                            )
                            const rowClass =
                                "flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-default"
                            return (
                                <li key={key}>
                                    {/* A row without a route (the lesson tutor) opens a panel on
                                        THIS page, so it must be a button — an <a href> would have
                                        nowhere to point and would break middle-click / copy-link. */}
                                    {href !== undefined ? (
                                        <Link href={href} onClick={() => setIsOpen(false)} className={rowClass}>
                                            {body}
                                        </Link>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => runTarget({ action })}
                                            className={rowClass}
                                        >
                                            {body}
                                        </button>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                </nav>
            ) : null}
        </div>
    )
}

export default MascotAssistant
