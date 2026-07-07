"use client"

import React, { useCallback } from "react"
import { cn } from "@heroui/react"
import type { QuickTestUrl } from "../../types"
import type { WithClassNames } from "@/modules/types/base/class-name"

export interface QuickTestUrlButtonProps extends WithClassNames<undefined> {
    /** Preset to render. */
    item: QuickTestUrl
    /** Loads the preset's URL + renderer type into the tool. */
    onSelect: (item: QuickTestUrl) => void
}

/**
 * Single quick-test preset row; loads its URL + type when pressed.
 * @param props.item - Preset to render.
 * @param props.onSelect - Called with the preset when pressed.
 */
export const QuickTestUrlButton = ({ item, onSelect, className }: QuickTestUrlButtonProps) => {
    const onPress = useCallback(
        () => onSelect(item),
        [onSelect, item],
    )

    return (
        <button
            onClick={onPress}
            className={cn("w-full rounded-xl bg-white/5 px-3 py-2 text-left text-xs text-slate-300 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60", className)}
        >
            <span className="font-medium text-white">
                {item.label}
            </span>
            <br />
            <span className="text-slate-500 break-all">
                {item.url}
            </span>
        </button>
    )
}
