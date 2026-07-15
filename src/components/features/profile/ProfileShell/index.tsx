"use client"

import React from "react"
import { Avatar, AvatarFallback, AvatarImage, Button, Tabs, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { FireIcon, MapPinIcon, TrophyIcon } from "@phosphor-icons/react"
import { usePathname, useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { GamificationChip } from "@/components/blocks/gamification/GamificationChip"
import { ExtendedTabs } from "@/components/blocks/navigation/ExtendedTabs"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
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
    { key: "certificates", segment: "certificates" },
    { key: "community", segment: "community" },
    { key: "progress", segment: "progress" },
]

/** Skeleton mirroring the identity sidebar with cover + avatar. */
const IdentitySkeleton = () => (
    <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex w-full flex-col gap-0">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <div className="relative -mt-10 flex justify-center">
                <Skeleton.Avatar size="lg" className="size-20 md:size-24" />
            </div>
        </div>
        <div className="flex w-full flex-col gap-0">
            <Skeleton.Typography type="h4" width="2/3" />
        </div>
        <Skeleton.Typography type="body-sm" width="1/2" />
        <div className="flex flex-wrap justify-center gap-2">
            <Skeleton.Chip />
            <Skeleton.Chip />
        </div>
        <Skeleton.Paragraph lines={2} className="w-full" />
        <Skeleton.Button width="w-full" />
    </div>
)

/**
 * Profile shell (§2). Redesigned layout: a bare identity sidebar on the left
 * (avatar with gradient ring, name, headline, campus, streak/rank chips, bio,
 * edit CTA) plus an underline tab bar and the active section on the right.
 */
export const ProfileShell = ({ children }: ProfileShellProps) => {
    const t = useTranslations()
    const router = useRouter()
    const pathname = usePathname()
    const { profile, isLoading, error, mutate } = useQueryProfileSwr()
    const { data: gamification } = useQueryMyGamificationSwr()

    const base = "/profile"
    const hrefFor = (segment: string) => (segment ? `${base}/${segment}` : base)
    const selectedTab =
        SECTIONS.find((section) =>
            section.segment ? pathname.startsWith(`${base}/${section.segment}`) : pathname === base,
        )?.key ?? "personal"

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 md:flex-row md:items-start">
            {/* identity sidebar — bare, no card surface */}
            <aside className="w-full shrink-0 md:w-72 md:sticky md:top-20 md:self-start">
                <AsyncContent
                    isLoading={isLoading && !profile}
                    skeleton={<IdentitySkeleton />}
                    error={!profile ? error : undefined}
                    errorContent={{
                        title: t("profile.loadingError"),
                        onRetry: () => void mutate(),
                        retryLabel: t("profile.retry"),
                    }}
                >
                    {profile ? (
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="flex w-full flex-col gap-0">
                                {profile.coverUrl ? (
                                    <img
                                        src={profile.coverUrl}
                                        alt={t("profile.hero.coverAlt")}
                                        className="h-32 w-full rounded-2xl object-cover"
                                    />
                                ) : (
                                    <div className="h-32 w-full rounded-2xl bg-gradient-to-tr from-accent/20 to-success/20" />
                                )}
                                <div className="relative -mt-10 flex justify-center">
                                    <div className="rounded-full bg-gradient-to-tr from-accent to-success p-0.5">
                                        <Avatar className="size-20 rounded-full border-2 border-background md:size-24">
                                            {profile.avatarUrl ? (
                                                <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                                            ) : null}
                                            <AvatarFallback className="bg-accent/10 text-xl font-bold text-accent md:text-2xl">
                                                {(profile.name ?? "?").slice(0, 1).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-0">
                                <Typography type="h4" weight="bold">
                                    {profile.name}
                                </Typography>
                                {profile.headline ? (
                                    <Typography type="body-sm" color="muted">
                                        {profile.headline}
                                    </Typography>
                                ) : null}
                            </div>
                            {profile.campus ? (
                                <div className="flex items-center gap-2">
                                    <MapPinIcon
                                        className="size-4 text-muted"
                                        aria-hidden
                                        focusable="false"
                                    />
                                    <Typography type="body-xs" color="muted">
                                        {profile.campus}
                                    </Typography>
                                </div>
                            ) : null}
                            {gamification ? (
                                <div className="flex flex-wrap justify-center gap-2">
                                    <GamificationChip
                                        icon={
                                            <FireIcon
                                                weight="fill"
                                                className="size-4"
                                                aria-hidden
                                                focusable="false"
                                            />
                                        }
                                        value={gamification.streak.current}
                                        label={t("accountMenu.gamification.streakLabel", {
                                            count: gamification.streak.current,
                                        })}
                                    />
                                    <GamificationChip
                                        icon={
                                            <TrophyIcon
                                                weight="fill"
                                                className="size-4"
                                                aria-hidden
                                                focusable="false"
                                            />
                                        }
                                        value={`#${gamification.rank.position}`}
                                        label={t("accountMenu.gamification.rankLabel", {
                                            position: gamification.rank.position,
                                        })}
                                    />
                                </div>
                            ) : null}
                            {profile.bio ? (
                                <Typography type="body-sm" color="muted">
                                    {profile.bio}
                                </Typography>
                            ) : null}
                            <Button
                                variant="secondary"
                                fullWidth
                                onPress={() => router.push("/profile/edit")}
                            >
                                {t("profileSettings.items.editProfile")}
                            </Button>
                        </div>
                    ) : null}
                </AsyncContent>
            </aside>

            {/* sections (right) */}
            <div className="flex min-w-0 flex-1 flex-col gap-6">
                <ExtendedTabs
                    selectedKey={selectedTab}
                    onSelectionChange={(key) => {
                        const section = SECTIONS.find((item) => item.key === key)
                        router.push(hrefFor(section?.segment ?? ""))
                    }}
                >
                    <Tabs.ListContainer>
                        <Tabs.List aria-label={t("profile.tabListAria")}>
                            {SECTIONS.map((section) => (
                                <Tabs.Tab key={section.key} id={section.key}>
                                    {t(`profile.sections.${section.key}`)}
                                </Tabs.Tab>
                            ))}
                        </Tabs.List>
                    </Tabs.ListContainer>
                </ExtendedTabs>
                {children}
            </div>
        </div>
    )
}
