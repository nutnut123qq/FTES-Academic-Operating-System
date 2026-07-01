"use client"

import React, {
    useState,
} from "react"
import {
    cn,
} from "@heroui/react"
import {
    publicEnv,
} from "@/resources/env/public"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link BadgeImage}. */
export interface BadgeImageProps extends WithClassNames<undefined> {
    /**
     * MinIO object key (no leading slash), e.g. `badges/league/gold.png`. The
     * public URL is built from `publicEnv().minio`. When the object does not exist
     * yet (instructor hasn't uploaded the art), the image 404s and {@link fallback}
     * is shown instead — so the web upgrades automatically as art is uploaded.
     */
    objectKey: string
    /** Square render size in px (default 24). */
    size?: number
    /** Alt text for the badge. */
    alt: string
    /** Rendered while the MinIO image is missing / fails to load. */
    fallback: React.ReactNode
}

/**
 * Renders a badge image straight from MinIO, falling back to {@link fallback}
 * (e.g. a placeholder icon) when the object isn't uploaded yet. Lets the team draw
 * + upload real badge art incrementally without the UI ever showing a broken image.
 * @param props - {@link BadgeImageProps}
 */
export const BadgeImage = ({
    objectKey,
    size = 24,
    alt,
    fallback,
    className,
}: BadgeImageProps) => {
    // flips to true once the MinIO object fails to load (missing / not uploaded)
    const [failed, setFailed] = useState(false)

    // no real art yet → show the placeholder fallback
    if (failed) {
        return <>{fallback}</>
    }

    // public MinIO URL: <url>/<bucket>/<objectKey>
    const { url, bucket } = publicEnv().minio
    const src = `${url}/${bucket}/${objectKey}`
    return (
        <img
            src={src}
            alt={alt}
            width={size}
            height={size}
            loading="lazy"
            className={cn(className)}
            onError={() => setFailed(true)}
        />
    )
}
