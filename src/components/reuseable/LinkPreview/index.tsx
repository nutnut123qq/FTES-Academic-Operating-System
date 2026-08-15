"use client"

import React from "react"
import useSWR from "swr"
import { Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Share card returned by `GET /api/unfurl` (mirrors `LinkPreviewData` server-side). */
export interface LinkPreviewCard {
    url: string
    title: string
    description?: string
    image?: string
    siteName?: string
    domain: string
}

/** Props for {@link LinkPreview}. */
export interface LinkPreviewProps extends WithClassNames<undefined> {
    /** Absolute http(s) url to unfurl; anything else is rejected by the route. */
    url: string
}

/**
 * Fetches the card through our own route handler — never the target site directly:
 * a browser fetch would be blocked by CORS on most pages, and the SSRF fencing +
 * caching live server-side. A non-200 (blocked/unreachable/no HTML) resolves to
 * `null` so the caller simply renders nothing.
 */
const fetchPreview = async (url: string): Promise<LinkPreviewCard | null> => {
    const response = await fetch(`/api/unfurl?url=${encodeURIComponent(url)}`)
    if (!response.ok) {
        return null
    }
    return (await response.json()) as LinkPreviewCard
}

/**
 * F8/Facebook-style link preview: cover image, title, description and the source
 * domain, wrapped in one card that opens the link in a new tab.
 *
 * Rendered under a community post's body for the FIRST link it contains. The card
 * is decoration, not content: while the unfurl is in flight, or when the page
 * cannot be previewed, this renders NOTHING (the link itself is already in the
 * post body), so a slow/dead third-party site never leaves a broken box behind.
 *
 * @param props - {@link LinkPreviewProps}
 */
export const LinkPreview = ({ url, className }: LinkPreviewProps) => {
    const t = useTranslations("linkPreview")
    const { data } = useSWR(["link-preview", url], () => fetchPreview(url), {
        revalidateOnFocus: false,
        shouldRetryOnError: false,
    })

    if (!data) {
        return null
    }

    return (
        <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            aria-label={t("ariaLabel", { title: data.title })}
            className={cn(
                "block overflow-hidden rounded-large border border-separator transition-colors hover:bg-content2",
                className,
            )}
        >
            {data.image ? (
                // Arbitrary third-party host — plain <img> keeps this out of the
                // next/image remote-host allowlist (which would 400 on unknown hosts).
                <img
                    src={data.image}
                    alt={t("imageAlt")}
                    loading="lazy"
                    className="h-44 w-full bg-content2 object-cover"
                />
            ) : null}
            <div className="flex flex-col gap-0.5 p-3">
                <Typography type="body-sm" color="muted" className="uppercase">
                    {data.siteName || data.domain}
                </Typography>
                <Typography type="body-sm" weight="semibold" className="line-clamp-2">
                    {data.title}
                </Typography>
                {data.description ? (
                    <Typography type="body-sm" color="muted" className="line-clamp-2">
                        {data.description}
                    </Typography>
                ) : null}
            </div>
        </a>
    )
}
