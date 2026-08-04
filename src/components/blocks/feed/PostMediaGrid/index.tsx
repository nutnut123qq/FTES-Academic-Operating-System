import React from "react"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useCommunityPhotoOverlayState } from "@/hooks/zustand/overlay/hooks"

/** One rendered attachment (BE `PostMedia`, already ordered by the server). */
export interface PostMediaItem {
    id: string
    /** Ready-to-render delivery URL issued by the platform image provider. */
    storageKey: string
    mediaType: string
}

/** Props for {@link PostMediaGrid}. */
export interface PostMediaGridProps extends WithClassNames<undefined> {
    /** Id of the post these attachments belong to — threaded into the lightbox so its
     * right pane can fetch the post's content + comments. */
    postId: string
    /** Attachments in server order; an empty array renders nothing. */
    media: Array<PostMediaItem>
    /** Localized alt text for an attachment (attachments carry no per-image description). */
    imageAlt: string
}

/**
 * Image attachments of a post: one image fills the width, two-to-four sit in a
 * two-column grid. Clicking an image opens the Facebook-style photo lightbox
 * (image + prev/next on the left, the post + its comments on the right) instead
 * of the raw image in a new tab. A post with no attachments renders nothing at
 * all (no empty box, no spacing).
 *
 * Only IMAGE attachments are rendered; the data model also allows VIDEO/FILE,
 * which the composer cannot produce yet.
 *
 * @param props - {@link PostMediaGridProps}
 */
export const PostMediaGrid = ({ postId, media, imageAlt, className }: PostMediaGridProps) => {
    const { open } = useCommunityPhotoOverlayState()
    const images = media.filter((item) => item.mediaType === "IMAGE")
    if (images.length === 0) {
        return null
    }

    return (
        <div
            className={cn(
                "grid gap-2",
                images.length === 1 ? "grid-cols-1" : "grid-cols-2",
                className,
            )}
        >
            {images.map((item, i) => (
                <button
                    key={item.id}
                    type="button"
                    aria-label={imageAlt}
                    onClick={() => open({ postId, media, startIndex: i })}
                    className="block overflow-hidden rounded-large border border-separator"
                >
                    {/* Remote provider URLs (Cloudinary) — plain <img> keeps this block free of
                        next/image remote-host config, and posts render at thumbnail sizes. */}
                    <img
                        src={item.storageKey}
                        alt={imageAlt}
                        loading="lazy"
                        className={cn(
                            "w-full object-cover",
                            images.length === 1 ? "max-h-96" : "h-40",
                        )}
                    />
                </button>
            ))}
        </div>
    )
}
