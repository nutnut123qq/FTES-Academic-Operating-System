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
 * Custom fullscreen toggle overlaid on a lesson video wrapper. It replaces the
 * browser's native video/iframe fullscreen (suppressed via `controlsList=
 * "nofullscreen"` on the HLS `<video>` and `playerVars.fs=0` on YouTube) so the
 * player fullscreens a CONTAINER `<div>` instead of the bare media — that lets
 * the AI FAB and this control live inside the fullscreen element. Mirrors the
 * `reuseable/VideoRenderer/VideoControls/FullscreenButton` pattern.
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
                "absolute left-3 top-3 z-30 size-9 min-w-0 rounded-full border-none bg-black/55 text-white hover:bg-black/75",
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
