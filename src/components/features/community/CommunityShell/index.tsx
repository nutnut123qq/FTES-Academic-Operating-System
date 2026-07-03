"use client"

import React from "react"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
    Button,
    Dropdown,
    Label,
    Tabs,
    Typography,
} from "@heroui/react"
import { DotsThreeIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { ExtendedTabs } from "@/components/blocks/navigation/ExtendedTabs"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryCommunityIdentitySwr } from "../hooks/useQueryCommunityIdentitySwr"

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
 * Community shell (§6), Threads-style. ONE slim sticky header (translucent
 * `bg-background/85` + backdrop blur under the app navbar) holding the compact
 * identity row (small avatar + name + member count, mocked via
 * `useQueryCommunityIdentitySwr`) with a ⋯ menu (Đăng bài / Bảng uy tín /
 * Bình chọn / Kiểm duyệt), and the scope tab strip (`ExtendedTabs` underline —
 * For You / Following / Campus / Trending). No cover banner — `coverUrl` stays
 * in the identity model for future surfaces. Content is a single centered
 * reading column capped at 620px (Threads' column width). ponytail: mock data.
 */
export const CommunityShell = ({ children }: CommunityShellProps) => {
    const t = useTranslations("communityHub")
    const router = useRouter()
    const pathname = usePathname()
    const { identity, isLoading } = useQueryCommunityIdentitySwr()

    const base = "/community"
    const hrefFor = (segment: string) => (segment ? `${base}/${segment}` : base)
    const selectedTab =
        TABS.find((tab) => tab.segment && pathname.startsWith(`${base}/${tab.segment}`))?.key ??
        "forYou"

    return (
        <div className="mx-auto flex w-full max-w-[620px] flex-col">
            {/* sticky translucent header — identity row + scope tabs, under the h-16 navbar */}
            <div className="sticky top-16 z-10 flex flex-col gap-2 border-b border-separator bg-background/85 px-4 pt-3 backdrop-blur">
                <div className="flex items-center gap-2">
                    {isLoading || !identity ? (
                        <>
                            <Skeleton.Avatar size="sm" className="shrink-0" />
                            <Skeleton.Typography type="body-sm" width="1/3" />
                        </>
                    ) : (
                        <>
                            <Avatar size="sm" className="shrink-0">
                                {identity.avatarUrl ? (
                                    <AvatarImage
                                        src={identity.avatarUrl}
                                        alt={t("identity.avatarAlt", { name: identity.name })}
                                    />
                                ) : null}
                                <AvatarFallback className="bg-accent/10 font-bold text-accent">
                                    {identity.name.slice(0, 1).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <Typography type="body" weight="semibold" truncate>
                                {identity.name}
                            </Typography>
                            <Typography
                                type="body-xs"
                                color="muted"
                                className="hidden shrink-0 sm:inline"
                            >
                                {t("members", { count: identity.members })}
                            </Typography>
                        </>
                    )}
                    <div className="ml-auto shrink-0">
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
            </div>
            <div className="px-4 py-3">{children}</div>
        </div>
    )
}
