import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

/**
 * Unit — the member row's ⋯ menu gate.
 *
 * The contract pinned here mirrors `MembershipService` server-side: only a manager
 * (OWNER/ADMIN) sees the menu at all, only an OWNER may hand out ADMIN, an OWNER row
 * is untouchable (ownership moves through transfer-ownership), and the viewer's own
 * row offers nothing. A regression here means the UI dangles actions that 400/403.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("@phosphor-icons/react", () => {
    const Icon = () => <span />
    return { DotsThreeIcon: Icon, UserMinusIcon: Icon, UserSwitchIcon: Icon }
})

vi.mock("@heroui/react", () => {
    const Button = ({
        children,
        onPress,
        "aria-label": ariaLabel,
    }: {
        children?: React.ReactNode
        onPress?: () => void
        "aria-label"?: string
    }) => (
        <button type="button" aria-label={ariaLabel} onClick={onPress}>
            {children}
        </button>
    )
    const Passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    const Dropdown = Object.assign(Passthrough, {
        Popover: Passthrough,
        Menu: Passthrough,
        Section: Passthrough,
        Item: ({
            children,
            id,
            onPress,
        }: {
            children?: React.ReactNode
            id?: string
            onPress?: () => void
        }) => (
            <button type="button" data-testid={`item-${id}`} onClick={onPress}>
                {children}
            </button>
        ),
    })
    return {
        Button,
        Dropdown,
        Label: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
    }
})

import {
    GroupMemberActionsMenu,
    groupMemberMenuGate,
} from "./GroupMemberActionsMenu"

describe("groupMemberMenuGate", () => {
    it("hides the menu for a viewer without group.manage", () => {
        expect(
            groupMemberMenuGate({ memberRole: "member", viewerRole: "moderator", isSelf: false }),
        ).toEqual({ visible: false, roles: [], canRemove: false })
        expect(
            groupMemberMenuGate({ memberRole: "member", viewerRole: null, isSelf: false }),
        ).toEqual({ visible: false, roles: [], canRemove: false })
    })

    it("hides the menu on the owner row and on the viewer's own row", () => {
        expect(
            groupMemberMenuGate({ memberRole: "owner", viewerRole: "owner", isSelf: false }).visible,
        ).toBe(false)
        expect(
            groupMemberMenuGate({ memberRole: "admin", viewerRole: "owner", isSelf: true }).visible,
        ).toBe(false)
    })

    it("offers ADMIN only to an owner and never the member's current role", () => {
        expect(
            groupMemberMenuGate({ memberRole: "member", viewerRole: "admin", isSelf: false }).roles,
        ).toEqual(["moderator"])
        expect(
            groupMemberMenuGate({ memberRole: "member", viewerRole: "owner", isSelf: false }).roles,
        ).toEqual(["admin", "moderator"])
        expect(
            groupMemberMenuGate({ memberRole: "admin", viewerRole: "owner", isSelf: false }).roles,
        ).toEqual(["moderator", "member"])
    })
})

describe("GroupMemberActionsMenu", () => {
    it("renders nothing for a plain member viewer", () => {
        const { container } = render(
            <GroupMemberActionsMenu
                memberRole="member"
                viewerRole="member"
                isSelf={false}
                onChangeRole={vi.fn()}
                onRemove={vi.fn()}
            />,
        )
        expect(container.innerHTML).toBe("")
    })

    it("an admin viewer gets demote/promote-to-moderator + kick, but never grant-admin", () => {
        render(
            <GroupMemberActionsMenu
                memberRole="member"
                viewerRole="admin"
                isSelf={false}
                onChangeRole={vi.fn()}
                onRemove={vi.fn()}
            />,
        )
        expect(screen.getByTestId("item-role-moderator")).toBeTruthy()
        expect(screen.queryByTestId("item-role-admin")).toBeNull()
        expect(screen.getByTestId("item-remove")).toBeTruthy()
    })

    it("an owner viewer can grant ADMIN and the entries fire their callbacks", () => {
        const onChangeRole = vi.fn()
        const onRemove = vi.fn()
        render(
            <GroupMemberActionsMenu
                memberRole="member"
                viewerRole="owner"
                isSelf={false}
                onChangeRole={onChangeRole}
                onRemove={onRemove}
            />,
        )
        fireEvent.click(screen.getByTestId("item-role-admin"))
        expect(onChangeRole).toHaveBeenCalledWith("admin")

        fireEvent.click(screen.getByTestId("item-remove"))
        expect(onRemove).toHaveBeenCalledTimes(1)
    })
})
