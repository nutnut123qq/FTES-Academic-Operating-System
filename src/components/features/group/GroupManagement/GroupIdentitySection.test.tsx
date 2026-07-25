import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"

/**
 * Unit — the management identity section's "Gỡ ảnh" flow.
 *
 * Contract pinned here: removing an image the group ALREADY has is a SERVER write
 * (`DELETE /groups/{id}/media/{AVATAR|COVER}` behind a confirm) that patches the
 * group header cache so the image really disappears, while dropping a pick that was
 * never saved stays local (no request). A clear that failed leaves the removal
 * pending, so the save button stays enabled to retry it — the old
 * `isDisabled={!file}` rule made a removal-only edit unsaveable.
 */

const clearGroupMedia = vi.fn()
const upload = vi.fn().mockResolvedValue("https://cdn/new.png")
const mutateGroup = vi.fn().mockResolvedValue(undefined)

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

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
    return {
        Button,
        Typography: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
    }
})

vi.mock("@/modules/api/rest/group", () => ({
    clearGroupMedia: (...args: Array<unknown>) => clearGroupMedia(...args),
}))

// mirrors runRestWithToast: the value on success, null when the write throws
vi.mock("@/modules/toast/hooks", () => ({
    useRestWithToast: () => async (action: () => Promise<unknown>) => {
        try {
            return await action()
        } catch {
            return null
        }
    },
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
    useQueryGroupSwr: () => ({
        group: {
            id: "g1",
            name: "Nhóm A",
            avatarUrl: "https://cdn/avatar.png",
            coverUrl: "https://cdn/cover.png",
        },
        mutate: mutateGroup,
    }),
}))

vi.mock("../hooks/useMutateGroupMediaSwr", () => ({
    useMutateGroupMediaSwr: () => ({ upload }),
}))

// stub the pickers: expose one button per kind so the section's remove handler is
// exercised directly, plus a "pick a file" affordance for the local-only branch
vi.mock("../GroupIdentityFields", () => ({
    GroupIdentityFields: ({
        avatar,
        onRemove,
    }: {
        avatar: { accept: (file: File) => void }
        onRemove?: (kind: "AVATAR" | "COVER") => void
    }) => (
        <div>
            <button type="button" data-testid="remove-avatar" onClick={() => onRemove?.("AVATAR")}>
                remove avatar
            </button>
            <button type="button" data-testid="remove-cover" onClick={() => onRemove?.("COVER")}>
                remove cover
            </button>
            <button
                type="button"
                data-testid="pick-avatar"
                onClick={() =>
                    avatar.accept(new File(["x"], "a.png", { type: "image/png" }))
                }
            >
                pick avatar
            </button>
        </div>
    ),
}))

import { GroupIdentitySection } from "./GroupIdentitySection"

/** The save button rendered by the section (label comes back as its i18n key). */
const saveButton = () => screen.getByText("identity.save").closest("button") as HTMLButtonElement

