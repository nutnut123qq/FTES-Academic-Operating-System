import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Component — {@link PostEngagementBar}: the SHARE CHANNEL fork.
 *
 * Zalo has no web-intent that works outside its SDK iframe — the old
 * `sp.zalo.me/plugins/share` link answered 200 with an EMPTY body, so pressing
 * "Chia sẻ qua Zalo" opened a blank tab. The fix is pinned here:
 *  - a channel without `buildUrl` (Zalo) opens NO tab and copies the link
 *    instead, with its own toast explaining why,
 *  - a real web-intent channel (Facebook) still opens its tab,
 *  - the Zalo path records the share as COPY_LINK, never as ZALO (the link left
 *    the app via the clipboard; nothing reached Zalo).
 *
 * `t` echoes the key so assertions key off message ids.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => "vi",
}))

const toastSuccess = vi.fn()

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
        }: {
            children?: React.ReactNode
            onPress?: () => void
        }) => (
            <button type="button" onClick={onPress}>
                {children}
            </button>
        ),
        Label: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
        cn: (...values: Array<unknown>) => values.filter(Boolean).join(" "),
        toast: {
            success: (message: string) => toastSuccess(message),
            danger: vi.fn(),
        },
    }
})

vi.mock("@phosphor-icons/react", () => ({
    HeartIcon: () => <span />,
    ChatCircleIcon: () => <span />,
    ChatCircleDotsIcon: () => <span />,
    ShareNetworkIcon: () => <span />,
    LinkSimpleIcon: () => <span />,
    PaperPlaneTiltIcon: () => <span />,
    RepeatIcon: () => <span />,
    FacebookLogoIcon: () => <span />,
    XLogoIcon: () => <span />,
}))

vi.mock("@/components/blocks/buttons/SaveButton", () => ({
    SaveButton: () => <span />,
}))

vi.mock("./PostActionsMenu", () => ({
    PostActionsMenu: () => <span />,
}))

// Re-exported from `index.tsx` but irrelevant here — keep their dependency trees out.
vi.mock("./ReportDialog", () => ({ ReportDialog: () => null }))
vi.mock("./ConfirmDialog", () => ({ ConfirmDialog: () => null }))

import { PostEngagementBar } from "./index"

const POST_URL = "https://ftes.example/vi/community/abc"

const writeText = vi.fn(() => Promise.resolve())

const renderBar = (onShared: (channel: string) => void) =>
    render(
        <PostEngagementBar
            likes={0}
            liked={false}
            commentsCount={0}
            onToggleLike={vi.fn()}
            postUrl={POST_URL}
            shareTitle="Bài viết"
            onShared={onShared as never}
        />,
    )

describe("PostEngagementBar — share channels", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: { writeText },
        })
    })

    it("Zalo opens NO tab: it copies the link and says why", async () => {
        const open = vi.spyOn(window, "open").mockReturnValue(null)
        const onShared = vi.fn()
        renderBar(onShared)

        fireEvent.click(screen.getByTestId("item-share-zalo"))

        await waitFor(() => expect(writeText).toHaveBeenCalledWith(POST_URL))
        expect(open).not.toHaveBeenCalled()
        expect(toastSuccess).toHaveBeenCalledWith("engagement.shareZaloCopied")
        // the link left via the clipboard — record it as such, NOT as a Zalo share
        expect(onShared).toHaveBeenCalledWith("COPY_LINK")
        expect(onShared).not.toHaveBeenCalledWith("ZALO")
    })

    it("Facebook still opens its web-intent tab", () => {
        const open = vi.spyOn(window, "open").mockReturnValue(null)
        renderBar(vi.fn())

        fireEvent.click(screen.getByTestId("item-share-facebook"))

        expect(open).toHaveBeenCalledTimes(1)
        expect(open.mock.calls[0]?.[0]).toBe(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(POST_URL)}`,
        )
        expect(writeText).not.toHaveBeenCalled()
    })
})
