"use client"

import React, { useCallback, useState } from "react"
import { createPortal } from "react-dom"
import {
    Button,
    CloseButton,
    Drawer,
    Popover,
    PopoverContent,
    Typography,
    cn,
} from "@heroui/react"
import { ArrowsInIcon, ArrowsOutIcon, SparkleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useSmViewpoint } from "@/hooks/reuseables/useSmViewpoint"
import { useContentAiChatOverlayState, useContentAiLessonReset } from "@/hooks/zustand/overlay/hooks"
import { ContentAiChat } from "@/components/features/learn/ContentAiChat"
import { useFullscreenElement } from "@/components/features/learn/LessonReader/hooks/useFullscreen"

/**
 * Where the invisible popover anchor sits, in px from the viewport bottom — high
 * enough that the panel opens ABOVE the floating mascot instead of over it.
 *
 * The anchor used to be a real, DRAGGABLE circular button whose position persisted in
 * localStorage. Both the button and the dragging are gone: the mascot is the only AI
 * entry point now, and there is no longer a button in the reading column's way to
 * drag out of it.
 */
const ANCHOR_BOTTOM = 160

/**
 * HOST for the lesson-scoped, grounded AI chat (StarCI port). Rendered only while a
 * lesson is open (a `contentId` route param). Desktop: a Popover; mobile: a
 * bottom-sheet Drawer (a popover is too cramped on a phone).
 *
 * It has NO BUTTON OF ITS OWN any more. The circular "Ask FTES AI" FAB that used to
 * live here — draggable, position persisted in localStorage — was retired: the
 * app-wide mascot assistant is the single AI entry point on every page including this
 * one, and it opens this chat by flipping the shared overlay store (`contentAiChat`).
 * What is left here is purely the panel + its invisible anchor, so this file owns HOW
 * the chat is presented and the mascot owns WHEN it opens.
 *
 * Mounted once by the learn layout alongside
 * {@link import("../LessonReader/ContentAiSelectionAsk").ContentAiSelectionAsk}, which
 * opens the same chat from a text selection.
 */
