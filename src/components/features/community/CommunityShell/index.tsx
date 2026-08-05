"use client"

import React from "react"
import { Button, Dropdown, Label, Tabs } from "@heroui/react"
import { DotsThreeIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { useHasPermission } from "@/hooks/useHasPermission"
import { ExtendedTabs } from "@/components/blocks/navigation/ExtendedTabs"
import {
    CommunityLiveChatFab,
    CommunityLiveChatSse,
} from "@/components/features/community/CommunityLiveChat"
import { NavRail } from "./NavRail"
import { DiscoveryRail } from "./DiscoveryRail"
import { PromoBanner } from "./PromoBanner"

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

/** ⋯ menu entries: i18n key under `communityHub.menu.*` + absolute href. */
const MENU_ITEMS: Array<{ key: string; href: string }> = [
    { key: "groups", href: "/groups" },
    { key: "saved", href: "/community/saved" },
    { key: "reputation", href: "/community/reputation" },
    { key: "poll", href: "/community/poll" },
    { key: "moderation", href: "/community/moderation" },
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
 * tín · quick poll) right — both absent below `xl`. ponytail: pure layout
 * chrome; each rail + the routed children own their own live data.
 */
export const CommunityShell = ({ children }: CommunityShellProps) => {
    const t = useTranslations("communityHub")
    const router = useRouter()
    const pathname = usePathname()
    // Same gate as the NavRail moderation shortcut: hide the moderation entry from the
    // ⋯ menu (mobile/tablet) for viewers without `community.moderate`, so the nav link
    // never appears on any breakpoint for someone who can only see a "restricted" page.
    const canModerate = useHasPermission("community.moderate")
    const menuItems = canModerate
        ? MENU_ITEMS
        : MENU_ITEMS.filter((item) => item.key !== "moderation")

    const base = "/community"
    const hrefFor = (segment: string) => (segment ? `${base}/${segment}` : base)
    const selectedTab =
        TABS.find((tab) => tab.segment && pathname.startsWith(`${base}/${tab.segment}`))?.key ??
        "forYou"

    // Cột feed thôi chốt cứng 620px (góp ý website 2026-07-26: "kích thước đang fix cứng").
    //
    // Phần NỞ gắn vào 2xl — nơi container cũng nở — chứ KHÔNG cho nở theo `vw` ngay từ xl. Đo
    // thật: cho feed ăn `48vw` từ xl thì ở màn 1440 (cỡ laptop phổ biến) feed lên 691 nhưng hai
    // rail tụt 275→246, tức nở feed bằng cách bóp rail trong cái container vẫn 1280. Đó là đổi
    // chỗ chật chứ không phải thêm chỗ.
    //
    // Từ 2xl: container 1280→1520 nên feed nở 620→clamp(…) mà rail vẫn RỘNG HƠN mức 1280 hiện
    // nay (đo: 326px ở màn 1920). Trần 820 giữ độ dài dòng còn đọc được — thả tự do thì bài
    // trên màn siêu rộng thành một hàng lê thê. Container 1280 ở xl là bề ngang chung của site
    // (xem CookieConsentBanner), không tự ý đổi.
    return (
        <div className="mx-auto w-full xl:grid xl:max-w-[1280px] xl:grid-cols-[minmax(0,1fr)_minmax(0,620px)_minmax(0,1fr)] xl:items-start xl:gap-6 xl:px-6 2xl:max-w-[1520px] 2xl:grid-cols-[minmax(0,1fr)_minmax(0,clamp(620px,44vw,820px))_minmax(0,1fr)]">
            {/* left nav rail — xl+ only; the ⋯ menu stays the entry point below xl */}
            <aside className="hidden pt-3 xl:sticky xl:top-20 xl:block xl:self-start">
                <div className="flex flex-col gap-3">
                    <NavRail />
                    <PromoBanner />
                </div>
            </aside>
            {/* Dưới xl: 1 cột, vẫn chặn 620 cho dễ đọc trên tablet. Từ xl: bỏ trần ở đây, để
                track của grid quyết định — không bỏ thì cái trần 620 này vô hiệu hoá clamp ở
                trên và cột feed vẫn đứng yên đúng như cũ. */}
            <div className="mx-auto flex w-full max-w-[620px] flex-col xl:max-w-none">
                {/* opaque sticky tab strip — pinned below the h-16 site header; background
                    matches the site header (`bg-background`) so scrolled posts are hidden
                    behind it instead of showing through; backdrop-blur is kept but is now
                    decorative because the solid background provides the actual cover */}
                <div className="sticky top-16 z-10 flex items-center justify-center bg-background backdrop-blur px-4 pt-3">
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
                    {/* actions live in the nav rail on xl+, so the ⋯ menu is mobile/tablet only;
                        absolute so it never offsets the centered tabs */}
                    <div className="absolute inset-y-0 right-4 flex items-center xl:hidden">
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
                                        {menuItems.map((item) => (
                                            <Dropdown.Item
                                                key={item.key}
                                                id={item.key}
                                                textValue={t(`menu.${item.key}`)}
                                                onPress={() => router.push(item.href)}
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
            {/* right discovery rail — live chat · trending · reputation · quick poll (xl+).
                Sticky below the h-16 header; capped to the viewport height with its OWN
                scrollbar so a tall rail (quick poll + chat) never runs off the bottom of
                the screen unreachable — it scrolls internally instead. */}
            <aside className="hidden pt-3 xl:sticky xl:top-20 xl:block xl:max-h-[calc(100vh-6rem)] xl:self-start xl:overflow-y-auto xl:pb-3">
                <DiscoveryRail />
            </aside>
            {/* live-chat realtime: ONE SSE connection for the community surface (rail xl+ /
                floating fab < xl) + the < xl floating entry point */}
            <CommunityLiveChatSse />
            <CommunityLiveChatFab />
        </div>
    )
}
