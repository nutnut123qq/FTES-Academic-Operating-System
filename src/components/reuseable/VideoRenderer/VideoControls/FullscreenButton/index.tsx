"use client"

import { SquareDashedText as ArrowsOutIcon } from "@gravity-ui/icons"
import React from "react"
import { Button, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link FullscreenButton}. */
export interface FullscreenButtonProps extends WithClassNames<undefined> {
    /** Fired when the user requests fullscreen toggle. */
    onFullscreen: () => void
}

/**
 * Icon button that requests entering/exiting fullscreen.
 *
 * Presentational: forwards the press to {@link FullscreenButtonProps.onFullscreen}.
 * @param props - The fullscreen toggle callback.
 */
export const FullscreenButton = ({
    onFullscreen,
    className,
}: FullscreenButtonProps) => {
    return (
        <Button
            isIconOnly
            variant="ghost"
            aria-label="Fullscreen"
            onPress={onFullscreen}
            className={cn("text-white hover:bg-white/20 border-none min-w-8 h-8", className)}
        >
            <ArrowsOutIcon className="h-5 w-5" />
        </Button>
    )
}
