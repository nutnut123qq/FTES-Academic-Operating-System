"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { FireIcon, TrophyIcon } from "@phosphor-icons/react"
import { usePathname, useRouter } from "@/i18n/navigation"
import { GamificationChip } from "@/components/blocks/gamification/GamificationChip"
import { useQueryMyGamificationSwr } from "@/components/features/gamification/hooks/useQueryMyGamificationSwr"
import { useQueryProfileSwr } from "../hooks/useQueryProfileSwr"

/** Props for {@link ProfileShell}. */
interface ProfileShellProps {
    /** The active section page. */
    children: React.ReactNode
}

/** Profile sections: i18n key + relative segment ("" = personal root). */
const SECTIONS: Array<{ key: string; segment: string }> = [
    { key: "personal", segment: "" },
    { key: "academic", segment: "academic" },
    { key: "portfolio", segment: "portfolio" },
    { key: "community", segment: "community" },
    { key: "progress", segment: "progress" },
]

/**
 * Profile shell (§2). DEFAULT on-canon layout: a 2-column shell — an identity card
 * on the left (sticky) + a section tab nav and the active section on the right.
 * ponytail: identity card + tab row hand-rolled; mock profile.
 */
export const ProfileShell = ({ children }: ProfileShellProps) => {
    const t = useTranslations("profile")
    const tChips = useTranslations("accountMenu.gamification")
    const router = useRouter()
    const pathname = usePathname()
    const { profile } = useQueryProfileSwr()
    // same shared hook as the account dropdown → identical streak/rank everywhere
    const { data: gamification } = useQueryMyGamificationSwr()

    const base = "/profile"
    const hrefFor = (segment: string) => (segment ? `${base}/${segment}` : base)
    const isActive = (segment: string) =>
        segment ? pathname.startsWith(`${base}/${segment}`) : pathname === base

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 md:flex-row">
            {/* identity card (left) */}
            <aside className="shrink-0 md:w-72 md:sticky md:top-20 md:self-start">
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-separator p-6 text-center">
                    <div className="flex size-20 items-center justify-center rounded-full bg-accent/10 text-xl font-bold text-accent">
                        {(profile?.name ?? "?").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex flex-col gap-0">
                        <Typography type="h5" weight="bold">
                            {profile?.name ?? ""}
                        </Typography>
                        <Typography type="body-sm" color="muted">
                            {profile?.headline ?? ""}
                        </Typography>
                    </div>
                    {gamification ? (
                        <div className="flex flex-wrap justify-center gap-2">
                            <GamificationChip
                                icon={<FireIcon weight="fill" className="size-4" aria-hidden focusable="false" />}
                                value={gamification.streak.current}
                                label={tChips("streakLabel", { count: gamification.streak.current })}
                            />
                            <GamificationChip
                                icon={<TrophyIcon weight="fill" className="size-4" aria-hidden focusable="false" />}
                                value={`#${gamification.rank.position}`}
                                label={tChips("rankLabel", { position: gamification.rank.position })}
                            />
                        </div>
                    ) : null}
                    <Typography type="body-sm" color="muted">
                        {profile?.bio ?? ""}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                        {profile?.campus ?? ""}
                    </Typography>
                </div>
            </aside>

            {/* sections (right) */}
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2 border-b border-separator pb-3">
                    {SECTIONS.map((section) => (
                        <Button
                            key={section.key}
                            size="sm"
                            variant={isActive(section.segment) ? "secondary" : "ghost"}
                            onPress={() => router.push(hrefFor(section.segment))}
                        >
                            {t(`sections.${section.key}`)}
                        </Button>
                    ))}
                </div>
                <div className="pt-6">{children}</div>
            </div>
        </div>
    )
}
