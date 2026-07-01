import type {
    SkeletonTextSize,
} from "./index"

/**
 * Maps every {@link SkeletonTextSize} token to the Tailwind height, vertical
 * margin, and corner-radius classes that make the skeleton bar occupy the exact
 * line-box of the real text it replaces.
 *
 * Metric rule (Tailwind v4.2.1 default type scale, 1rem = 16px):
 * `height = font-size`, `my = (line-height − font-size) / 2`.
 *
 * Rounding rule: xs/sm bars use `rounded-sm` (tight corners match small text);
 * base and larger use `rounded` (slightly more open, matches prose rhythm).
 * `rounded-full` is intentionally avoided — pills and chips are non-text
 * elements and should be styled individually in the component that uses them.
 */
export const skeletonTextSizeMap: Record<SkeletonTextSize, string> = {
    /** 12px font / 16px line-height — tight corners for small text. */
    xs: "h-[12px] my-[2px] rounded-sm",
    /** 14px font / 20px line-height — tight corners for small text. */
    sm: "h-[14px] my-[3px] rounded-sm",
    /** 16px font / 24px line-height — open corners for body text. */
    base: "h-[16px] my-[4px] rounded",
    /** 18px font / 28px line-height. */
    lg: "h-[18px] my-[5px] rounded",
    /** 20px font / 28px line-height. */
    xl: "h-[20px] my-[4px] rounded",
    /** 24px font / 32px line-height. */
    "2xl": "h-[24px] my-[4px] rounded",
    /** 30px font / 36px line-height. */
    "3xl": "h-[30px] my-[3px] rounded",
    /** 36px font / 40px line-height. */
    "4xl": "h-[36px] my-[2px] rounded",
    /** 48px font / 48px line-height (no extra margin). */
    "5xl": "h-[48px] rounded",
    /** 60px font / 60px line-height (no extra margin). */
    "6xl": "h-[60px] rounded",
}
