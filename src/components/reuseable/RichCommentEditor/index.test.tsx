import React from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Component — {@link RichCommentEditor} (community comment composer bug-fix).
 *
 * The two regressions this pins:
 *  1. The send button must submit the CURRENT editor body — reading it live at
 *     press time, not from a value captured at render (tiptap v3 does not
 *     re-render on every transaction, so `editor.isEmpty` / render-captured
 *     content lags the latest keystroke).
 *  2. The Ctrl/Cmd+Enter shortcut must resolve the LIVE editor (via a ref), not
 *     the `editor` closure that is still `null` when tiptap installs the
 *     `handleKeyDown` prop at editor-creation time.
 *
 * tiptap is mocked: `useEditor` captures the options object the component builds
 * (so the test can invoke the wired `handleKeyDown`) and returns a controllable
 * fake editor. That keeps the test on THIS component's submit wiring without a
 * real ProseMirror view in happy-dom.
 */

const hoisted = vi.hoisted(() => {
    const clearContent = vi.fn()
    // A non-empty editor whose serialized body is read at submit time.
    const fakeEditor = {
        isEmpty: false,
        isActive: () => false,
        // Body đọc đúng chỗ storage: editor.storage.markdown.getMarkdown().
        storage: { markdown: { getMarkdown: () => "hello world" } },
        getText: () => "hello world",
        getJSON: () => ({ type: "doc" }),
        commands: { clearContent, focus: () => undefined },
        chain: () => ({
            focus: () => ({
                toggleBold: () => ({ run: () => undefined }),
                insertContent: () => ({ run: () => undefined }),
            }),
        }),
    }
    return { fakeEditor, clearContent, captured: { current: null as unknown } }
})

// tiptap: capture the built options, hand back the fake editor.
vi.mock("@tiptap/react", () => ({
    useEditor: (options: unknown) => {
        hoisted.captured.current = options
        return hoisted.fakeEditor
    },
    EditorContent: () => <div data-testid="editor-content" />,
}))

// Extensions are only assembled into the options array (never run — useEditor is
// mocked), so trivial stand-ins with the shape the component calls are enough.
vi.mock("@tiptap/starter-kit", () => ({ default: { configure: () => ({}) } }))
vi.mock("@tiptap/extension-link", () => ({ default: { configure: () => ({}) } }))
vi.mock("@tiptap/extension-underline", () => ({ default: {} }))
vi.mock("@tiptap/extension-placeholder", () => ({ default: { configure: () => ({}) } }))
vi.mock("@tiptap/extension-image", () => ({ default: { configure: () => ({}) } }))
vi.mock("@tiptap/extension-mention", () => ({
    default: { extend: () => ({ configure: () => ({}) }) },
}))
vi.mock("tiptap-markdown", () => ({ Markdown: { configure: () => ({}) } }))
vi.mock("./mention-suggestion", () => ({ mentionSuggestion: {} }))

// next-intl: echo the key so assertions can key off message ids.
vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

// HeroUI Button → a native button (disabled buttons swallow clicks, as in prod).
vi.mock("@heroui/react", () => ({
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
        <button
            type="button"
            onClick={onPress}
            disabled={isDisabled}
            aria-label={rest["aria-label"]}
        >
            {children}
        </button>
    ),
    cn: (...values: Array<unknown>) => values.filter(Boolean).join(" "),
}))

// Icons + composer tools are presentation-only here.
vi.mock("@phosphor-icons/react", () => {
    const Icon = () => <svg />
    return {
        Code: Icon,
        CodeBlock: Icon,
        Link: Icon,
        ListBullets: Icon,
        ListNumbers: Icon,
        PaperPlaneTilt: Icon,
        Quotes: Icon,
        TextB: Icon,
        TextItalic: Icon,
        TextStrikethrough: Icon,
        TextUnderline: Icon,
    }
})
vi.mock("@/components/reuseable/CommentComposerTools", () => ({
    EmojiPicker: () => null,
    StickerPicker: () => null,
    STICKER_CATALOG: [],
    localizeStickers: (catalog: unknown) => catalog,
}))

import { RichCommentEditor } from "./index"

/** Read the `handleKeyDown` the component wired into tiptap's editorProps. */
const capturedHandleKeyDown = () => {
    const options = hoisted.captured.current as {
        editorProps?: {
            handleKeyDown?: (view: unknown, event: unknown) => boolean
        }
    }
    return options.editorProps?.handleKeyDown
}

describe("RichCommentEditor", () => {
    beforeEach(() => {
        hoisted.captured.current = null
        hoisted.clearContent.mockClear()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it("submits the live editor body when the send button is pressed", async () => {
        const onSubmit = vi.fn().mockResolvedValue(true)
        render(<RichCommentEditor onSubmit={onSubmit} />)

        fireEvent.click(screen.getByLabelText("engagement.commentSend"))

        await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("hello world"))
        // returning `true` clears the draft
        await waitFor(() => expect(hoisted.clearContent).toHaveBeenCalledTimes(1))
    })

    it("submits via Ctrl+Enter using the live editor (not a stale closure)", async () => {
        const onSubmit = vi.fn().mockResolvedValue(true)
        render(<RichCommentEditor onSubmit={onSubmit} />)

        const handleKeyDown = capturedHandleKeyDown()
        expect(handleKeyDown).toBeTypeOf("function")

        const preventDefault = vi.fn()
        let handled = false
        await act(async () => {
            handled = handleKeyDown!({}, { key: "Enter", ctrlKey: true, preventDefault })
        })

        expect(handled).toBe(true)
        expect(preventDefault).toHaveBeenCalled()
        await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("hello world"))
    })

    it("submits via Cmd+Enter (metaKey) too", async () => {
        const onSubmit = vi.fn().mockResolvedValue(true)
        render(<RichCommentEditor onSubmit={onSubmit} />)

        const handleKeyDown = capturedHandleKeyDown()
        await act(async () => {
            handleKeyDown!({}, { key: "Enter", metaKey: true, preventDefault: vi.fn() })
        })

        await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("hello world"))
    })

    it("does not submit on a bare Enter (no modifier)", async () => {
        const onSubmit = vi.fn().mockResolvedValue(true)
        render(<RichCommentEditor onSubmit={onSubmit} />)

        const handleKeyDown = capturedHandleKeyDown()
        let handled = true
        await act(async () => {
            handled = handleKeyDown!({}, { key: "Enter", preventDefault: vi.fn() })
        })

        expect(handled).toBe(false)
        expect(onSubmit).not.toHaveBeenCalled()
    })
})