describe("GroupIdentitySection — remove group image", () => {
    beforeEach(() => {
        clearGroupMedia.mockReset()
        clearGroupMedia.mockResolvedValue({ id: "g1", avatarUrl: null, coverUrl: null })
        mutateGroup.mockClear()
        upload.mockClear()
        globalThis.URL.createObjectURL = vi.fn(() => "blob:preview")
        globalThis.URL.revokeObjectURL = vi.fn()
    })

    it("asks for confirmation before clearing a saved image", () => {
        render(<GroupIdentitySection groupId="g1" />)
        fireEvent.click(screen.getByTestId("remove-avatar"))

        expect(screen.getByTestId("confirm")).toBeTruthy()
        expect(clearGroupMedia).not.toHaveBeenCalled()
    })

    it("clears the AVATAR server-side and drops it from the group cache", async () => {
        render(<GroupIdentitySection groupId="g1" />)
        fireEvent.click(screen.getByTestId("remove-avatar"))
        fireEvent.click(screen.getByTestId("confirm"))

        await waitFor(() => expect(clearGroupMedia).toHaveBeenCalledWith("g1", "AVATAR"))
        await waitFor(() => expect(mutateGroup).toHaveBeenCalled())

        // the cache updater must null the avatar (and leave the cover alone)
        const [updater, options] = mutateGroup.mock.calls[0] as [
            (current: unknown) => unknown,
            { revalidate: boolean },
        ]
        expect(options).toEqual({ revalidate: false })
        expect(updater({ avatarUrl: "https://cdn/avatar.png", coverUrl: "https://cdn/cover.png" })).toEqual({
            avatarUrl: null,
            coverUrl: "https://cdn/cover.png",
        })
    })

    it("sends the COVER kind when the cover is the one being removed", async () => {
        render(<GroupIdentitySection groupId="g1" />)
        fireEvent.click(screen.getByTestId("remove-cover"))
        fireEvent.click(screen.getByTestId("confirm"))

        await waitFor(() => expect(clearGroupMedia).toHaveBeenCalledWith("g1", "COVER"))
        const [updater] = mutateGroup.mock.calls[0] as [(current: unknown) => unknown]
        expect(updater({ avatarUrl: "https://cdn/avatar.png", coverUrl: "https://cdn/cover.png" })).toEqual({
            avatarUrl: "https://cdn/avatar.png",
            coverUrl: null,
        })
    })

    it("writes nothing when the confirm is cancelled", async () => {
        render(<GroupIdentitySection groupId="g1" />)
        fireEvent.click(screen.getByTestId("remove-avatar"))
        fireEvent.click(screen.getByTestId("cancel"))

        await waitFor(() => expect(screen.queryByTestId("confirm")).toBeNull())
        expect(clearGroupMedia).not.toHaveBeenCalled()
    })

    it("drops an unsaved pick locally — no request, nothing to delete server-side", async () => {
        render(<GroupIdentitySection groupId="g1" />)
        fireEvent.click(screen.getByTestId("pick-avatar"))
        await waitFor(() => expect(saveButton().disabled).toBe(false))

        fireEvent.click(screen.getByTestId("remove-avatar"))

        expect(screen.queryByTestId("confirm")).toBeNull()
        expect(clearGroupMedia).not.toHaveBeenCalled()
    })

    it("dropping a wrong pick does NOT queue the saved image for deletion", async () => {
        render(<GroupIdentitySection groupId="g1" />)
        // the group already has an avatar; the user picks the WRONG file, then undoes it
        fireEvent.click(screen.getByTestId("pick-avatar"))
        await waitFor(() => expect(saveButton().disabled).toBe(false))
        fireEvent.click(screen.getByTestId("remove-avatar"))

        // back to "nothing pending": the saved avatar is still the shown one, so Lưu
        // has nothing to flush (the old `remove()` marked it cleared → Lưu DELETEd it)
        await waitFor(() => expect(saveButton().disabled).toBe(true))

        fireEvent.click(saveButton())
        await waitFor(() => expect(upload).not.toHaveBeenCalled())
        expect(clearGroupMedia).not.toHaveBeenCalled()
    })

    it("keeps the save button enabled to retry a removal the server rejected", async () => {
        clearGroupMedia.mockRejectedValue(new Error("403"))
        render(<GroupIdentitySection groupId="g1" />)

        // nothing pending yet
        expect(saveButton().disabled).toBe(true)

        fireEvent.click(screen.getByTestId("remove-avatar"))
        fireEvent.click(screen.getByTestId("confirm"))

        await waitFor(() => expect(clearGroupMedia).toHaveBeenCalledTimes(1))
        expect(mutateGroup).not.toHaveBeenCalled()

        // the removal is still pending → saving retries it (old rule disabled on !file)
        await waitFor(() => expect(saveButton().disabled).toBe(false))
        fireEvent.click(saveButton())
        await waitFor(() => expect(clearGroupMedia).toHaveBeenCalledTimes(2))
        expect(upload).not.toHaveBeenCalled()
    })
})
