"use client"

import React from "react"
import {
    Skeleton,
    cn,
} from "@heroui/react"
import {
    skeletonTextSizeMap,
} from "./map"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Typography token of the text the skeleton bar stands in for. Each token maps
 * to a Tailwind `text-*` size and resolves (via {@link skeletonTextSizeMap}) to
 * the height + vertical margin that reproduces the real text's line-box, so the
 * layout does not shift when data arrives.
 */
export type SkeletonTextSize =
    /** Mirrors `text-xs` (12px). */
    | "xs"
    /** Mirrors `text-sm` (14px). */
    | "sm"
    /** Mirrors `text-base` (16px). */
    | "base"
    /** Mirrors `text-lg` (18px). */
    | "lg"
    /** Mirrors `text-xl` (20px). */
    | "xl"
    /** Mirrors `text-2xl` (24px). */
    | "2xl"
    /** Mirrors `text-3xl` (30px). */
    | "3xl"
    /** Mirrors `text-4xl` (36px). */
    | "4xl"
    /** Mirrors `text-5xl` (48px). */
    | "5xl"
    /** Mirrors `text-6xl` (60px). */
    | "6xl"

export interface SkeletonTextProps extends WithClassNames<undefined> {
    /** Typography token of the text being replaced; drives the bar's height. */
    size: SkeletonTextSize
    /** Tailwind width class for the bar (e.g. `"w-5/6"`). Defaults to `"w-full"`. */
    width?: string
}

/**
 * A single-line text skeleton that occupies the exact line-box of the real text
 * it replaces. Corner radius is derived from `size` via {@link skeletonTextSizeMap}
 * (xs/sm → `rounded-sm`; base and above → `rounded`).
 * @param props - {@link SkeletonTextProps}
 */
export const SkeletonText = (props: SkeletonTextProps) => {
    const {
        size,
        width = "w-full",
        className,
    } = props
    return (
        <Skeleton
            className={
                cn(
                    skeletonTextSizeMap[size],
                    width,
                    className,
                )
            }
        />
    )
}
