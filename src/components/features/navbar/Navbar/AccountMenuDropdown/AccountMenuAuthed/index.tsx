"use client"

import React, { useCallback } from "react"
import {
    Dropdown,
    Header,
    Label,
} from "@heroui/react"
import {
    GraduationCapIcon,
    ChalkboardTeacherIcon,
    UserIcon,
    FileTextIcon,
    GearIcon,
    SignOutIcon,
    WalletIcon,
    PlusCircleIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { pathConfig } from "@/resources/path"
import { useHasPermission } from "@/hooks/useHasPermission"
import { useAccountMenuOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useGetMyWalletSwr } from "@/hooks/swr/api/rest/queries/useGetMyWalletSwr"
import { useMutateSignOutSwr } from "@/hooks/swr/api/graphql/mutations/useMutateSignOutSwr"
import { EXPLORE_SHORTCUTS } from "../explore-shortcuts"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link AccountMenuAuthed}. */
export type AccountMenuAuthedProps = WithClassNames<undefined>

/**
 * Account dropdown menu for SIGNED-IN viewers: a labeled "Khám phá" (Explore)
 * section (Trợ lý AI · Dành cho bạn — discovery shortcuts relocated from the
 * header; Recommendations now lives inside the AI Assistant, Trending inside
 * Community), then a primary section (Profile · CV · Settings · Wallet with its
 * live balance + a top-up shortcut), and a separated destructive section (Sign
 * out, danger). Dashboard / Activity / Integrations / Roles were removed as
 * redundant (Dashboard unused, Activity duplicated in the profile, System admin
 * links out of scope for the account menu). Self-contained — owns navigation
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
            {/* "Khám phá" — discovery shortcuts relocated out of the header (D8/D9);
                sits between the gamification stats row above and the account links */}
            <Dropdown.Section>
                <Header>{t("profileMenu.explore.title")}</Header>
                {EXPLORE_SHORTCUTS.map((shortcut) => (
                    <Dropdown.Item
                        key={shortcut.id}
                        id={shortcut.id}
                        textValue={t(shortcut.labelKey)}
                        onPress={() => go(shortcut.path())}
                    >
                        {shortcut.icon}
                        <Label>{t(shortcut.labelKey)}</Label>
                    </Dropdown.Item>
                ))}
            </Dropdown.Section>
            <Dropdown.Section>
                <Dropdown.Item
                    id="profile"
                    textValue={t("nav.profile")}
                    onPress={() => go(pathConfig().locale().profile().build())}
                >
                    <UserIcon className="size-5" />
                    <Label>{t("nav.profile")}</Label>
                </Dropdown.Item>
                <Dropdown.Item
                    id="cv"
                    textValue={t("cv.title")}
                    onPress={() => go(pathConfig().locale().profile().cv().build())}
                >
                    <FileTextIcon className="size-5" />
                    <Label>{t("cv.title")}</Label>
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
