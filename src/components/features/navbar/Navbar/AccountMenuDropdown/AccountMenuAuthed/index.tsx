"use client"

import React, { useCallback } from "react"
import {
    Dropdown,
    Label,
} from "@heroui/react"
import {
    SquaresFourIcon,
    UserIcon,
    FileTextIcon,
    GearIcon,
    SignOutIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { pathConfig } from "@/resources/path"
import { useAccountMenuOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useMutateSignOutSwr } from "@/hooks/swr/api/graphql/mutations/useMutateSignOutSwr"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link AccountMenuAuthed}. */
export type AccountMenuAuthedProps = WithClassNames<undefined>

/**
 * Account dropdown menu for SIGNED-IN viewers: a primary section (Dashboard ·
 * Profile · Settings) and a separated destructive section (Sign out, danger).
 * Self-contained — owns navigation (closes the menu then pushes) and the sign-out
 * mutation; takes no data props.
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
