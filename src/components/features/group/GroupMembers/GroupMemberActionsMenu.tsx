"use client"

import React from "react"
import { Button, Dropdown, Label } from "@heroui/react"
import { DotsThreeIcon, UserMinusIcon, UserSwitchIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import {
    GROUP_ASSIGNABLE_ROLES,
    type GroupAssignableRole,
    type GroupMemberRole,
} from "./useQueryGroupMemberRowsSwr"

/** Input of {@link groupMemberMenuGate}. */
export interface GroupMemberMenuGateInput {
    /** Role of the row's member. */
    memberRole: GroupMemberRole
    /** Role of the viewer inside THIS group; null when the viewer is not a member. */
    viewerRole: GroupMemberRole | null
    /** Whether the row is the viewer themselves. */
    isSelf: boolean
}

/** Result of {@link groupMemberMenuGate}. */
export interface GroupMemberMenuGate {
    /** Whether the ⋯ menu renders at all. */
    visible: boolean
    /** Roles offered as "set role" entries (never the member's current role). */
    roles: Array<GroupAssignableRole>
    /** Whether the destructive "remove from group" entry renders. */
    canRemove: boolean
}

/**
 * Decides what the row's ⋯ menu may offer. Mirrors the server rules in
 * `MembershipService` so the UI never dangles an action that would 403/400:
 *
 * - `changeRole` needs `group.manage` → OWNER or ADMIN only.
 * - only an OWNER may hand out ADMIN (`GROUP_FORBIDDEN`, "Chỉ OWNER gán ADMIN").
 * - an OWNER row can neither be re-roled (`GROUP_USE_TRANSFER`) nor kicked
 *   (`GROUP_OWNER_MUST_TRANSFER`) — ownership moves via transfer only.
 * - the viewer's own row is left alone: self-kick is "leave the group", a
 *   different flow, and self-demotion is not a thing this surface offers.
 *
 * The server re-checks all of it; this gate is purely UX.
 *
 * @param input - {@link GroupMemberMenuGateInput}
 */
export const groupMemberMenuGate = ({
    memberRole,
    viewerRole,
    isSelf,
}: GroupMemberMenuGateInput): GroupMemberMenuGate => {
    const canManage = viewerRole === "owner" || viewerRole === "admin"
    if (!canManage || isSelf || memberRole === "owner") {
        return { visible: false, roles: [], canRemove: false }
    }
    const roles = GROUP_ASSIGNABLE_ROLES.filter(
        (role) => role !== memberRole && (role !== "admin" || viewerRole === "owner"),
    )
    return { visible: true, roles, canRemove: true }
}

/** Props for {@link GroupMemberActionsMenu}. */
export interface GroupMemberActionsMenuProps extends GroupMemberMenuGateInput {
    /** Promote/demote the member to `role` (the feature owns the optimistic write). */
    onChangeRole: (role: GroupAssignableRole) => void
    /** Start the kick flow — the feature confirms before writing. */
    onRemove: () => void
}

/**
 * The ⋯ overflow menu of a member row: promote/demote entries plus the
 * destructive "remove from group". Renders NOTHING when {@link groupMemberMenuGate}
 * says the viewer may not act on this row, so a plain member's list stays icon-free.
 *
 * HeroUI note: every `Dropdown.Item` carries a real `id` (`role-admin`, `remove`, …) —
 * without it React Aria falls back to generated `react-aria-N` keys.
 *
 * @param props - {@link GroupMemberActionsMenuProps}
 */
export const GroupMemberActionsMenu = ({
    memberRole,
    viewerRole,
    isSelf,
    onChangeRole,
    onRemove,
}: GroupMemberActionsMenuProps) => {
    const t = useTranslations("groupsHub")
    const gate = groupMemberMenuGate({ memberRole, viewerRole, isSelf })

    if (!gate.visible) {
        return null
    }

    return (
        <Dropdown>
            <Button
                isIconOnly
                size="sm"
                variant="ghost"
                className="shrink-0"
                aria-label={t("members.actions")}
            >
                <DotsThreeIcon aria-hidden focusable="false" className="size-5" />
            </Button>
            <Dropdown.Popover>
                <Dropdown.Menu>
                    <Dropdown.Section>
                        {gate.roles.map((role) => (
                            <Dropdown.Item
                                key={role}
                                id={`role-${role}`}
                                textValue={t("members.setRole", { role: t(`roles.${role}`) })}
                                onPress={() => onChangeRole(role)}
                            >
                                <UserSwitchIcon className="size-5" />
                                <Label>
                                    {t("members.setRole", { role: t(`roles.${role}`) })}
                                </Label>
                            </Dropdown.Item>
                        ))}
                        {gate.canRemove ? (
                            <Dropdown.Item
                                id="remove"
                                textValue={t("members.remove")}
                                onPress={() => onRemove()}
                            >
                                <UserMinusIcon className="size-5" />
                                <Label>{t("members.remove")}</Label>
                            </Dropdown.Item>
                        ) : null}
                    </Dropdown.Section>
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown>
    )
}
