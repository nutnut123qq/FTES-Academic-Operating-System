import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

/**
 * Component — {@link CommunityPhotoLightboxModal}: the right pane is the ONLY thing
 * that scrolls here (`lg:overflow-y-auto`, and below `lg` the whole dialog scrolls as
 * one piece), so the post body it renders must pin its comment composer to the bottom
 * edge — otherwise the reader has to scroll past every comment to reach the box.
 *
 * That pin is one prop handed to the shared `CommunityPostContent`, which is exactly
 * what this file guards: the feed's own post popup already passes it, and this surface
 * silently did not.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("@heroui/react", () => {
    const Modal = ({ isOpen, children }: { isOpen: boolean; children?: React.ReactNode }) =>
        isOpen ? <div>{children}</div> : null
    Modal.Backdrop = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    Modal.Container = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    Modal.Dialog = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    Modal.CloseTrigger = () => <button type="button" />
    return {
        Modal,
        Button: ({ children }: { children?: React.ReactNode }) => <button type="button">{children}</button>,
        Spinner: () => <div />,
    }
})

vi.mock("@phosphor-icons/react", () => ({
    CaretLeftIcon: () => <span />,
    CaretRightIcon: () => <span />,
}))

/** Props the lightbox handed to the shared post body on the last render. */
const contentProps = vi.hoisted(() => ({ current: null as Record<string, unknown> | null }))

vi.mock("@/components/features/community/CommunityPostDetail/CommunityPostContent", () => ({
    CommunityPostContent: (props: Record<string, unknown>) => {
        contentProps.current = props
        return <div data-testid="post-content" />
    },
}))

vi.mock("@/hooks/zustand/overlay/hooks", () => ({
    useCommunityPhotoOverlayState: () => ({
        isOpen: true,
        close: vi.fn(),
        context: {
            postId: "post-1",
            startIndex: 0,
            media: [{ id: "m-1", mediaType: "IMAGE", storageKey: "https://cdn.test/a.jpg" }],
        },
    }),
}))

import { CommunityPhotoLightboxModal } from "./index"

describe("CommunityPhotoLightboxModal", () => {
    it("ghim ô soạn bình luận vào đáy pane bài viết", () => {
        render(<CommunityPhotoLightboxModal />)

        expect(screen.getByTestId("post-content")).toBeTruthy()
        expect(contentProps.current?.stickyComposer).toBe(true)
    })
})
