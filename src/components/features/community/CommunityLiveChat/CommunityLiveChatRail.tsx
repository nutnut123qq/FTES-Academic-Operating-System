"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useMediaQuery } from "usehooks-ts"
import { useTranslations } from "next-intl"
import { CommunityLiveChatThread } from "./CommunityLiveChatThread"

/** Tailwind `xl` breakpoint (1280px) — the rail only fetches/streams while it is visible. */
const XL_QUERY = "(min-width: 1280px)"

/** Fixed chat height so short messages never make the panel jump (spec §5). */
const CHAT_HEIGHT = "h-[420px]"

/**
 * Community live-chat rail (xl+): ONE panel in the right `DiscoveryRail` — the chat
 * panel (the online indicator is a single text line inside the thread, not a separate
 * card). Rendered inside the `hidden xl:block` aside, so it is in the DOM at every
 * breakpoint; `enabled` is gated on the real `xl` media query so it never fetches or
 * seeds while the aside is hidden (< xl uses the floating fab instead). The chat has a
 * FIXED height and scrolls internally. The SSE stream itself is owned once by
 * {@link import("./CommunityLiveChatSse").CommunityLiveChatSse}.
 */
export const CommunityLiveChatRail = () => {
    const t = useTranslations("communityLiveChat")
    const isDesktop = useMediaQuery(XL_QUERY)

    return (
        <section className="flex flex-col gap-2 rounded-3xl border border-separator bg-surface p-4">
            <Typography type="body-sm" weight="semibold">
                {t("title")}
            </Typography>
            <CommunityLiveChatThread enabled={isDesktop} className={CHAT_HEIGHT} />
        </section>
    )
}
