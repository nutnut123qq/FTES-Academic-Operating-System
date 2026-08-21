import React from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const h = vi.hoisted(() => ({
    threadProps: [] as Array<Record<string, unknown>>,
    mediaQueryOptions: [] as Array<Record<string, unknown> | undefined>,
}))

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("usehooks-ts", () => ({
    useMediaQuery: (_query: string, options?: Record<string, unknown>) => {
        h.mediaQueryOptions.push(options)
        return true
    },
}))

vi.mock("@phosphor-icons/react", () => ({
    ArrowsOutIcon: () => <span data-testid="expand-icon" />,
}))

vi.mock("@heroui/react", () => {
    const Button = ({
        children,
        onPress,
        ...rest
    }: {
    children?: React.ReactNode;
    onPress?: () => void;
    [key: string]: unknown;
  }) => {
        const { isIconOnly, size, variant, className, ...dom } = rest
        void isIconOnly
        void size
        void variant
        void className
        return (
            <button type="button" onClick={onPress} {...dom}>
                {children}
            </button>
        )
    }
    const Typography = ({ children }: { children?: React.ReactNode }) => (
        <span>{children}</span>
    )
    const ModalRoot = ({
        isOpen,
        children,
    }: {
    isOpen: boolean;
    children?: React.ReactNode;
  }) => (isOpen ? <div role="dialog">{children}</div> : null)
    const Pass = ({ children }: { children?: React.ReactNode }) => (
        <>{children}</>
    )
    const Modal = Object.assign(ModalRoot, {
        Backdrop: Pass,
        Container: Pass,
        Dialog: Pass,
        Header: Pass,
        Body: Pass,
        CloseTrigger: () => null,
    })
    return { Button, Modal, Typography }
})

vi.mock("./CommunityLiveChatThread", () => ({
    CommunityLiveChatThread: (props: Record<string, unknown>) => {
        h.threadProps.push(props)
        return <div data-testid="chat-thread" />
    },
}))

vi.mock("./OnlinePresence", () => ({
    OnlinePresence: () => <div data-testid="online-presence" />,
}))

import { CommunityLiveChatRail } from "./CommunityLiveChatRail"

afterEach(() => {
    cleanup()
    h.threadProps.length = 0
    h.mediaQueryOptions.length = 0
})

describe("CommunityLiveChatRail", () => {
    it("keeps the rail chat interactive and opens the popup only from the expand button", () => {
        render(<CommunityLiveChatRail />)

        expect(screen.getAllByTestId("chat-thread")).toHaveLength(1)
        expect(h.threadProps[0]).toMatchObject({ enabled: true })
        expect(h.threadProps[0]).not.toHaveProperty("readOnly")
        expect(h.mediaQueryOptions[0]).toEqual({ initializeWithValue: false })
        expect(screen.queryByRole("dialog")).toBeNull()

        fireEvent.click(screen.getByLabelText("expand"))

        expect(screen.getByRole("dialog")).toBeTruthy()
        expect(screen.getAllByTestId("chat-thread")).toHaveLength(2)
        expect(h.threadProps[1]).toMatchObject({ enabled: true })
    })
})
