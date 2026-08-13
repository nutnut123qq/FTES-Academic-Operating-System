import React from "react"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/**
 * Loading state of the sign-in activity list — five rows shaped like the real
 * `ListRow`s (leading icon, timestamp over an IP/method line, a trailing outcome chip),
 * in the same `gap-0` column, so the card holds its height while the page loads.
 */
export const LoginHistorySectionSkeleton = () => {
    return (
        <div className="flex flex-col gap-0">
            {[0, 1, 2, 3, 4].map((row) => (
                <div key={row} className="flex items-center gap-3 py-2">
                    <Skeleton className="size-5 shrink-0 rounded-md" />
                    <div className="flex min-w-0 flex-col gap-0">
                        <Skeleton.Typography type="body-sm" className="w-44" />
                        <Skeleton.Typography type="body-xs" className="w-56" />
                    </div>
                    <div className="ml-auto shrink-0">
                        <Skeleton.Chip />
                    </div>
                </div>
            ))}
        </div>
    )
}
