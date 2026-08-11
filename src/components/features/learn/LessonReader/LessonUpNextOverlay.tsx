"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import { CaretRightIcon, XIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { LessonUpNextDestination } from "./hooks/useLessonUpNext"

/** Props for {@link LessonUpNextOverlay}. */
export interface LessonUpNextOverlayProps {
    /** Where the hand-off goes (title + kind drive the copy). */
    destination: LessonUpNextDestination
    /** Seconds left before the auto-advance; null while the video is still playing. */
    countdown: number | null
    /** Go now (primary button). */
    onGo: () => void
    /** Stay on this video — hides the button AND cancels the auto-advance. */
    onDismiss: () => void
}

/**
 * "Up next" hand-off card overlaid on the lesson player, bottom-right.
 *
 * Purely presentational — {@link useLessonUpNext} owns when it appears and when the
 * auto-advance fires. Rendered INSIDE the player container (the same place
 * `LessonFullscreenButton` lives) so it survives the YouTube player's container
 * fullscreen; sits at `bottom-14` to clear both that button and the native control bar.
 *
 * Two real `<button>`s (HeroUI): "go" carries an aria-label naming the destination
 * (its visible label is a short "Continue" / countdown), and "stay" is the icon-only
 * dismiss. Neither traps focus — the card is a sibling of the video, not a dialog.
 */
export const LessonUpNextOverlay = ({
    destination,
    countdown,
    onGo,
    onDismiss,
}: LessonUpNextOverlayProps) => {
    const t = useTranslations("learn")
    // A challenge needs its own eyebrow; the next-lesson case reuses the pager's label
    // (`content.nextLesson`) so the two surfaces can never drift apart.
    const kindLabel =
        destination.kind === "challenge" ? t("reader.upNextChallenge") : t("content.nextLesson")

    return (
        <div className="absolute bottom-14 right-3 z-30 flex max-w-[calc(100%-1.5rem)] items-center gap-3 rounded-2xl bg-black/70 px-3 py-2 backdrop-blur-sm">
            <div className="flex min-w-0 flex-col">
                <Typography type="body-xs" className="text-white/70">
                    {kindLabel}
                </Typography>
                {destination.title ? (
                    <Typography type="body-sm" weight="medium" className="line-clamp-1 text-white">
                        {destination.title}
                    </Typography>
                ) : null}
            </div>
            <Button
                size="sm"
                variant="primary"
                aria-label={t("reader.upNextAria", { title: destination.title || kindLabel })}
                onPress={onGo}
            >
                <span className="flex items-center gap-1">
                    {countdown === null
                        ? t("reader.upNextGo")
                        : t("reader.upNextIn", { seconds: countdown })}
                    <CaretRightIcon aria-hidden focusable="false" className="size-4" />
                </span>
            </Button>
            <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label={t("reader.stay")}
                onPress={onDismiss}
                className="size-8 min-w-0 shrink-0 rounded-full border-none bg-black/40 text-white hover:bg-black/70"
            >
                <XIcon aria-hidden focusable="false" className="size-4" />
            </Button>
        </div>
    )
}
