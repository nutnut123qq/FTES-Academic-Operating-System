"use client"

import React, { useCallback } from "react"
import {
    Dropdown,
    Label,
} from "@heroui/react"
import {
    SquaresFourIcon,
    GraduationCapIcon,
    ChalkboardTeacherIcon,
    UserIcon,
    GearIcon,
    SignOutIcon,
    WalletIcon,
    PlusCircleIcon,
    BookmarkSimpleIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { pathConfig } from "@/resources/path"
import { useHasPermission } from "@/hooks/useHasPermission"
import { useAccountMenuOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useGetMyWalletSwr } from "@/hooks/swr/api/rest/queries/useGetMyWalletSwr"
import { useMutateSignOutSwr } from "@/hooks/swr/api/graphql/mutations/useMutateSignOutSwr"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link AccountMenuAuthed}. */
export type AccountMenuAuthedProps = WithClassNames<undefined>

/**
 * Account dropdown menu for SIGNED-IN viewers: the dashboard hub, then the learning
 * section (My courses · Teaching for lecturers), then a primary section (Profile ·
 * Saved · Settings · Wallet with its live balance + a top-up shortcut), and a
 * separated destructive section (Sign out, danger).
 *
 * "Bảng điều khiển" is back as the FIRST row: it was dropped while `/dashboard` did
 * not exist, but the 4-tab cockpit now does and nothing else in the app links to it
 * (the navbar logo goes to the marketing landing), so removing it left the page
 * unreachable. Activity / Integrations / Roles stay out (Activity duplicated in the
 * profile, system-admin links out of scope). "Nhiệm vụ" also stays out — the quest
 * board is surfaced by the `DailyQuest` widget on the dashboard Overview tab, which
 * links on to the full `/quests` page — and so does "Xem lại hướng dẫn" (the welcome
 * tour still auto-starts for new users via `TourProvider`; the manual replay entry
 * was dropped with `ReplayGuideItem`).
 * Self-contained — owns navigation
 * (closes the menu then pushes) and the sign-out mutation; takes no data props.
 *
 * @param props - optional className (placement only).
 */
export const AccountMenuAuthed = ({ className }: AccountMenuAuthedProps) => {
    const t = useTranslations()
    const router = useRouter()
    const { close } = useAccountMenuOverlayState()
    const signOut = useMutateSignOutSwr()
    // Wallet balance shown inline on the Wallet row (auth-gated hook → undefined
    // for guests / before load, in which case the balance chip is simply omitted).
    const walletBalance = useGetMyWalletSwr().data?.balance
    // Lecturer-only "Khoá tôi dạy" entry — same gate as the interview manage panel
    // (`ai.teacher.use`); a non-lecturer never sees the teaching link.
    const isLecturer = useHasPermission("ai.teacher.use")

    /** Close the menu, then navigate. */
    const go = useCallback(
        (path: string) => {
            close()
            router.push(path)
        },
        [close, router],
    )

    /** Close the menu, then sign out. */
    const onLogout = useCallback(
        async () => {
            close()
            await signOut.trigger()
        },
        [close, signOut],
    )

    return (
        <Dropdown.Menu className={className}>
            {/* "Bảng điều khiển" (/dashboard) — the signed-in home: 4-tab cockpit over
                progress, feed, courses and standing. First row because it is the hub the
                other entries are reachable FROM; the navbar logo deliberately still points
                at the marketing landing, so this menu is the only way in. */}
            <Dropdown.Section>
                <Dropdown.Item
                    id="dashboard"
                    textValue={t("nav.dashboard")}
                    onPress={() => go(pathConfig().locale().dashboard().build())}
                >
                    <SquaresFourIcon className="size-5" />
                    <Label>{t("nav.dashboard")}</Label>
                </Dropdown.Item>
            </Dropdown.Section>
            {/* "Khóa học của tôi" — the learner's own enrolled courses, first for
                one-tap resume (ahead of the discovery shortcuts) */}
            <Dropdown.Section>
                <Dropdown.Item
                    id="my-courses"
                    textValue={t("nav.myCourses")}
                    onPress={() => go(pathConfig().locale().course().mine().build())}
                >
                    <GraduationCapIcon className="size-5" />
                    <Label>{t("nav.myCourses")}</Label>
                </Dropdown.Item>
                {isLecturer ? (
                    <Dropdown.Item
                        id="teaching"
                        textValue={t("nav.teaching")}
                        onPress={() => go(pathConfig().locale().course().teaching().build())}
                    >
                        <ChalkboardTeacherIcon className="size-5" />
                        <Label>{t("nav.teaching")}</Label>
                    </Dropdown.Item>
                ) : null}
            </Dropdown.Section>
            {/* Mục "Khám phá" (chỉ còn 1 dòng "Trợ lý học tập FrosTES" → /ai) đã BỎ:
                linh vật nổi ở góc phải dưới giờ là điểm vào DUY NHẤT của mọi tính năng AI
                (xem `mascot-assistant/options.ts`), giữ thêm lối này chỉ là 2 cửa cho cùng
                1 chỗ. Route /ai vẫn sống, chỉ đổi chỗ bấm vào. */}
            <Dropdown.Section>
                <Dropdown.Item
                    id="profile"
                    textValue={t("nav.profile")}
                    onPress={() => go(pathConfig().locale().profile().build())}
                >
                    <UserIcon className="size-5" />
                    <Label>{t("nav.profile")}</Label>
                </Dropdown.Item>
                {/* "Đã lưu / Yêu thích" — the save-for-later library (/saved). */}
                <Dropdown.Item
                    id="saved"
                    textValue={t("nav.saved")}
                    onPress={() => go(pathConfig().locale().saved().build())}
                >
                    <BookmarkSimpleIcon className="size-5" />
                    <Label>{t("nav.saved")}</Label>
                </Dropdown.Item>
                <Dropdown.Item
                    id="settings"
                    textValue={t("profileSettings.title")}
                    onPress={() => go(pathConfig().locale().profile().settings().build())}
                >
                    <GearIcon className="size-5" />
                    <Label>{t("profileSettings.title")}</Label>
                </Dropdown.Item>
                {/* Wallet: live balance shown inline; the trailing "+" affordance and
                    the row itself open the wallet surface (where top-up lives). */}
                <Dropdown.Item
                    id="wallet"
                    textValue={t("nav.wallet")}
                    onPress={() => go(pathConfig().locale().wallet().build())}
                >
                    <WalletIcon className="size-5" />
                    <Label>{t("nav.wallet")}</Label>
                    <span className="ml-auto flex items-center gap-2">
                        {walletBalance !== undefined ? (
                            <span className="text-sm font-medium text-foreground">
                                {walletBalance.toLocaleString()}
                            </span>
                        ) : null}
                        <PlusCircleIcon
                            className="size-5 text-accent"
                            aria-label={t("wallet.topup")}
                            focusable="false"
                        />
                    </span>
                </Dropdown.Item>
            </Dropdown.Section>
            <Dropdown.Section>
                <Dropdown.Item
                    id="logout"
                    textValue={t("nav.logout")}
                    className="text-danger"
                    onPress={onLogout}
                >
                    <SignOutIcon className="size-5" />
                    <Label className="text-danger">{t("nav.logout")}</Label>
                </Dropdown.Item>
            </Dropdown.Section>
        </Dropdown.Menu>
    )
}
