import React from "react"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/** Props for {@link ProfileHeroSkeleton}. */
export type ProfileHeroSkeletonProps = WithClassNames<undefined>

/**
 * Loading placeholder for {@link import("..").ProfileHero}, mirroring the bare
 * identity column tree (gap-4 stack): rank-framed avatar + rank pill, name +
 * `@handle`, bio, follower line, the overlapping badge medals, the action cluster
 * (two full-width buttons), and the joined line. Pure presenter — fed to the
 * hero's `AsyncContent` so the column never jumps when the profile resolves.
 *
 * @param props - optional className (placement only — the sidebar wrapper).
 */
export const ProfileHeroSkeleton = ({ className }: ProfileHeroSkeletonProps) => {
    return (
        <div className={cn("flex flex-col gap-4", className)}>
            {/* rank-framed avatar + rank pill */}
            <div className="flex flex-col items-start gap-3">
                <Skeleton className="size-32 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            {/* name (h3) + @handle (body-sm) */}
            <div className="flex flex-col gap-0">
                <Skeleton.Typography type="h3" width="3/4" />
                <Skeleton.Typography type="body-sm" width="1/3" />
            </div>

            {/* short bio */}
            <Skeleton.Typography type="body-sm" width="2/3" />

            {/* follower / following line */}
            <div className="flex items-center gap-4">
                <Skeleton.Typography type="body-sm" width="1/3" />
                <Skeleton.Typography type="body-sm" width="1/3" />
            </div>

            {/* earned-badge medal strip (overlapping circles) */}
            <div className="flex -space-x-2">
                {[0, 1, 2, 3, 4].map((medal) => (
                    <Skeleton key={medal} className="size-9 rounded-full ring-2 ring-background" />
                ))}
            </div>

            {/* action cluster — two full-width buttons */}
            <div className="flex flex-col gap-2">
                <Skeleton.Button width="w-full" />
                <Skeleton.Button width="w-full" />
            </div>

            {/* joined line */}
            <Skeleton.Typography type="body-sm" width="1/2" />
        </div>
    )
}
