"use client"

import React from "react"
import { Card, cn } from "@heroui/react"
import { QUICK_TEST_URLS } from "../constants"
import { QuickTestUrlButton } from "./QuickTestUrlButton"
import type { QuickTestUrl } from "../types"
import type { WithClassNames } from "@/modules/types/base/class-name"

export interface QuickTestUrlsProps extends WithClassNames<undefined> {
    /** Loads a preset's URL + renderer type into the tool. */
    onSelect: (item: QuickTestUrl) => void
}

/**
 * Quick test URLs card: preset buttons that load a URL + renderer type.
 * @param props.onSelect - Called with the chosen preset.
 */
export const QuickTestUrls = ({ onSelect, className }: QuickTestUrlsProps) => (
    <Card className={cn("border border-white/10 bg-white/5 backdrop-blur-xl", className)}>
        <Card.Content className="flex flex-col gap-3 p-6">
            <h2 className="text-sm font-medium text-slate-400">
                Quick Test URLs
            </h2>
            <div className="flex flex-col gap-2">
                {QUICK_TEST_URLS.map((item) => (
                    <QuickTestUrlButton
                        key={item.url}
                        item={item}
                        onSelect={onSelect}
                    />
                ))}
            </div>
        </Card.Content>
    </Card>
)
