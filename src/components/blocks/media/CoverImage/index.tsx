import React from "react"
import {
    cn,
} from "@heroui/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"

/** Props for the {@link CoverImage} block. */
export interface CoverImageProps extends WithClassNames<undefined> {
    /** Image source URL (null/undefined → empty framed surface). */
    src?: string | null
    /** Accessible alt text. */
    alt: string
}

/**
 * A framed cover/thumbnail image: fixed 16:9 box, rounded surface, lazy-loaded,
 * `object-cover` so any aspect fills cleanly. Owns the whole look (radius /
 * surface / crop) so features pass only `src` + `alt`. Reusable for course /
 * blog / changelog covers.
 *
 * @param props - {@link CoverImageProps}
 */
export const CoverImage = ({
    src,
    alt,
    className,
}: CoverImageProps) => {
    return (
        <div className={cn("aspect-video w-full overflow-hidden rounded-2xl bg-surface-secondary", className)}>
            {src ? (
                <img
                    src={src}
                    alt={alt}
                    loading="lazy"
                    className="size-full object-cover"
                />
            ) : null}
        </div>
    )
}
