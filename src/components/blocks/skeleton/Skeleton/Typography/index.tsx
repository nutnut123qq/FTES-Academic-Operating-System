import React from "react"
import { Skeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Supported HeroUI typography variants whose glyph box we mirror. */
export type SkeletonTypographyType =
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6"
    | "body"
    | "body-sm"
    | "body-xs"

/** Tailwind fractional widths accepted by the skeleton bar. */
export type SkeletonTypographyWidth = "full" | "1/2" | "1/3" | "2/3" | "1/4" | "3/4"

/**
 * Map each typography variant to its glyph-height bar + vertical centering.
 * The bar height equals the font-size (glyph), and the vertical margin
 * `(line-height - font-size) / 2` keeps it centered inside the real box so
 * layout never jumps when content loads.
 */
const TYPE_TO_BAR: Record<SkeletonTypographyType, string> = {
    h1: "h-9 my-[2px]", // 36/40
    h2: "h-[30px] my-[3px]", // 30/36
    h3: "h-6 my-1", // 24/32
    h4: "h-5 my-1", // 20/28
    h5: "h-[18px] my-[5px]", // 18/28
    h6: "h-4 my-1", // 16/24
    body: "h-4 my-1.5", // 16/28
    "body-sm": "h-[14px] my-[5px]", // 14/24
    "body-xs": "h-3 my-1", // 12/20
}

/** Map fractional width tokens to Tailwind width classes. */
const WIDTH_TO_CLASS: Record<SkeletonTypographyWidth, string> = {
    full: "w-full",
    "1/2": "w-1/2",
    "1/3": "w-1/3",
    "2/3": "w-2/3",
    "1/4": "w-1/4",
    "3/4": "w-3/4",
}

/** Props for {@link SkeletonTypography}. */
export interface SkeletonTypographyProps extends WithClassNames<undefined> {
    /** Typography variant whose glyph box the skeleton should match. */
    type?: SkeletonTypographyType
    /** Fractional width of the bar. */
    width?: SkeletonTypographyWidth
}

/** Skeleton matching a HeroUI <Typography/> line, sized to the variant's glyph box. */
export const SkeletonTypography = ({
    type = "body-sm",
    width = "full",
    className,
}: SkeletonTypographyProps) => {
    return (
        <Skeleton
            className={cn(
                "rounded",
                TYPE_TO_BAR[type],
                WIDTH_TO_CLASS[width],
                className,
            )}
        />
    )
}
