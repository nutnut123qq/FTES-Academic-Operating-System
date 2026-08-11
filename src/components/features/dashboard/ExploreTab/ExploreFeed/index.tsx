"use client"

import React, { useState } from "react"
import { Tabs, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { ExtendedTabs } from "@/components/blocks/navigation/ExtendedTabs"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { CommunityFeed } from "@/components/features/community/CommunityFeed"
import type { CommunityFeedTab } from "@/components/features/community/hooks/useQueryCommunityFeedSwr"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Feed scopes offered on the dashboard — the two viewer-relative ones of the BE
 * `FeedTab` enum. CAMPUS needs a campus picker and TRENDING already has its own card
 * above, so neither is duplicated here.
 */
type ExploreFeedTab = Extract<CommunityFeedTab, "forYou" | "following">

/** Scopes in display order. */
const EXPLORE_FEED_TABS: ReadonlyArray<ExploreFeedTab> = ["forYou", "following"]

/** Props for {@link ExploreFeed}. */
export type ExploreFeedProps = WithClassNames<undefined>

/**
 * Community activity stream of the dashboard EXPLORE tab: a scope strip
 * (Khám phá / Đang theo dõi) over the SHARED {@link CommunityFeed}, which is the very
 * component `/community` renders. Reusing it verbatim means the dashboard gets the
 * real GraphQL `feed(tab, page, campus)` read, the composer entry, the search popover,
 * cursor pagination and all four async states without a second implementation — the
 * scope simply switches the feed's SWR key, so each scope fetches lazily on first open.
 *
 * The rows are flat (hairline dividers, no card fill), so the section is `frameless`:
 * framing it would nest a card around a list that is already edge-to-edge.
 *
 * @param props - optional root class name (placement only)
 */
export const ExploreFeed = ({ className }: ExploreFeedProps) => {
    const t = useTranslations()
    const router = useRouter()
    const [tab, setTab] = useState<ExploreFeedTab>("forYou")

    return (
        <LabeledCard
            frameless
            className={cn(className)}
            label={t("dashboard.explore.feed.title")}
            onSeeMore={() => router.push("/community")}
            seeMoreLabel={t("dashboard.explore.viewAll")}
            contentClassName="flex flex-col gap-3"
        >
            <ExtendedTabs
                selectedKey={tab}
                onSelectionChange={(key) => setTab(key as ExploreFeedTab)}
            >
                <Tabs.ListContainer>
                    <Tabs.List aria-label={t("dashboard.explore.feed.tabsAria")}>
                        {EXPLORE_FEED_TABS.map((scope) => (
                            <Tabs.Tab key={scope} id={scope}>
                                {t(`dashboard.tabs.${scope}`)}
                            </Tabs.Tab>
                        ))}
                    </Tabs.List>
                </Tabs.ListContainer>
            </ExtendedTabs>
            {/* the shared feed owns its own pagination + skeleton/empty/error states */}
            <CommunityFeed tab={tab} />
        </LabeledCard>
    )
}
