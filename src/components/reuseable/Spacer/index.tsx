"use client"

import React from "react"
import type { WithClassNames } from "@/modules/types/base/class-name"

const spacingScale: Record<number, string> = {
    0.5: "0.125rem",
    1: "0.25rem",
    1.5: "0.375rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    8: "2rem",
    10: "2.5rem",
    12: "3rem",
    14: "3.5rem",
    16: "4rem",
    20: "5rem",
    24: "6rem",
    28: "7rem",
    32: "8rem",
    36: "9rem",
    40: "10rem",
    44: "11rem",
    48: "12rem",
}

interface SpacerProps extends WithClassNames<undefined> {
    x?: number
    y?: number
}

export const Spacer: React.FC<SpacerProps> = ({ x, y, className }) => {
    const width = x ? spacingScale[x] ?? `${x * 0.25}rem` : undefined
    const height = y ? spacingScale[y] ?? `${y * 0.25}rem` : undefined

    return (
        <div
            aria-hidden="true"
            className={className}
            style={{
                width: width ?? (x !== undefined ? "auto" : undefined),
                height: height ?? (y !== undefined ? "auto" : undefined),
                flexShrink: 0,
            }}
        />
    )
}
