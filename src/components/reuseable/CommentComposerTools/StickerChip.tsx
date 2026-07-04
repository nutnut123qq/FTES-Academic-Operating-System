"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import { XIcon } from "@phosphor-icons/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import type { Sticker } from "./types"
import { stickerImagePath } from "./stickers"

export interface StickerChipProps extends WithClassNames<undefined> {
    /** The selected sticker to preview. */
    sticker: Sticker
    /** Accessible label for the remove action. */
    removeLabel: string
    /** Called when the user removes the sticker preview. */
    onRemove: () => void
}

/** Chip preview of a selected sticker inside the composer. */
export const StickerChip = ({ sticker, removeLabel, onRemove }: StickerChipProps) => (
    <div className="inline-flex items-center gap-2 self-start rounded-full border border-separator bg-surface px-2 py-2">
        <img src={stickerImagePath(sticker.file)} alt={sticker.label} className="size-5 object-contain" />
        <Typography type="body-xs">{sticker.label}</Typography>
        <Button isIconOnly size="sm" variant="ghost" aria-label={removeLabel} onPress={onRemove}>
            <XIcon aria-hidden focusable="false" className="size-3" />
        </Button>
    </div>
)
