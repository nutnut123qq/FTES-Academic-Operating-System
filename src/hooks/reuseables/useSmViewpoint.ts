import { useMediaQuery } from "usehooks-ts"

/**
 * Returns responsive breakpoint booleans driven by CSS media queries.
 * @returns `{ isMobile, isTablet, isDesktop }` — each is `true` when the viewport matches the breakpoint.
 */
export const useSmViewpoint = () => {
    /** The is mobile. */
    const isMobile = useMediaQuery("(max-width: 640px)")
    /** The is tablet. */
    const isTablet = useMediaQuery("(max-width: 768px)")
    /** The is desktop. */
    const isDesktop = useMediaQuery("(min-width: 1024px)")
    return {
        isMobile,
        isTablet,
        isDesktop,
    }
}