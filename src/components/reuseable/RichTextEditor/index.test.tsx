import React from "react"
import { fireEvent, render, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const uploadCommunityMedia = vi.fn()
const toastDanger = vi.fn()
const setImage = vi.fn()

vi.mock("@/modules/api/rest/community", () => ({
    uploadCommunityMedia: (file: File) => uploadCommunityMedia(file),
}))
vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))
vi.mock("@heroui/react", () => ({
    // Minimal stand-ins: the test asserts behaviour (which buttons exist, what a
    // failed upload does), not styling.
    Button: ({
        children,
        onPress,
        ...rest
    }: {
        children?: React.ReactNode
        onPress?: () => void
        "aria-label"?: string
    }) => (
        <button type="button" onClick={onPress} aria-label={rest["aria-label"]}>
            {children}
        </button>
    ),
    cn: (...values: Array<unknown>) => values.filter(Boolean).join(" "),
    toast: { danger: (message: string) => toastDanger(message) },
}))
// Listed one by one on purpose: a Proxy factory here answers `then` with a function,
// vitest awaits the factory, and the whole run hangs on the fake thenable.
vi.mock("@phosphor-icons/react", () => {
    const icon = () => <svg />
    return {
        Code: icon,
        CodeBlock: icon,
        Image: icon,
        Link: icon,
        ListBullets: icon,
        ListNumbers: icon,
        Quotes: icon,
        TextB: icon,
        TextHOne: icon,
        TextHTwo: icon,
        TextHThree: icon,
        TextItalic: icon,
        TextStrikethrough: icon,
        TextUnderline: icon,
    }
})
vi.mock("./extensions", () => ({
    buildEditorExtensions: () => [],
    getEditorMarkdown: () => "",
    trimMarkdown: (value: string) => value,
}))
vi.mock("@tiptap/react", () => {
    const chain = {
        focus: () => chain,
        setImage: (attrs: { src: string, alt: string }) => {
            setImage(attrs)
            return chain
        },
        run: () => true,
    }
    return {
        useEditor: () => ({
            chain: () => chain,
            isActive: () => false,
            commands: { setContent: vi.fn() },
            setEditable: vi.fn(),
        }),
        EditorContent: () => <div />,
    }
})

import { RichTextEditor } from "./index"

/**
 * Unit — the shared rich-text editor's IMAGE affordance. Two things are pinned:
 * a failed upload must reach the user (it used to only reach the console, while
 * the `PostImagePicker` sitting next to it toasted), and the button itself must
 * be suppressible so a composer that already owns a picker offers exactly one
 * way to attach an image.
 */

/** Drive the hidden file input the way a real pick does (no `user-event` here). */
const pick = (container: HTMLElement, file: File) => {
    const input = container.querySelector("input[type=file]") as HTMLInputElement
    Object.defineProperty(input, "files", { value: [file], configurable: true })
    fireEvent.change(input)
}

const noop = () => undefined
const image = () => new File(["x"], "a.png", { type: "image/png" })

beforeEach(() => {
    uploadCommunityMedia.mockReset()
    toastDanger.mockReset()
    setImage.mockReset()
})

describe("RichTextEditor", () => {
    it("toasts when the toolbar upload fails instead of swallowing it", async () => {
        uploadCommunityMedia.mockRejectedValue(new Error("boom"))
        const { container } = render(
            <RichTextEditor value="" onChange={noop} toolbar="full" />,
        )

        pick(container, image())

        await waitFor(() => expect(toastDanger).toHaveBeenCalledWith("uploadFailed"))
        expect(setImage).not.toHaveBeenCalled()
    })

    it("inserts the uploaded image on success", async () => {
        uploadCommunityMedia.mockResolvedValue({ secureUrl: "https://res/a.png" })
        const { container } = render(
            <RichTextEditor value="" onChange={noop} toolbar="full" />,
        )

        pick(container, image())

        await waitFor(() =>
            expect(setImage).toHaveBeenCalledWith({ src: "https://res/a.png", alt: "imageAlt" }),
        )
        expect(toastDanger).not.toHaveBeenCalled()
    })

    it("hides the image button (and its input) when `imageButton` is false", () => {
        const withButton = render(
            <RichTextEditor value="" onChange={noop} toolbar="full" />,
        )
        expect(withButton.queryByLabelText("image")).toBeTruthy()
        // both renders would otherwise share document.body and the queries would cross
        withButton.unmount()

        const without = render(
            <RichTextEditor value="" onChange={noop} toolbar="full" imageButton={false} />,
        )
        expect(without.queryByLabelText("image")).toBeNull()
        expect(without.container.querySelector("input[type=file]")).toBeNull()
    })

    it("keeps the comment toolbar image-free", () => {
        const { queryByLabelText, container } = render(
            <RichTextEditor value="" onChange={noop} />,
        )

        expect(queryByLabelText("image")).toBeNull()
        expect(container.querySelector("input[type=file]")).toBeNull()
    })
})
