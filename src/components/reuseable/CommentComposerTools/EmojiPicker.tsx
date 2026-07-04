"use client"

import React, { useState } from "react"
import { Button, Popover } from "@heroui/react"
import { SmileyIcon } from "@phosphor-icons/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { EMOJIS } from "./emojis"

export interface EmojiPickerProps extends WithClassNames<undefined> {
    /** Accessible label for the emoji toolbar button. */
    emojiLabel: string
    /** Called when the user selects an emoji to insert. */
    onEmojiSelect: (emoji: string) => void
}

/** Popover grid of static Unicode emojis. */
export const EmojiPicker = ({ emojiLabel, onEmojiSelect }: EmojiPickerProps) => {
    const [isOpen, setIsOpen] = useState(false)

    const handleSelect = (emoji: string) => {
        onEmojiSelect(emoji)
        setIsOpen(false)
    }

    return (
        <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
            <Popover.Trigger>
                <Button isIconOnly size="sm" variant="ghost" aria-label={emojiLabel} onPress={() => setIsOpen(true)}>
                    <SmileyIcon aria-hidden focusable="false" className="size-4" />
                </Button>
            </Popover.Trigger>
            <Popover.Content placement="top" className="w-auto p-2">
                <div className="grid max-h-60 grid-cols-8 gap-2 overflow-y-auto p-2">
                    {EMOJIS.map((emoji) => (
                        <Button
                            key={emoji}
                            isIconOnly
                            size="sm"
                            variant="ghost"
                            aria-label={emoji}
                            className="text-lg leading-none"
                            onPress={() => handleSelect(emoji)}
                        >
                            {emoji}
                        </Button>
                    ))}
                </div>
            </Popover.Content>
        </Popover>
    )
}
