"use client"

import React from "react"
import { Button, cn } from "@heroui/react"
import { ArrowsInIcon, ArrowsOutIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

/** Props for {@link LessonFullscreenButton}. */
export interface LessonFullscreenButtonProps {
    /** Whether the wrapped container is currently the fullscreen element. */
    isFullscreen: boolean
    /** Enter/exit container fullscreen. */
    onToggle: () => void
    /** Class on the button (position override). */
    className?: string
}

/**
 * Custom fullscreen toggle overlaid on the YOUTUBE lesson player only. The embed's
 * own fullscreen is disabled (`playerVars.fs=0`) so the player can fullscreen a
 * CONTAINER `<div>` instead of the bare iframe — that lets the AI FAB and this
 * control live inside the fullscreen element. The self-hosted HLS `<video>` is NOT
 * a consumer: it keeps its native controls' fullscreen button, so adding this here
 * would duplicate it. Mirrors the `reuseable/VideoRenderer/VideoControls/FullscreenButton`
 * pattern.
 */
export const LessonFullscreenButton = ({
    isFullscreen,
    onToggle,
    className,
}: LessonFullscreenButtonProps) => {
    const t = useTranslations("learn.reader.player")
    return (
        <Button
            isIconOnly
            variant="ghost"
            aria-label={isFullscreen ? t("exitFullscreen") : t("fullscreen")}
            onPress={onToggle}
            className={cn(
                // Bottom-right corner (like native player controls); top-right is taken
                // by the preview-countdown chip. Used by the YouTube player only (the
                // self-hosted <video> uses its native fullscreen control instead).
                "absolute bottom-3 right-3 z-30 size-9 min-w-0 rounded-full border-none bg-black/55 text-white hover:bg-black/75",
                className,
            )}
        >
            {isFullscreen ? (
                <ArrowsInIcon aria-hidden focusable="false" className="size-5" />
            ) : (
                <ArrowsOutIcon aria-hidden focusable="false" className="size-5" />
            )}
        </Button>
    )
}
