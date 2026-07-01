import React from "react"
import { Skeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Avatar size matching HeroUI <Avatar/> (sm=size-8/md=size-10/lg=size-12). */
export type SkeletonAvatarSize = "sm" | "md" | "lg"

/** Props for {@link SkeletonAvatar}. */
export interface SkeletonAvatarProps extends WithClassNames<undefined> {
    /** Avatar size; mirrors HeroUI Avatar sizes. Defaults to "md". */
    size?: SkeletonAvatarSize
}

const SIZE_CLASS: Record<SkeletonAvatarSize, string> = {
    sm: "size-8",
    md: "size-10",
    lg: "size-12",
}

/** Skeleton matching a HeroUI <Avatar/> box (square, circular shape). */
export const SkeletonAvatar = ({ size = "md", className }: SkeletonAvatarProps) => {
    return <Skeleton className={cn("rounded-full", SIZE_CLASS[size], className)} />
}
