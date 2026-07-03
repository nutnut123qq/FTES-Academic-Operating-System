"use client"

import React from "react"
import { Button, Dropdown, Label, Tabs } from "@heroui/react"
import { DotsThreeIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { ExtendedTabs } from "@/components/blocks/navigation/ExtendedTabs"
import { NavRail } from "./NavRail"
import { DiscoveryRail } from "./DiscoveryRail"

/** Props for {@link CommunityShell}. */
interface CommunityShellProps {
    /** The active feed scope page. */
    children: React.ReactNode
}

/** Feed scope tabs: i18n key + relative segment ("" = For You root). */
const TABS: Array<{ key: string; segment: string }> = [
    { key: "forYou", segment: "" },
    { key: "following", segment: "following" },
    { key: "campus", segment: "campus" },
    { key: "trending", segment: "trending" },
]

/** ⋯ menu entries: i18n key under `communityHub.menu.*` + route segment. */
const MENU_ITEMS: Array<{ key: string; segment: string }> = [
    { key: "newPost", segment: "new" },
    { key: "reputation", segment: "reputation" },
    { key: "poll", segment: "poll" },
    { key: "moderation", segment: "moderation" },
]

/**
 * Community shell (§6) — a GENERAL social feed (Threads-style), not a specific
 * community, so there is NO identity header (no avatar/name/members). The header
 * is a minimal sticky strip that BLENDS into the page (no card fill, no bottom
 * border — just a light backdrop blur for scroll legibility): the scope tab
 * strip (`ExtendedTabs` underline — For You / Following / Campus / Trending) with
 * a ⋯ menu (below `xl` only; desktop uses the nav rail) for the buried actions.
 * Content is a single centered reading column capped at 620px; from `xl` two
 * sticky rails flank it — NavRail (shortcuts) left, DiscoveryRail (trending · uy
 * tín · quick poll) right — both absent below `xl`. ponytail: mock data.
 */
export const CommunityShell = ({ children }: CommunityShellProps) => {
    const t = useTranslations("communityHub")
    const router = useRouter()
    const pathname = usePathname()

    const base = "/community"
    const hrefFor = (segment: string) => (segment ? `${base}/${segment}` : base)
    const selectedTab =
        TABS.find((tab) => tab.segment && pathname.startsWith(`${base}/${tab.segment}`))?.key ??
        "forYou"

    return (
        <div className="mx-auto w-full xl:grid xl:max-w-[1220px] xl:grid-cols-[240px_minmax(0,620px)_280px] xl:justify-center xl:gap-6 xl:px-6">
            {/* left nav rail — xl+ only; the ⋯ menu stays the entry point below xl */}
            <aside className="hidden pt-3 xl:sticky xl:top-20 xl:block xl:self-start">
                <NavRail />
            </aside>
            <div className="mx-auto flex w-full max-w-[620px] flex-col">
                {/* flat sticky header — scope tabs blended into the page (no card fill / border) */}
                <div className="sticky top-16 z-10 flex items-center justify-between gap-2 bg-background/70 px-4 pt-3 backdrop-blur">
                    <ExtendedTabs
                        selectedKey={selectedTab}
                        onSelectionChange={(key) => {
                            const tab = TABS.find((item) => item.key === key)
                            router.push(hrefFor(tab?.segment ?? ""))
                        }}
                    >
                        <Tabs.ListContainer>
                            <Tabs.List aria-label={t("title")}>
                                {TABS.map((tab) => (
                                    <Tabs.Tab key={tab.key} id={tab.key}>
                                        {t(`tabs.${tab.key}`)}
                                    </Tabs.Tab>
                                ))}
                            </Tabs.List>
                        </Tabs.ListContainer>
                    </ExtendedTabs>
                    {/* actions live in the nav rail on xl+, so the ⋯ menu is mobile/tablet only */}
                    <div className="shrink-0 xl:hidden">
                        <Dropdown>
                            <Button isIconOnly size="sm" variant="ghost" aria-label={t("more")}>
                                <DotsThreeIcon
                                    aria-hidden
                                    focusable="false"
                                    className="size-5"
                                    weight="bold"
                                />
                            </Button>
                            <Dropdown.Popover>
                                <Dropdown.Menu>
                                    <Dropdown.Section>
                                        {MENU_ITEMS.map((item) => (
                                            <Dropdown.Item
                                                key={item.key}
                                                id={item.key}
                                                textValue={t(`menu.${item.key}`)}
                                                onPress={() => router.push(hrefFor(item.segment))}
                                            >
                                                <Label>{t(`menu.${item.key}`)}</Label>
                                            </Dropdown.Item>
                                        ))}
                                    </Dropdown.Section>
                                </Dropdown.Menu>
                            </Dropdown.Popover>
                        </Dropdown>
                    </div>
                </div>
                <div className="px-4 py-3">{children}</div>
            </div>
            {/* right discovery rail — trending · reputation · quick poll (xl+) */}
            <aside className="hidden pt-3 xl:sticky xl:top-20 xl:block xl:self-start">
                <DiscoveryRail />
            </aside>
        </div>
    )
}
