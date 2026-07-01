"use client"

import React from "react"
import {
    Dropdown,
    Separator,
    cn,
} from "@heroui/react"
import { AccountTrigger } from "./AccountTrigger"
import { UserSummary } from "./UserSummary"
import { GuestHeader } from "./GuestHeader"
import { AccountMenuAuthed } from "./AccountMenuAuthed"
import { AccountMenuGuest } from "./AccountMenuGuest"
import { useAccountMenuOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useQueryUserSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserSwr"
import { useAppSelector } from "@/redux/hooks"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for {@link AccountMenuDropdown}.
 */
export type AccountMenuDropdownProps = WithClassNames<{
    /** Optional class applied to the dropdown container. */
    menuContainer?: string
}>

/**
 * AccountMenuDropdown — navbar account menu. Two regions, both swapped on auth
 * state and both holding a skeleton while the shared `me` query first resolves:
 *   1. a STATIC header div (`p-3`, not a menu item) — UserSummary for
 *      signed-in viewers, GuestHeader for guests.
 *   2. a Dropdown.Menu — AccountMenuAuthed (dashboard/profile/settings/sign-out)
 *      for signed-in viewers, AccountMenuGuest (sign in / sign up) for guests.
 * Language + theme live in the navbar itself, so they are not repeated here.
 *
 * Thin container: owns only the dropdown overlay state and the auth flags; each
 * region self-fetches/dispatches. `"use client"` for the hooks.
 * @param props - optional class-name overrides
 */
export const AccountMenuDropdown = (props: AccountMenuDropdownProps) => {
    const { classNames } = props
    const { isOpen, setOpen } = useAccountMenuOverlayState()
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const user = useAppSelector((state) => state.user.user)
    // real loading signal: the shared "me" query (deduped). On FAIL it resolves to
    // not-loading with no user → guest (the `initialized` flag is never set, so it
    // would skeleton forever). Skeleton only on first load with no user yet.
    const { isLoading } = useQueryUserSwr()
    const isResolving = isLoading && !user

    // authed view only when we actually have the user — a dead/expired session or
    // any auth error falls back to guest (not a broken authed view / error state)
    const isAuthed = authenticated && Boolean(user)

    return (
        <Dropdown
            isOpen={isOpen}
            onOpenChange={setOpen}
            className={cn(classNames?.menuContainer)}
        >
            <AccountTrigger />
            <Dropdown.Popover placement="bottom right" className="w-[300px]">
                {/* (1) static header div — UserSummary / GuestHeader (skeleton: UserCell) */}
                <div className="p-3">
                    <AsyncContent
                        isLoading={isResolving}
                        skeleton={<Skeleton.UserCell />}
                    >
                        {isAuthed ? <UserSummary /> : <GuestHeader />}
                    </AsyncContent>
                </div>
                <Separator />
                {/* (2) menu — authed actions / guest sign-in (skeleton: 4 rows) */}
                <AsyncContent
                    isLoading={isResolving}
                    skeleton={<Skeleton.Menu items={4} />}
                >
                    {isAuthed ? <AccountMenuAuthed /> : <AccountMenuGuest />}
                </AsyncContent>
            </Dropdown.Popover>
        </Dropdown>
    )
}
