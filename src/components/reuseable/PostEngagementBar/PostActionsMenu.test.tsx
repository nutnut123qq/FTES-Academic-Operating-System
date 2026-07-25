import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

/**
 * Component — {@link PostActionsMenu}: the ⋯ overflow menu's OWNER GATE.
 *
 * The menu is the only place a post can be edited / deleted / reported, so the
 * gate is pinned here:
 *  - the author sees "Sửa" + "Xoá" and NO "Báo cáo" (nobody reports themselves),
 *  - anybody else sees ONLY "Báo cáo" — an owner-only handler passed by the
 *    surface must never render for a non-owner,
 *  - a handler that was not passed contributes no entry,
 *  - with nothing available the whole trigger is absent (no dead ⋯ button).
 *
 * `t` echoes the key so assertions key off message ids.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

// HeroUI primitives → trivial renderers; `Dropdown.Item` becomes a real button so
// the entries are queryable and pressable without React Aria's overlay machinery.
vi.mock("@heroui/react", () => {
    const Dropdown = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    Dropdown.Popover = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    Dropdown.Menu = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    Dropdown.Section = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    Dropdown.Item = ({
        id,
        textValue,
        onPress,
        children,
    }: {
        id: string
        textValue: string
        onPress?: () => void
        children: React.ReactNode
    }) => (
        <button type="button" data-testid={`item-${id}`} aria-label={textValue} onClick={onPress}>
            {children}
        </button>
    )
    return {
        Dropdown,
        Button: ({
            children,
            onPress,
            ...rest
        }: {
            children?: React.ReactNode
            onPress?: () => void
            "aria-label"?: string
        }) => (
            <button type="button" onClick={onPress} {...rest}>
                {children}
            </button>
        ),
        Label: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
        cn: (...values: Array<unknown>) => values.filter(Boolean).join(" "),
    }
})

vi.mock("@phosphor-icons/react", () => ({
    DotsThreeIcon: () => <span />,
    PencilSimpleIcon: () => <span />,
    TrashIcon: () => <span />,
    FlagIcon: () => <span />,
}))

import { PostActionsMenu } from "./PostActionsMenu"

describe("PostActionsMenu — owner gate", () => {
    it("gives the author edit + delete and hides report", () => {
        const onEdit = vi.fn()
        const onDelete = vi.fn()
        render(
            <PostActionsMenu isOwner onEdit={onEdit} onDelete={onDelete} onReport={vi.fn()} />,
        )

        expect(screen.getByTestId("item-edit")).toBeTruthy()
        expect(screen.getByTestId("item-delete")).toBeTruthy()
        expect(screen.queryByTestId("item-report")).toBeNull()

        fireEvent.click(screen.getByTestId("item-edit"))
        expect(onEdit).toHaveBeenCalledTimes(1)
        fireEvent.click(screen.getByTestId("item-delete"))
        expect(onDelete).toHaveBeenCalledTimes(1)
    })

    it("gives a non-owner ONLY report, even when owner handlers are passed", () => {
        const onReport = vi.fn()
        render(
            <PostActionsMenu
                isOwner={false}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onReport={onReport}
            />,
        )

        expect(screen.queryByTestId("item-edit")).toBeNull()
        expect(screen.queryByTestId("item-delete")).toBeNull()

        fireEvent.click(screen.getByTestId("item-report"))
        expect(onReport).toHaveBeenCalledTimes(1)
    })

    it("omits entries whose handler was not passed", () => {
        render(<PostActionsMenu isOwner onEdit={vi.fn()} />)

        expect(screen.getByTestId("item-edit")).toBeTruthy()
        expect(screen.queryByTestId("item-delete")).toBeNull()
        expect(screen.queryByTestId("item-report")).toBeNull()
    })

    it("renders nothing at all when no action is available", () => {
        const { container } = render(<PostActionsMenu isOwner={false} />)
        expect(container.innerHTML).toBe("")
    })
})
