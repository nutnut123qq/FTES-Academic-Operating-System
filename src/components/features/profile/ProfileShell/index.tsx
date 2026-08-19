"use client"

import React, { useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage, Button, Tabs, Typography, toast } from "@heroui/react"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { useLocale, useTranslations } from "next-intl"
import {
    CalendarBlankIcon,
    FireIcon,
    MapPinIcon,
    MedalIcon,
    ShareNetworkIcon,
    StarIcon,
    TrophyIcon,
} from "@phosphor-icons/react"
import { usePathname, useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { GamificationChip } from "@/components/blocks/gamification/GamificationChip"
import { ExtendedTabs } from "@/components/blocks/navigation/ExtendedTabs"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { StaffBadge } from "@/components/reuseable/StaffBadge"
import { useViewerStaffRole } from "@/hooks/useViewerStaffRole"
import { useQueryMyGamificationSwr } from "@/components/features/gamification/hooks/useQueryMyGamificationSwr"
import { BadgeCatalogModal } from "../ProfileBadges/BadgeCatalogModal"
import { useQueryProfileSwr } from "../hooks/useQueryProfileSwr"
import { useQueryPublicProfileSwr } from "../hooks/useQueryPublicProfileSwr"

/** Props for {@link ProfileShell}. */
interface ProfileShellProps {
    /** The active section page. */
    children: React.ReactNode
}

/** Profile sections: i18n key + relative segment ("" = personal root). */
const SECTIONS: Array<{ key: string; segment: string }> = [
    { key: "personal", segment: "" },
    { key: "academic", segment: "academic" },
    { key: "cv", segment: "cv" },
    { key: "portfolio", segment: "portfolio" },
    { key: "achievements", segment: "achievements" },
    { key: "certificates", segment: "certificates" },
    { key: "community", segment: "community" },
    { key: "progress", segment: "progress" },
]

/** Skeleton mirroring the identity sidebar (avatar-first, no cover). */
const IdentitySkeleton = () => (
    <div className="flex flex-col items-center gap-4 text-center">
        <Skeleton.Avatar size="lg" className="size-20 md:size-24" />
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
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()
    const { profile, isLoading, error, mutate } = useQueryProfileSwr()
    const { data: gamification } = useQueryMyGamificationSwr()
    const [isBadgeCatalogOpen, setIsBadgeCatalogOpen] = React.useState(false)
    /**
     * The viewer's OWN staff role, read from the redux session rather than from the
     * profile payload: `GET /profiles/me` (`ProfileViews.SelfProfile`) carries no role
     * field at all, which is exactly why this page showed no seal for an admin while the
     * account menu and the community feed both did. The grants are already hydrated for
     * every signed-in viewer, so no extra request is involved.
     */
    const staffRole = useViewerStaffRole()
    // real follower/following counters (public-profile view of the signed-in user);
    // keyed on the username so it only fires once the self profile has loaded.
    const { profile: social } = useQueryPublicProfileSwr(profile?.username ?? "")

    /** Joined line — full month + year (per the time-rendering rule), or null when unset. */
    const joinedLabel = profile?.joinedAt
        ? t("profile.joined", {
            date: new Date(profile.joinedAt).toLocaleDateString(locale, {
                month: "long",
                year: "numeric",
            }),
        })
        : null

    /** Share the public profile URL — native sheet when present, clipboard fallback. */
    const onShare = useCallback(async () => {
        if (typeof window === "undefined" || !profile) return
        const url = `${window.location.origin}/${locale}/u/${profile.username}`
        if (navigator.share) {
            try {
                await navigator.share({ title: profile.name, url })
                return
            } catch {
                // sheet dismissed / failed → fall through to clipboard copy
            }
        }
        try {
            await navigator.clipboard.writeText(url)
            toast.success(t("profile.shareCopied"))
        } catch {
            // clipboard blocked → nothing actionable to surface
        }
    }, [profile, locale, t])

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
                            {profile.avatarFrameCode ? (
                                // Có khung viền → vẽ đúng khung (bản thân khung đã là viền, bỏ
                                // vòng gradient mặc định để không lồng 2 viền).
                                <UserAvatar
                                    size="lg"
                                    className="size-20 rounded-full border-2 border-background md:size-24"
                                    username={profile.name}
                                    avatar={profile.avatarUrl}
                                    seed={profile.username}
                                    frameCode={profile.avatarFrameCode}
                                />
                            ) : (
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
                            )}
                            <div className="flex flex-col gap-0">
                                <div className="flex min-w-0 items-center justify-center gap-1">
                                    <Typography type="h4" weight="bold" truncate>
                                        {profile.name}
                                    </Typography>
                                    <StaffBadge role={staffRole} size="md" />
                                </div>
                                {profile.headline ? (
                                    <Typography type="body-sm" color="muted">
                                        {profile.headline}
                                    </Typography>
                                ) : null}
                                {profile.username ? (
                                    <Typography type="body-sm" color="muted">
                                        @{profile.username}
                                    </Typography>
                                ) : null}
                            </div>
                            {social && (social.followers > 0 || social.following > 0) ? (
                                <div className="flex items-center gap-3">
                                    <Typography type="body-sm" color="muted">
                                        {t("profile.followers", { count: social.followers })}
                                    </Typography>
                                    <Typography type="body-sm" color="muted">
                                        {t("profile.following", { count: social.following })}
                                    </Typography>
                                </div>
                            ) : null}
                            {gamification ? (
                                // chips + huy hiệu CÙNG một hàng wrap (không tách 2 dòng)
                                <div className="flex flex-wrap items-center justify-center gap-2">
                                    <GamificationChip
                                        icon={
                                            <MedalIcon
                                                weight="fill"
                                                className="size-4"
                                                aria-hidden
                                                focusable="false"
                                            />
                                        }
                                        value={gamification.level}
                                        label={t("profile.level", { level: gamification.level })}
                                    />
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
                                    {/*
                                      * MỘT chip cho cả bộ huy hiệu, không phải mỗi huy hiệu một chip.
                                      * Trước đây mỗi badge là một pill `TrophyIcon` + `value={null}`:
                                      * trùng đúng icon với chip hạng ngay bên trái, lại không có chữ
                                      * (tên chỉ nằm trong `title`/`sr-only`), nên hồ sơ 4 huy hiệu hiện
                                      * ra 5 cái cúp y hệt nhau xếp hàng trong cột 288px. Gộp thành
                                      * `⭐ N` mở `BadgeCatalogModal` sẵn có (fetch lazy theo `isOpen`).
                                      * StarIcon là icon "Huy hiệu" của LeaderboardShell; TrophyIcon để
                                      * dành riêng cho hạng.
                                      *
                                      * ponytail: thẻ nhận diện chỉ còn CON SỐ, không kèm tên từng huy
                                      * hiệu — tên đã hiển thị đầy đủ ở tab Tiến độ, tab Portfolio và
                                      * trong chính modal danh mục, nên không dựng thêm tooltip/list ở
                                      * đây.
                                      */}
                                    {gamification.badges.length > 0 ? (
                                        <GamificationChip
                                            icon={
                                                <StarIcon
                                                    weight="fill"
                                                    className="size-4"
                                                    aria-hidden
                                                    focusable="false"
                                                />
                                            }
                                            value={gamification.badges.length}
                                            label={t("profile.badgesCount", {
                                                count: gamification.badges.length,
                                            })}
                                            onPress={() => setIsBadgeCatalogOpen(true)}
                                        />
                                    ) : null}
                                </div>
                            ) : null}
                            {profile.bio ? (
                                <Typography type="body-sm" color="muted">
                                    {profile.bio}
                                </Typography>
                            ) : null}
                            <div className="flex w-full flex-col gap-2">
                                <Button
                                    variant="secondary"
                                    fullWidth
                                    onPress={() => router.push("/profile/edit")}
                                >
                                    {t("profileSettings.items.editProfile")}
                                </Button>
                                <Button variant="tertiary" fullWidth onPress={() => void onShare()}>
                                    <ShareNetworkIcon
                                        aria-hidden
                                        focusable="false"
                                        className="size-5"
                                    />
                                    {t("profile.shareProfile")}
                                </Button>
                            </div>
                            {/* campus nằm TRÊN dòng "tham gia từ" */}
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
                            {joinedLabel ? (
                                <div className="flex items-center gap-2">
                                    <CalendarBlankIcon
                                        className="size-4 text-muted"
                                        aria-hidden
                                        focusable="false"
                                    />
                                    <Typography type="body-xs" color="muted">
                                        {joinedLabel}
                                    </Typography>
                                </div>
                            ) : null}
                            <BadgeCatalogModal
                                isOpen={isBadgeCatalogOpen}
                                onClose={() => setIsBadgeCatalogOpen(false)}
                            />
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
