import React from "react"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/**
 * Loading placeholder for the featured hero slider — mirrors the rebuilt split-card
 * shape per the house skeleton rule: the same full-width, unpadded container (the
 * banner lines up with the catalog content below), a `min-h-[300px] rounded-[20px]`
 * card with a LEFT copy column (title + pitch bars + pill CTA) and a RIGHT image box
 * at `md:`, and a LEFT-aligned dot row. Built on the HeroUI Skeleton primitive.
 */
export const FeaturedSliderSkeleton = () => (
    <div className="flex w-full flex-col gap-3">
        <div className="flex min-h-[300px] flex-col items-center gap-5 overflow-hidden rounded-[20px] bg-default p-[30px_35px] md:flex-row">
            {/* LEFT — merchandising copy */}
            <div className="flex w-full flex-col gap-3 md:max-w-[50%]">
                <Skeleton className="h-7 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-5/6 rounded" />
                <Skeleton className="mt-1 h-7 w-28 rounded-full" />
            </div>
            {/* RIGHT — cover box; hidden on mobile (mirrors FeaturedSlide) */}
            <div className="hidden shrink-0 md:block md:max-w-[45%]">
                <Skeleton className="h-[200px] w-[320px] max-w-full rounded-xl" />
            </div>
        </div>
        <div className="flex items-center justify-start gap-2">
            {[0, 1, 2, 3].map((dot) => (
                <Skeleton key={dot} className="size-2.5 rounded-full" />
            ))}
        </div>
    </div>
)
