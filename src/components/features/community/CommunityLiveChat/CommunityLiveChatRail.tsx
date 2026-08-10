"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useMediaQuery } from "usehooks-ts"
import { useTranslations } from "next-intl"
import { CommunityLiveChatThread } from "./CommunityLiveChatThread"
import { OnlinePresence } from "./OnlinePresence"

/** Tailwind `xl` breakpoint (1280px) — the rail only fetches/streams while it is visible. */
const XL_QUERY = "(min-width: 1280px)"

/**
 * Chat thread height. Fixed so short messages never make the panel jump (spec §5),
 * but CLAMPED to the viewport so the whole right rail (quick poll + chat) fits on
 * common laptop heights instead of running the chat box off the bottom of the screen:
 * shrinks with the viewport (`38vh`) down to a usable 240px floor, capped at the
 * original 420px on tall screens.
 */
const CHAT_HEIGHT = "h-[clamp(240px,38vh,420px)]"

/**
 * Community live-chat rail (xl+) in the right `DiscoveryRail`: the online indicator
 * ({@link OnlinePresence}) as a plain line ABOVE / OUTSIDE the chat box, then the chat
 * panel (title + thread) in a bordered card below it. Rendered inside the
 * `hidden xl:block` aside, so it is in the DOM at every breakpoint; `enabled` is gated
 * on the real `xl` media query so it never fetches or seeds while the aside is hidden
 * (< xl uses the floating fab instead). The chat has a FIXED height and scrolls
 * internally. The SSE stream itself is owned once by
 * {@link import("./CommunityLiveChatSse").CommunityLiveChatSse}.
 */
export const CommunityLiveChatRail = () => {
    const t = useTranslations("communityLiveChat")
    const isDesktop = useMediaQuery(XL_QUERY)

    return (
        <div className="flex flex-col gap-2">
            {/* online indicator — a plain line ABOVE / OUTSIDE the chat box (no card) */}
            <OnlinePresence enabled={isDesktop} className="px-1" />
            <section className="flex flex-col gap-2 rounded-3xl border border-separator bg-surface p-4">
                <Typography type="body-sm" weight="semibold">
                    {t("title")}
                </Typography>
                <CommunityLiveChatThread enabled={isDesktop} className={CHAT_HEIGHT} />
            </section>
        </div>
    )
}
