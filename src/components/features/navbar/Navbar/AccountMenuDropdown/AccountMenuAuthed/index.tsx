"use client"

import React, { useCallback } from "react"
import {
    Dropdown,
    Header,
    Label,
} from "@heroui/react"
import {
    GraduationCapIcon,
    SquaresFourIcon,
    UserIcon,
    FileTextIcon,
    GearIcon,
    SignOutIcon,
    PulseIcon,
    WalletIcon,
    PlugIcon,
    ShieldIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { pathConfig } from "@/resources/path"
import { useAccountMenuOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useMutateSignOutSwr } from "@/hooks/swr/api/graphql/mutations/useMutateSignOutSwr"
import { EXPLORE_SHORTCUTS } from "../explore-shortcuts"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link AccountMenuAuthed}. */
export type AccountMenuAuthedProps = WithClassNames<undefined>

/**
 * Account dropdown menu for SIGNED-IN viewers: a labeled "Khám phá" (Explore)
 * section (Trợ lý AI · Dành cho bạn · Gợi ý cho bạn · Thịnh hành — the discovery
 * shortcuts relocated from the header), a primary section (Dashboard · Profile ·
 * CV · Settings), a labeled "You" section (Activity · Wallet), a labeled
 * "System" section (Integrations · Roles), and a separated destructive section
 * (Sign out, danger). Self-contained — owns navigation (closes the menu then
 * pushes) and the sign-out mutation; takes no data props.
 *
 * @param props - optional className (placement only).
 */
export const AccountMenuAuthed = ({ className }: AccountMenuAuthedProps) => {
    const t = useTranslations()
    const router = useRouter()
    const { close } = useAccountMenuOverlayState()
    const signOut = useMutateSignOutSwr()

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
                    id="dashboard"
                    textValue={t("nav.dashboard")}
                    onPress={() => go(pathConfig().locale().dashboard().build())}
                >
                    <SquaresFourIcon className="size-5" />
                    <Label>{t("nav.dashboard")}</Label>
                </Dropdown.Item>
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
            </Dropdown.Section>
            {/* "You" — personal destinations migrated from the old Explore mega-menu */}
            <Dropdown.Section>
                <Header>{t("nav.section.you")}</Header>
                <Dropdown.Item
                    id="activity"
                    textValue={t("nav.activity")}
                    onPress={() => go(pathConfig().locale().activity().build())}
                >
                    <PulseIcon className="size-5" />
                    <Label>{t("nav.activity")}</Label>
                </Dropdown.Item>
                <Dropdown.Item
                    id="wallet"
                    textValue={t("nav.wallet")}
                    onPress={() => go(pathConfig().locale().wallet().build())}
                >
                    <WalletIcon className="size-5" />
                    <Label>{t("nav.wallet")}</Label>
                </Dropdown.Item>
            </Dropdown.Section>
            {/* "System" — admin/system destinations migrated from the old Explore mega-menu */}
            <Dropdown.Section>
                <Header>{t("nav.section.system")}</Header>
                <Dropdown.Item
                    id="integrations"
                    textValue={t("nav.integrations")}
                    onPress={() => go(pathConfig().locale().integrations().build())}
                >
                    <PlugIcon className="size-5" />
                    <Label>{t("nav.integrations")}</Label>
                </Dropdown.Item>
                <Dropdown.Item
                    id="roles"
                    textValue={t("nav.roles")}
                    onPress={() => go(pathConfig().locale().roles().build())}
                >
                    <ShieldIcon className="size-5" />
                    <Label>{t("nav.roles")}</Label>
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
