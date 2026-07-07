"use client"

import React from "react"
import { cn } from "@heroui/react"
import { useCallback } from "react"
import type { RendererTypeOption } from "../../types"
import type { VideoRendererType } from "@/modules/types/enums/video-renderer-type"
import type { WithClassNames } from "@/modules/types/base/class-name"

export interface RendererTypeButtonProps extends WithClassNames<undefined> {
    /** Option metadata to render. */
    option: RendererTypeOption
    /** Whether this option is currently selected. */
    isActive: boolean
    /** Selects this option's renderer type. */
    onSelect: (type: VideoRendererType) => void
}

/**
 * Single renderer-type selector button (icon + label + description).
 * @param props.option - Option metadata to render.
 * @param props.isActive - Whether this option is the active renderer type.
 * @param props.onSelect - Called with this option's type when pressed.
 */
export const RendererTypeButton = ({
    option,
    isActive,
    onSelect,
    className,
}: RendererTypeButtonProps) => {
    const onPress = useCallback(
        () => onSelect(option.type),
        [onSelect, option.type],
    )

    return (
        <button
            onClick={onPress}
            className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60",
                className,
                isActive
                    ? `bg-gradient-to-r ${option.color} text-white shadow-lg`
                    : "bg-white/5 text-slate-300 hover:bg-white/10",
            )}
        >
            {option.icon}
            <div className="text-left">
                <div>{option.label}</div>
                <div className="text-xs opacity-70">
                    {option.description}
                </div>
            </div>
        </button>
    )
}