export const ContentAiFab = () => {
    const t = useTranslations("learn")
    const { contentId } = useParams<{ contentId?: string }>()
    const { isOpen, setOpen } = useContentAiChatOverlayState()
    const { isMobile } = useSmViewpoint()
    // "Mở rộng": grow the chat to a full-screen popup (desktop) / full-height sheet (mobile).
    // Kept as local host state so ContentAiChat stays ONE mounted instance whose container
    // merely resizes — toggling this never remounts the thread (the conversation is in-memory).
    const [isExpanded, setIsExpanded] = useState(false)
    // Collapsing back to docked whenever the panel closes, so re-opening starts compact.
    const closeChat = useCallback(() => {
        setIsExpanded(false)
        setOpen(false)
    }, [setOpen])
    // When a video wrapper is fullscreen, the browser paints it in a top layer above
    // everything, so a fixed FAB in <body> is hidden. Portal the whole FAB (and route
    // its popover/drawer overlay) INTO the fullscreen element so it stays usable.
    const fullscreenEl = useFullscreenElement()
    // ★ THE one place the AI conversation is cleared. This host is mounted by the learn
    // layout for the whole lesson (it outlives every open/close of the panel and every
    // lesson navigation), so hanging the reset here clears the thread on a lesson change
    // EVEN IF the chat was never opened on the new lesson — which is what stops an old
    // thread being resurrected by navigating lesson A → B → back to A.
    //
    // It cannot fire on mount: the guard compares the lesson the stored conversation
    // already carries with the live one (state kept in the STORE, not a component ref), so
    // remounting with the same lesson is a no-op. Putting a plain reset in the PANEL's
    // mount effect is precisely the bug being fixed here — the panel remounts on every open.
    useContentAiLessonReset(contentId ?? null)

    // Closing always collapses back to docked, so re-opening starts compact.
    const onOpenChange = useCallback(
        (next: boolean) => {
            if (!next) {
                setIsExpanded(false)
            }
            setOpen(next)
        },
        [setOpen],
    )

    // the FAB is only meaningful while a lesson is open
    if (!contentId) {
        return null
    }

    // A fullscreen video wrapper is painted in the browser top layer; portal the FAB
    // into it (and target its overlay there) so it renders ABOVE the video.
    const intoFullscreen = (tree: React.ReactNode): React.ReactNode =>
        fullscreenEl ? createPortal(tree, fullscreenEl) : tree

    // MOBILE — bottom-sheet drawer, opened from the mascot assistant (no button of its own)
    if (isMobile) {
        return intoFullscreen(
            <>
                <Drawer.Backdrop
                    isOpen={isOpen}
                    onOpenChange={(next) => {
                        if (!next) {
                            setIsExpanded(false)
                        }
                        setOpen(next)
                    }}
                    UNSTABLE_portalContainer={fullscreenEl ?? undefined}
                >
                    <Drawer.Content placement="bottom">
                        {/* Docked keeps HeroUI's baked bottom-sheet radius; expanded is a real
                            full-screen surface, so it goes edge-to-edge square (a rounded
                            full-viewport panel reads as a mistake). */}
                        <Drawer.Dialog
                            className={cn("flex flex-col", isExpanded ? "h-[100dvh] rounded-none" : "h-[80vh]")}
                        >
                            <Drawer.CloseTrigger />
                            <Drawer.Header>
                                <div className="flex items-center gap-2">
                                    <Drawer.Heading>{t("reader.ai.title")}</Drawer.Heading>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="tertiary"
                                        aria-label={t(isExpanded ? "reader.ai.collapse" : "reader.ai.expand")}
                                        onPress={() => setIsExpanded((prev) => !prev)}
                                    >
                                        {isExpanded ? (
                                            <ArrowsInIcon aria-hidden focusable="false" className="size-5" />
                                        ) : (
                                            <ArrowsOutIcon aria-hidden focusable="false" className="size-5" />
                                        )}
                                    </Button>
                                </div>
                            </Drawer.Header>
                            <Drawer.Body className="min-h-0 flex-1 pb-6">
                                <ContentAiChat expanded={isExpanded} />
                            </Drawer.Body>
                        </Drawer.Dialog>
                    </Drawer.Content>
                </Drawer.Backdrop>
            </>,
        )
    }

    // DESKTOP — the chat popover, anchored to an INVISIBLE, INERT trigger.
    //
    // The visible circular button is gone: the floating mascot assistant is now the one
    // AI entry point on this page too, and it opens this chat through the shared overlay
    // store. But react-aria positions a Popover against its trigger element, so the
    // trigger still has to EXIST and have a rect — deleting it would leave the panel with
    // nothing to anchor to. Keeping it as a zero-opacity, `pointer-events-none`,
    // `tabIndex={-1}`, `aria-hidden` box preserves the popover's placement, dismissal,
    // fullscreen portalling and expand behaviour EXACTLY as they were, while being
    // unreachable by mouse, keyboard and screen reader.
    //
    // It is parked where the old button sat (right edge, above the mascot) so the panel
    // opens beside the character rather than in the middle of the reading column.
    return intoFullscreen(
        <Popover isOpen={isOpen} onOpenChange={onOpenChange}>
            <Button
                isIconOnly
                variant="primary"
                aria-hidden
                excludeFromTabOrder
                style={{ bottom: ANCHOR_BOTTOM }}
                className="pointer-events-none fixed right-10 z-40 !size-1 rounded-full !p-0 opacity-0"
            />

            <PopoverContent
                placement="left bottom"
                // Expanded: strip the popover card chrome — the inner panel below goes
                // `fixed inset-0` (react-aria positions the popover with top/left, NOT a
                // transform, so a fixed descendant escapes to the real viewport) and covers
                // the whole card, so no 380px box peeks behind the full-screen surface.
                // Docked: `overflow-hidden` is what actually ROUNDS the chat box. HeroUI's
                // `.popover` already bakes the house popover radius
                // (`border-radius: min(32px, var(--radius-3xl))`) but no clipping, so the
                // full-bleed `bg-surface` wrapper below painted its own square corners
                // straight over it and the panel read as a square box. Clipping to the
                // popover's OWN token beats re-declaring a radius on the child: an invented
                // `rounded-2xl`/`rounded-3xl` (24/36px) would not match the 32px the popover
                // draws and would leave a hairline. Deliberately NOT applied while expanded:
                // that panel is `fixed inset-0`, and clipping a full-viewport child is both
                // pointless and risky during the popover's transform-based enter animation.
                className={cn(
                    "p-0",
                    isExpanded ? "!w-auto !border-0 !bg-transparent !shadow-none" : "w-[380px] overflow-hidden",
                )}
                UNSTABLE_portalContainer={fullscreenEl ?? undefined}
            >
                {/* ONE wrapper that merely RESIZES between docked (in-popover, 380px) and
                    expanded (full-screen). ContentAiChat stays the same mounted instance either
                    way, so "mở rộng" never resets the in-memory conversation. */}
                <div
                    className={cn(
                        "flex flex-col bg-surface",
                        isExpanded ? "fixed inset-0 z-[60] h-[100dvh] w-screen" : "w-[380px]",
                    )}
                >
                    <div className="flex items-center gap-2 p-3">
                        <SparkleIcon aria-hidden focusable="false" weight="fill" className="size-5 shrink-0 text-accent" />
                        <Typography type="body" weight="semibold" className="min-w-0 flex-1 truncate">
                            {t("reader.ai.title")}
                        </Typography>
                        <Button
                            isIconOnly
                            size="sm"
                            variant="tertiary"
                            aria-label={t(isExpanded ? "reader.ai.collapse" : "reader.ai.expand")}
                            onPress={() => setIsExpanded((prev) => !prev)}
                        >
                            {isExpanded ? (
                                <ArrowsInIcon aria-hidden focusable="false" className="size-5" />
                            ) : (
                                <ArrowsOutIcon aria-hidden focusable="false" className="size-5" />
                            )}
                        </Button>
                        {/* A full-screen surface has no "outside" to dismiss on, so give it an
                            explicit close; the docked popover keeps click-outside dismissal. */}
                        {isExpanded ? (
                            <CloseButton aria-label={t("reader.ai.close")} onPress={closeChat} />
                        ) : null}
                    </div>
                    {/* ONE body div at a STABLE tree position — only its classes + the chat's
                        props change between modes, so ContentAiChat is never remounted (its
                        in-memory thread survives expand/collapse). Expanded: fill + centre the
                        column; docked: the original compact padding. */}
                    <div className={isExpanded ? "flex min-h-0 flex-1 flex-col px-4 pb-4" : "p-3 pt-0"}>
                        <ContentAiChat
                            expanded={isExpanded}
                            className={isExpanded ? "mx-auto w-full max-w-3xl" : undefined}
                        />
                    </div>
                </div>
            </PopoverContent>
        </Popover>,
    )
}

export default ContentAiFab
