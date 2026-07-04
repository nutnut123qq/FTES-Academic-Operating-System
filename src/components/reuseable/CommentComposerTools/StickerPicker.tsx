"use client"

import React, { useState } from "react"
import { Button, Popover } from "@heroui/react"
import { StickerIcon } from "@phosphor-icons/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import type { Sticker } from "./types"
import { stickerImagePath } from "./stickers"

export interface StickerPickerProps extends WithClassNames<undefined> {
    /** Accessible label for the sticker toolbar button. */
    stickerLabel: string
    /** Localized sticker catalog. */
    stickers: Array<Sticker>
    /** Called when the user selects a sticker. */
    onStickerSelect: (sticker: Sticker) => void
}

/** Popover grid of pixel-art sticker thumbnails. */
export const StickerPicker = ({ stickerLabel, stickers, onStickerSelect }: StickerPickerProps) => {
    const [isOpen, setIsOpen] = useState(false)

    const handleSelect = (sticker: Sticker) => {
        onStickerSelect(sticker)
        setIsOpen(false)
    }

    return (
        <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
            <Popover.Trigger>
                <Button isIconOnly size="sm" variant="ghost" aria-label={stickerLabel} onPress={() => setIsOpen(true)}>
                    <StickerIcon aria-hidden focusable="false" className="size-4" />
                </Button>
            </Popover.Trigger>
            <Popover.Content className="w-auto p-2" placement="top">
                <div className="grid max-h-60 grid-cols-4 gap-3 overflow-y-auto p-2">
                    {stickers.map((sticker) => (
                        <Button
                            key={sticker.id}
                            isIconOnly
                            size="md"
                            variant="ghost"
                            aria-label={sticker.label}
                            onPress={() => handleSelect(sticker)}
                        >
                            <img
                                src={stickerImagePath(sticker.file)}
                                alt={sticker.label}
                                className="size-6 object-contain"
                            />
                        </Button>
                    ))}
                </div>
            </Popover.Content>
        </Popover>
    )
}
