import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const uploadCommunityMedia = vi.fn()
const toastDanger = vi.fn()

vi.mock("@/modules/api/rest/community", () => ({
    uploadCommunityMedia: (file: File) => uploadCommunityMedia(file),
}))
vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))
vi.mock("@heroui/react", () => ({
    // Minimal stand-ins: the test asserts behaviour (uploads, callbacks), not styling.
    Button: ({
        children,
        onPress,
        isDisabled,
        ...rest
    }: {
        children?: React.ReactNode
        onPress?: () => void
        isDisabled?: boolean
        "aria-label"?: string
    }) => (
        <button type="button" onClick={onPress} disabled={isDisabled} aria-label={rest["aria-label"]}>
            {children}
        </button>
    ),
    Typography: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
    cn: (...values: Array<unknown>) => values.filter(Boolean).join(" "),
    toast: { danger: (message: string) => toastDanger(message) },
}))
vi.mock("@phosphor-icons/react", () => ({
    ImageSquareIcon: () => <svg />,
    XIcon: () => <svg />,
}))

import { PostImagePicker } from "./index"

/**
 * Unit — the composer's image picker. What matters here is the contract with the
 * composer (which images are reported as ready, and whether an upload is still in
 * flight) plus the client-side gate that mirrors the server limits: at most 4
 * images, at most 10MB each, images only. A rejected file must never reach the
 * network.
 */

const image = (name: string, { size = 1024, type = "image/png" } = {}) => {
    const file = new File(["x"], name, { type })
    Object.defineProperty(file, "size", { value: size })
    return file
}

/**
 * Drive the hidden file input the way a real pick does. `user-event` is not a
 * dependency here, so the FileList is planted on the element before firing change.
 */
const pick = (container: HTMLElement, files: Array<File>) => {
    const input = container.querySelector("input[type=file]") as HTMLInputElement
    Object.defineProperty(input, "files", { value: files, configurable: true })
    fireEvent.change(input)
}

beforeEach(() => {
    uploadCommunityMedia.mockReset()
    toastDanger.mockReset()
    // happy-dom has no object-URL implementation.
    URL.createObjectURL = vi.fn(() => "blob:preview")
    URL.revokeObjectURL = vi.fn()
})

describe("PostImagePicker", () => {
    it("uploads a picked image and reports it as ready", async () => {
        uploadCommunityMedia.mockResolvedValue({
            mediaAssetId: "a1",
            provider: "CLOUDINARY",
            url: "http://res/a.png",
            secureUrl: "https://res/a.png",
        })
        const onChange = vi.fn()
        const onUploadingChange = vi.fn()
        const { container } = render(
            <PostImagePicker onChange={onChange} onUploadingChange={onUploadingChange} />,
        )

        pick(container, [image("a.png")])

        await waitFor(() =>
            expect(onChange).toHaveBeenLastCalledWith([
                { mediaType: "IMAGE", storageKey: "https://res/a.png", mimeType: "image/png", sizeBytes: 1024 },
            ]),
        )
        // The composer must have been told an upload was in flight at some point.
        expect(onUploadingChange).toHaveBeenCalledWith(true)
        await waitFor(() => expect(onUploadingChange).toHaveBeenLastCalledWith(false))
    })

    it("refuses a file over 10MB without calling the API", async () => {
        const { container } = render(
            <PostImagePicker onChange={vi.fn()} onUploadingChange={vi.fn()} />,
        )

        pick(container, [image("big.png", { size: 11 * 1024 * 1024 })])

        expect(uploadCommunityMedia).not.toHaveBeenCalled()
        expect(toastDanger).toHaveBeenCalledWith("composer.imageTooLarge")
    })

    it("refuses a non-image file without calling the API", async () => {
        const { container } = render(
            <PostImagePicker onChange={vi.fn()} onUploadingChange={vi.fn()} />,
        )

        pick(container, [image("doc.pdf", { type: "application/pdf" })])

        expect(uploadCommunityMedia).not.toHaveBeenCalled()
        expect(toastDanger).toHaveBeenCalledWith("composer.imageInvalid")
    })

    it("caps the selection at four images", async () => {
        uploadCommunityMedia.mockResolvedValue({
            mediaAssetId: "a",
            provider: "CLOUDINARY",
            url: "http://res/a.png",
            secureUrl: "https://res/a.png",
        })
        const onChange = vi.fn()
        const { container } = render(
            <PostImagePicker onChange={onChange} onUploadingChange={vi.fn()} />,
        )

        pick(container, [
            image("1.png"),
            image("2.png"),
            image("3.png"),
            image("4.png"),
            image("5.png"),
        ])

        await waitFor(() => expect(uploadCommunityMedia).toHaveBeenCalledTimes(4))
        expect(toastDanger).toHaveBeenCalledWith("composer.imageLimit")
    })

    it("drops an image whose upload fails and keeps the others", async () => {
        uploadCommunityMedia
            .mockResolvedValueOnce({
                mediaAssetId: "a",
                provider: "CLOUDINARY",
                url: "http://res/a.png",
                secureUrl: "https://res/a.png",
            })
            .mockRejectedValueOnce(new Error("boom"))
        const onChange = vi.fn()
        const { container } = render(
            <PostImagePicker onChange={onChange} onUploadingChange={vi.fn()} />,
        )

        pick(container, [image("ok.png"), image("bad.png")])

        await waitFor(() => expect(toastDanger).toHaveBeenCalledWith("composer.imageUploadFailed"))
        await waitFor(() =>
            expect(onChange).toHaveBeenLastCalledWith([
                { mediaType: "IMAGE", storageKey: "https://res/a.png", mimeType: "image/png", sizeBytes: 1024 },
            ]),
        )
    })

    it("removes a picked image on request", async () => {
        uploadCommunityMedia.mockResolvedValue({
            mediaAssetId: "a",
            provider: "CLOUDINARY",
            url: "http://res/a.png",
            secureUrl: "https://res/a.png",
        })
        const onChange = vi.fn()
        const { container } = render(
            <PostImagePicker onChange={onChange} onUploadingChange={vi.fn()} />,
        )
        pick(container, [image("a.png")])
        await waitFor(() => expect(onChange).toHaveBeenLastCalledWith([expect.anything()]))

        fireEvent.click(screen.getByLabelText("composer.removeImage"))

        await waitFor(() => expect(onChange).toHaveBeenLastCalledWith([]))
    })
})
