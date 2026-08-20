import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"

/**
 * Unit — the management danger zone's transfer-ownership flow.
 *
 * Contract pinned here: the section is OWNER-only, the picker offers ONLY current
 * admins (the backend rejects anyone else with `GROUP_NEW_OWNER_NOT_ADMIN`), and the
 * transfer never fires straight off the button — it goes through the confirm dialog,
 * so a cancelled confirm writes nothing.
 */

const transferTrigger = vi.fn().mockResolvedValue(undefined)
const archiveTrigger = vi.fn().mockResolvedValue(undefined)
const globalMutate = vi.fn().mockResolvedValue(undefined)

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("swr", () => ({ useSWRConfig: () => ({ mutate: globalMutate }) }))

vi.mock("@heroui/react", () => {
    const Button = ({
        children,
        onPress,
        isDisabled,
    }: {
        children?: React.ReactNode
        onPress?: () => void
        isDisabled?: boolean
    }) => (
        <button type="button" disabled={isDisabled} onClick={onPress}>
            {children}
        </button>
    )
    const Passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    const Modal = Object.assign(
        ({ children, isOpen }: { children?: React.ReactNode; isOpen?: boolean }) =>
            isOpen ? <div>{children}</div> : null,
        {
            Backdrop: Passthrough,
            Container: Passthrough,
            Dialog: Passthrough,
            Header: Passthrough,
            Body: Passthrough,
            Footer: Passthrough,
        },
    )
    return {
        Button,
        Modal,
        Typography: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
    }
})

vi.mock("@/modules/toast/hooks", () => ({
    useRestWithToast: () => (action: () => Promise<unknown>) => action(),
}))

vi.mock("@/hooks/swr/api/rest/mutations/usePostArchiveGroupSwr", () => ({
    usePostArchiveGroupSwr: () => ({ trigger: archiveTrigger, isMutating: false }),
}))
vi.mock("@/hooks/swr/api/rest/mutations/usePostTransferGroupOwnershipSwr", () => ({
    usePostTransferGroupOwnershipSwr: () => ({ trigger: transferTrigger, isMutating: false }),
}))

vi.mock("@/components/reuseable/PostEngagementBar", () => ({
    ConfirmDialog: ({
        isOpen,
        onConfirm,
        onClose,
    }: {
        isOpen: boolean
        onConfirm: () => void
        onClose: () => void
    }) =>
        isOpen ? (
            <div>
                <button type="button" data-testid="confirm" onClick={onConfirm}>
                    confirm
                </button>
                <button type="button" data-testid="cancel" onClick={onClose}>
                    cancel
                </button>
            </div>
        ) : null,
}))

vi.mock("../hooks/useQueryGroupSwr", () => ({
    groupHeaderKey: (groupId: string) => ["GET_GROUP", groupId],
}))
vi.mock("./useQueryGroupSettingsSwr", () => ({
    groupSettingsKey: (groupId: string) => ["group-settings", groupId],
}))

vi.mock("../GroupMembers/useQueryGroupMemberRowsSwr", () => ({
    useQueryGroupMemberRowsSwr: () => ({
        members: [
            { id: "u-admin", username: "an", displayName: "An", avatarUrl: null, role: "admin" },
            { id: "u-mod", username: "mo", displayName: "Mo", avatarUrl: null, role: "moderator" },
            { id: "u-owner", username: "ow", displayName: "Ow", avatarUrl: null, role: "owner" },
        ],
        mutate: vi.fn().mockResolvedValue(undefined),
    }),
}))

import { GroupDangerZone } from "./GroupDangerZone"

describe("GroupDangerZone — transfer ownership", () => {
    beforeEach(() => {
        transferTrigger.mockClear()
        archiveTrigger.mockClear()
        globalMutate.mockClear()
    })

    it("renders nothing when the viewer does not own the group", () => {
        const { container } = render(
            <GroupDangerZone groupId="g1" groupName="Nhóm A" isOwner={false} isArchived={false} />,
        )
        expect(container.innerHTML).toBe("")
    })

    it("offers only current admins as the next owner", () => {
        render(
            <GroupDangerZone groupId="g1" groupName="Nhóm A" isOwner isArchived={false} />,
        )
        const options = screen.getAllByRole("option") as Array<HTMLOptionElement>
        expect(options.map((option) => option.value)).toEqual(["", "u-admin"])
    })

    /**
     * Hồi quy dark mode: popup native của <select> trên Chromium lấy nền từ background
     * TÍNH ĐƯỢC của thẻ select. Select ở đây là `bg-transparent` nên popup rơi về nền
     * TRẮNG mặc định của Blink, còn <option> kế thừa `--foreground` (trắng ở nhánh tối)
     * ⇒ trắng trên trắng, chỉ đọc được dòng đang rê chuột. Cách duy nhất popup còn nghe
     * theo là màu đặt TRỰC TIẾP lên <option>, nên 2 class dưới đây là bản vá, không phải
     * trang trí — gỡ chúng là lỗi quay lại.
     *
     * ponytail: test soi CHUỖI class chứ không soi màu đã render. Trần: vitest.config.ts
     * cố tình vô hiệu PostCSS (không nạp CSS nào), nên không có `getComputedStyle` nào
     * chứng minh được màu thật ở đây. Đường nâng cấp: khẳng định màu thật bằng một ca
     * Playwright ở `e2e/` (đã có hạ tầng) mở Create group ở dark mode và đọc màu popup.
     */
    it("sơn nền đục cho <option> để popup dark mode đọc được mọi dòng", () => {
        render(
            <GroupDangerZone groupId="g1" groupName="Nhóm A" isOwner isArchived={false} />,
        )
        const select = screen.getByRole("combobox")
        expect(select.className).toContain("[&>option]:bg-surface")
        expect(select.className).toContain("[&>option]:text-foreground")
    })

    it("transfers only after the confirm dialog is confirmed", async () => {
        render(
            <GroupDangerZone groupId="g1" groupName="Nhóm A" isOwner isArchived={false} />,
        )
        fireEvent.change(screen.getByRole("combobox"), { target: { value: "u-admin" } })
        fireEvent.click(screen.getByText("manage.transferAction"))

        // the press opens the confirm — nothing is written yet
        expect(transferTrigger).not.toHaveBeenCalled()

        fireEvent.click(screen.getByTestId("confirm"))
        await waitFor(() =>
            expect(transferTrigger).toHaveBeenCalledWith({
                id: "g1",
                request: { newOwnerId: "u-admin" },
            }),
        )
    })

    it("writes nothing when the confirm is cancelled", async () => {
        render(
            <GroupDangerZone groupId="g1" groupName="Nhóm A" isOwner isArchived={false} />,
        )
        fireEvent.change(screen.getByRole("combobox"), { target: { value: "u-admin" } })
        fireEvent.click(screen.getByText("manage.transferAction"))
        fireEvent.click(screen.getByTestId("cancel"))

        await waitFor(() => expect(screen.queryByTestId("confirm")).toBeNull())
        expect(transferTrigger).not.toHaveBeenCalled()
    })
})
