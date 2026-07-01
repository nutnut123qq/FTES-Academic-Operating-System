"use client"

import React, { useCallback } from "react"
import {
    DropdownItem,
    DropdownMenu,
    DropdownSection,
    cn,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import { useMutateSignOutSwr } from "@/hooks/swr/api/graphql/mutations/useMutateSignOutSwr"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for {@link LogoutMenu}.
 */
export type LogoutMenuProps = WithClassNames<undefined>

/**
 * Logout section of the account dropdown.
 *
 * Container: owns the sign-out mutation and triggers it directly on press.
 * `"use client"` for hooks + press handler.
 * @param props - optional root class name
 */
export const LogoutMenu = ({ className }: LogoutMenuProps) => {
    const t = useTranslations()
    const mutateSignOutSwr = useMutateSignOutSwr()

    /** Trigger the sign-out mutation. */
    const onLogout = useCallback(
        async () => {
            await mutateSignOutSwr.trigger()
        },
        [mutateSignOutSwr],
    )

    return (
        <DropdownMenu className={cn(className)}>
            {/** Logout block */}
            <DropdownSection>
                <DropdownItem
                    key="logout"
                    className="py-3 text-danger"
                    onPress={onLogout}
                >
                    {t("nav.logout")}
                </DropdownItem>
            </DropdownSection>
        </DropdownMenu>
    )
}
