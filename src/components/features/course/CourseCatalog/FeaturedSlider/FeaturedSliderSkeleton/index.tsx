import React from "react"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/**
 * Loading placeholder for the featured hero slider — mirrors the real box (same
 * responsive aspect ratio + the dot row underneath) per the house skeleton rule,
 * built on the HeroUI Skeleton primitive.
 */
export const FeaturedSliderSkeleton = () => (
    <div className="flex flex-col gap-3">
        <Skeleton className="aspect-video w-full rounded-large md:aspect-[21/9] md:max-h-96" />
        <div className="flex items-center justify-center gap-2">
            {[0, 1, 2, 3].map((dot) => (
                <Skeleton key={dot} className="size-2.5 rounded-full" />
            ))}
        </div>
    </div>
)
