"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useMediaQuery } from "usehooks-ts"
import { useTranslations } from "next-intl"
import { OnlinePresence } from "./OnlinePresence"
import { CommunityLiveChatThread } from "./CommunityLiveChatThread"

/** Tailwind `xl` breakpoint (1280px) — the rail only fetches/streams while it is visible. */
const XL_QUERY = "(min-width: 1280px)"

/** One rail panel shell — mirrors `DiscoveryRail`'s panel look. */
const RailPanel = ({
    title,
    children,
}: {
    title: string
    children: React.ReactNode
}) => (
    <section className="flex flex-col gap-2 rounded-3xl border border-separator bg-surface p-4">
        <Typography type="body-sm" weight="semibold">
            {title}
        </Typography>
        {children}
    </section>
)

/**
 * Community live-chat rail (xl+): two panels stacked in the right `DiscoveryRail` —
 * an online-presence panel + the live-chat panel. Rendered inside the `hidden xl:block`
 * aside, so it is in the DOM at every breakpoint; `enabled` is gated on the real `xl`
 * media query so it never fetches or seeds while the aside is hidden (< xl uses the
 * floating fab instead). The SSE stream itself is owned once by
 * {@link import("./CommunityLiveChatSse").CommunityLiveChatSse}.
 */
export const CommunityLiveChatRail = () => {
    const t = useTranslations("communityLiveChat")
    const isDesktop = useMediaQuery(XL_QUERY)

    return (
        <div className="flex flex-col gap-3">
            <RailPanel title={t("onlineTitle")}>
                <OnlinePresence enabled={isDesktop} />
            </RailPanel>
            <RailPanel title={t("title")}>
                <CommunityLiveChatThread enabled={isDesktop} />
            </RailPanel>
        </div>
    )
}
