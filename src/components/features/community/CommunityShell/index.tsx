"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"

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

/**
 * Community shell (§6). DEFAULT on-canon layout: a header + a scope tab nav
 * (For You / Following / Campus / Trending) over the active feed. ponytail: tab
 * row hand-rolled (Buttons); scopes are nested routes.
 */
export const CommunityShell = ({ children }: CommunityShellProps) => {
    const t = useTranslations("communityHub")
    const router = useRouter()
    const pathname = usePathname()

    const base = "/community"
    const hrefFor = (segment: string) => (segment ? `${base}/${segment}` : base)
    const isActive = (segment: string) =>
        segment ? pathname.startsWith(`${base}/${segment}`) : pathname === base

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
            <Typography type="h4" weight="bold">
                {t("title")}
            </Typography>
            <div className="flex flex-wrap gap-2 border-b border-separator pb-3">
                {TABS.map((tab) => (
                    <Button
                        key={tab.key}
                        size="sm"
                        variant={isActive(tab.segment) ? "secondary" : "ghost"}
                        onPress={() => router.push(hrefFor(tab.segment))}
                    >
                        {t(`tabs.${tab.key}`)}
                    </Button>
                ))}
            </div>
            <div>{children}</div>
        </div>
    )
}
