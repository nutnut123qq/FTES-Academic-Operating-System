"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { Popover, cn } from "@heroui/react"
import type { ReactElement } from "react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link UserHovercard}. */
export interface UserHovercardProps extends WithClassNames<{ content?: string }> {
    /** The trigger element (avatar, name, or avatar+name). */
    children: React.ReactNode
    /** Content rendered inside the popup card. */
    content: React.ReactNode
    /** Called when the hover/focus delay completes and the popup should open. */
    onOpen?: () => void
    /**
     * Called once hover INTENT is established — earlier than {@link onOpen}, while the
     * card is still counting down to open. Callers that fetch on demand should start
     * the request here so the card usually opens already populated instead of opening
     * on a skeleton and popping the content in a moment later.
     */
    onIntent?: () => void
    /** Delay in ms before opening on hover/focus. */
    openDelay?: number
    /**
     * Delay in ms before {@link onIntent} fires. Deliberately non-zero: a pointer
     * sweeping across a feed crosses many avatars, and firing on the first pixel would
     * turn one scroll into a request per author passed over. Short enough to still buy
     * most of the request back before the card opens.
     */
    intentDelay?: number
    /**
     * Grace period in ms before closing after leaving trigger or popup.
     * Default is generous so users can cross small gaps between trigger and popup.
     */
    closeDelay?: number
    /** Popover placement. */
    placement?: "top" | "bottom" | "left" | "right" | "bottom start" | "bottom end" | "top start" | "top end"
}

/**
 * Hovercard shell: wraps any trigger with a HeroUI Popover that opens after a
 * short delay, stays open while the pointer moves into the popup (grace period),
 * and closes on `Esc` or outside click. Touch taps fall through to the trigger's
 * native action (e.g. navigation) because pointer-enter is ignored for `touch`.
 *
 * The component is intentionally data-agnostic: the caller owns fetching and
 * passes the rendered card content via `content`.
 *
 * @param props - {@link UserHovercardProps}
 */
export const UserHovercard = ({
    children,
    content,
    onOpen,
    onIntent,
    openDelay = 400,
    intentDelay = 120,
    closeDelay = 1000,
    className,
    classNames,
    placement = "bottom start",
}: UserHovercardProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const intentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const clearTimers = useCallback(() => {
        if (openTimerRef.current) {
            clearTimeout(openTimerRef.current)
            openTimerRef.current = null
        }
        if (intentTimerRef.current) {
            clearTimeout(intentTimerRef.current)
            intentTimerRef.current = null
        }
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current)
            closeTimerRef.current = null
        }
    }, [])

    const scheduleOpen = useCallback(() => {
        if (isOpen) return
        clearTimers()
        // Warm the data first, then open. The card's own fetch is deduped and cached by
        // the caller, so a second hover on the same person still costs nothing.
        intentTimerRef.current = setTimeout(() => {
            intentTimerRef.current = null
            onIntent?.()
        }, Math.min(intentDelay, openDelay))
        openTimerRef.current = setTimeout(() => {
            openTimerRef.current = null
            setIsOpen(true)
            onOpen?.()
        }, openDelay)
    }, [isOpen, openDelay, intentDelay, onOpen, onIntent, clearTimers])

    const scheduleClose = useCallback(() => {
        clearTimers()
        closeTimerRef.current = setTimeout(() => {
            closeTimerRef.current = null
            setIsOpen(false)
        }, closeDelay)
    }, [closeDelay, clearTimers])

    const handlePointerEnter = useCallback(
        (e: React.PointerEvent) => {
            if (e.pointerType === "touch") return
            scheduleOpen()
        },
        [scheduleOpen],
    )

    const handleFocus = useCallback(() => {
        scheduleOpen()
    }, [scheduleOpen])

    const handlePointerLeave = useCallback(() => {
        scheduleClose()
    }, [scheduleClose])

    const handleBlur = useCallback(() => {
        scheduleClose()
    }, [scheduleClose])

    const handleContentEnter = useCallback(() => {
        clearTimers()
    }, [clearTimers])

    const handleContentLeave = useCallback(() => {
        scheduleClose()
    }, [scheduleClose])

    const handleMouseEnter = handleContentEnter
    const handleMouseLeave = handleContentLeave

    // Global Escape closes the hovercard even when focus is not inside it.
    const isOpenRef = useRef(isOpen)
    useEffect(() => {
        isOpenRef.current = isOpen
    }, [isOpen])

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && isOpenRef.current) {
                setIsOpen(false)
            }
        }
        document.addEventListener("keydown", onKeyDown)
        return () => document.removeEventListener("keydown", onKeyDown)
    }, [])

    const triggerRef = useRef<HTMLElement>(null)

    const child = React.Children.only(children) as ReactElement<{
        ref?: React.Ref<HTMLElement>
        className?: string
        onPointerEnter?: (event: React.PointerEvent) => void
        onPointerLeave?: (event: React.PointerEvent) => void
        onFocus?: (event: React.FocusEvent) => void
        onBlur?: (event: React.FocusEvent) => void
        "aria-haspopup"?: "dialog"
    }>

    const trigger = React.cloneElement(child, {
        ref: triggerRef,
        className: cn("inline-flex", child.props.className, className),
        onPointerEnter: handlePointerEnter,
        onPointerLeave: handlePointerLeave,
        onFocus: handleFocus,
        onBlur: handleBlur,
        "aria-haspopup": "dialog",
    })

    return (
        <>
            {trigger}
            <Popover.Content
                data-testid="user-hovercard"
                className={cn(
                    "popover w-80 max-w-[calc(100vw-2rem)] border border-default p-0",
                    classNames?.content,
                )}
                placement={placement}
                triggerRef={triggerRef}
                isOpen={isOpen}
                onOpenChange={setIsOpen}
                isNonModal
                onPointerEnter={handleContentEnter}
                onPointerLeave={handleContentLeave}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                aria-modal="false"
            >
                <Popover.Arrow />
                {content}
            </Popover.Content>
        </>
    )
}
