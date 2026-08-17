"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import {
    Code as CodeIcon,
    CodeBlock as CodeBlockIcon,
    Link as LinkIcon,
    ListBullets as BulletListIcon,
    ListNumbers as OrderedListIcon,
    PaperPlaneTilt as SendIcon,
    Quotes as BlockquoteIcon,
    TextB as BoldIcon,
    TextItalic as ItalicIcon,
    TextStrikethrough as StrikethroughIcon,
    TextUnderline as UnderlineIcon,
} from "@phosphor-icons/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import {
    EmojiPicker,
    StickerPicker,
    STICKER_CATALOG,
    localizeStickers,
} from "@/components/reuseable/CommentComposerTools"
import type { Sticker } from "@/components/reuseable/CommentComposerTools"
import {
    buildEditorExtensions,
    getEditorMarkdown,
    trimMarkdown,
} from "@/components/reuseable/RichTextEditor/extensions"

/** Props for {@link RichCommentEditor}. */
export interface RichCommentEditorProps extends WithClassNames<undefined> {
    /** Placeholder shown when the editor is empty. */
    placeholder?: string
    /** Focus the editor on mount. */
    autoFocus?: boolean
    /** Disable editing and submit. */
    disabled?: boolean
    /** Pending state controlled by the parent (e.g. during GraphQL mutation). */
    isPending?: boolean
    /**
     * Called with the Markdown body when the user submits.
     * Return `true` to clear the editor; `false` keeps the draft (error handling).
     */
    onSubmit?: (body: string) => boolean | Promise<boolean>
    /**
     * Increment this value to programmatically focus the editor.
     * Useful when switching into reply mode while preserving the draft.
     */
    focusTrigger?: number | string
    /**
     * Chuỗi chèn SẴN vào ô soạn khi {@link RichCommentEditorProps.focusTrigger} đổi và ô
     * đang RỖNG — dùng cho auto-tag "@Tên " lúc bấm trả lời, để người dùng THẤY cái tag
     * trong ô chứ không phải đoán là nó sẽ được ghép lúc gửi.
     *
     * Ô đang có chữ thì KHÔNG chèn: người dùng gõ dở rồi đổi ý bấm trả lời hàng khác vẫn
     * giữ nguyên bản nháp, không bị đạp chữ.
     */
    prefill?: string
    /** Called when the editor receives focus. */
    onFocus?: () => void
    /** Called when the editor loses focus. */
    onBlur?: () => void
}

/**
 * Rich text composer for comments. Built on Tiptap, exports Markdown, and lives
 * inside a single bounded box (composer-in-box). Supports bold, italic,
 * underline, strikethrough, link, bullet/ordered lists, blockquote, inline code,
 * code blocks, @ mention, emoji, and inline sticker images.
 *
 * @param props - {@link RichCommentEditorProps}
 */
export const RichCommentEditor = ({
    placeholder,
    autoFocus,
    disabled,
    isPending,
    onSubmit,
    focusTrigger,
    prefill,
    onFocus,
    onBlur,
    className,
}: RichCommentEditorProps) => {
    const t = useTranslations("communityHub")
    const [internalPending, setInternalPending] = useState(false)
    const isSubmitting = isPending ?? internalPending

    const stickers = useMemo(() => localizeStickers(STICKER_CATALOG, t), [t])

    // Live handle to the current editor. The keydown handler below is captured
    // when tiptap creates the editor (first render → `editor` is still null), so
    // it must read the instance from this ref instead of a stale closure.
    const editorRef = useRef<Editor | null>(null)

    const handleSubmit = useCallback(async (editor: Editor) => {
        if (disabled || isSubmitting) {
            return
        }
        // Serialize the body from the CURRENT editor at submit time. tiptap v3 does
        // not re-render React on every transaction, so `editor.isEmpty` (and any
        // value captured at render) can lag the latest keystroke — gate on the
        // freshly read body instead of a stale emptiness flag. Đọc đúng chỗ storage
        // (`.markdown.getMarkdown()`) theo fix 4b4282b.
        const body = trimMarkdown(getEditorMarkdown(editor))
        if (!body) {
            return
        }
        const shouldTrackPending = isPending === undefined
        if (shouldTrackPending) {
            setInternalPending(true)
        }
        try {
            const ok = await onSubmit?.(body)
            if (ok) {
                editor.commands.clearContent(true)
            }
        } finally {
            if (shouldTrackPending) {
                setInternalPending(false)
            }
        }
    }, [disabled, isPending, isSubmitting, onSubmit])

    const editor = useEditor({
        immediatelyRender: false,
        // tiptap v3 defaults this to false → canSubmit/isActive read stale
        // editor state in render; true restores v2 per-transaction re-render.
        shouldRerenderOnTransaction: true,
        autofocus: autoFocus,
        editable: !disabled,
        // Comment scope: shared extension list with headings OFF (a comment never
        // grows headings). The general body editor reuses the same base with
        // `headings: true`.
        extensions: buildEditorExtensions({
            placeholder: placeholder ?? t("engagement.commentPlaceholder"),
            headings: false,
        }),
        editorProps: {
            attributes: {
                class: cn(
                    "prose prose-sm min-h-9 max-h-40 overflow-y-auto bg-transparent text-sm text-foreground outline-none",
                    "prose-p:my-0 prose-ul:my-0 prose-ol:my-0 prose-blockquote:my-0",
                    "empty:before:text-muted empty:before:content-[attr(data-placeholder)] empty:before:pointer-events-none",
                ) ?? "",
            },
            handleKeyDown: (_view, event) => {
                if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                    event.preventDefault()
                    // Read the editor from the ref (never the closure `editor`, which
                    // is null at the point this handler is created) so Ctrl/Cmd+Enter
                    // always submits the current draft.
                    const current = editorRef.current
                    if (current) {
                        void handleSubmit(current)
                    }
                    return true
                }
                return false
            },
        },
        onFocus: () => {
            onFocus?.()
        },
        onBlur: () => {
            onBlur?.()
        },
    })

    // Keep the ref pointing at the live editor so the keydown handler resolves the
    // current instance rather than the null captured when the editor was created.
    editorRef.current = editor

    // ponytail: `prefill` đọc qua ref chứ không nằm trong deps — nó đổi CÙNG LÚC với
    // `focusTrigger` khi bấm trả lời, còn lúc huỷ trả lời thì chỉ mình nó đổi và ta KHÔNG
    // muốn cú đó kéo con trỏ về ô soạn. Một nguồn kích hoạt duy nhất: `focusTrigger`.
    const prefillRef = useRef(prefill)
    prefillRef.current = prefill

    useEffect(() => {
        if (!editor || focusTrigger === undefined) {
            return
        }
        const text = prefillRef.current
        // Chèn dạng text node (không phải chuỗi HTML) để dấu cách cuối "@Tên " sống sót —
        // parser HTML sẽ nuốt mất khoảng trắng đó.
        if (text && editor.isEmpty) {
            editor.chain().focus("end").insertContent({ type: "text", text }).run()
            return
        }
        editor.commands.focus("end")
    }, [editor, focusTrigger])

    const insertSticker = useCallback((sticker: Sticker) => {
        if (!editor) return
        editor
            .chain()
            .focus()
            .insertContent({
                type: "image",
                attrs: { src: `/stickers/${sticker.file}`, alt: sticker.label },
            })
            .run()
    }, [editor])

    const toolbarButton = useCallback((
        label: string,
        icon: React.ReactNode,
        onPress: () => void,
        isActive?: boolean,
        isDisabled?: boolean,
    ) => (
        <Button
            key={label}
            isIconOnly
            size="sm"
            variant={isActive ? "primary" : "ghost"}
            aria-label={label}
            isDisabled={isDisabled}
            onPress={onPress}
        >
            {icon}
        </Button>
    ), [])

    if (!editor) {
        return null
    }

    const canSubmit = !editor.isEmpty && !disabled && !isSubmitting

    return (
        <div
            className={cn(
                "flex flex-col gap-2 rounded-2xl border border-separator bg-surface px-3 py-2 focus-within:border-accent",
                disabled && "opacity-60",
                className,
            )}
        >
            <EditorContent editor={editor} />
            <div className="flex items-center gap-1">
                <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
                    {toolbarButton(
                        t("engagement.bold"),
                        <BoldIcon aria-hidden focusable="false" className="size-4" />,
                        () => editor.chain().focus().toggleBold().run(),
                        editor.isActive("bold"),
                    )}
                    {toolbarButton(
                        t("engagement.italic"),
                        <ItalicIcon aria-hidden focusable="false" className="size-4" />,
                        () => editor.chain().focus().toggleItalic().run(),
                        editor.isActive("italic"),
                    )}
                    {toolbarButton(
                        t("engagement.underline"),
                        <UnderlineIcon aria-hidden focusable="false" className="size-4" />,
                        () => editor.chain().focus().toggleUnderline().run(),
                        editor.isActive("underline"),
                    )}
                    {toolbarButton(
                        t("engagement.strikethrough"),
                        <StrikethroughIcon aria-hidden focusable="false" className="size-4" />,
                        () => editor.chain().focus().toggleStrike().run(),
                        editor.isActive("strike"),
                    )}
                    {toolbarButton(
                        t("engagement.link"),
                        <LinkIcon aria-hidden focusable="false" className="size-4" />,
                        () => {
                            if (editor.isActive("link")) {
                                editor.chain().focus().unsetLink().run()
                                return
                            }
                            const url = window.prompt(t("engagement.addLink"))
                            if (url && url.trim()) {
                                editor.chain().focus().setLink({ href: url.trim() }).run()
                            }
                        },
                        editor.isActive("link"),
                    )}
                    {toolbarButton(
                        t("engagement.bulletList"),
                        <BulletListIcon aria-hidden focusable="false" className="size-4" />,
                        () => editor.chain().focus().toggleBulletList().run(),
                        editor.isActive("bulletList"),
                    )}
                    {toolbarButton(
                        t("engagement.orderedList"),
                        <OrderedListIcon aria-hidden focusable="false" className="size-4" />,
                        () => editor.chain().focus().toggleOrderedList().run(),
                        editor.isActive("orderedList"),
                    )}
                    {toolbarButton(
                        t("engagement.blockquote"),
                        <BlockquoteIcon aria-hidden focusable="false" className="size-4" />,
                        () => editor.chain().focus().toggleBlockquote().run(),
                        editor.isActive("blockquote"),
                    )}
                    {toolbarButton(
                        t("engagement.codeInline"),
                        <CodeIcon aria-hidden focusable="false" className="size-4" />,
                        () => editor.chain().focus().toggleCode().run(),
                        editor.isActive("code"),
                    )}
                    {toolbarButton(
                        t("engagement.codeBlock"),
                        <CodeBlockIcon aria-hidden focusable="false" className="size-4" />,
                        () => editor.chain().focus().toggleCodeBlock().run(),
                        editor.isActive("codeBlock"),
                    )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    <span className="mx-1 h-5 w-px bg-default" aria-hidden />
                    <EmojiPicker
                        emojiLabel={t("engagement.emojiPickerLabel")}
                        onEmojiSelect={(emoji) => editor.chain().focus().insertContent(emoji).run()}
                    />
                    <StickerPicker
                        stickerLabel={t("engagement.stickerPickerLabel")}
                        stickers={stickers}
                        onStickerSelect={insertSticker}
                    />
                    <Button
                        isIconOnly
                        size="sm"
                        variant="primary"
                        isDisabled={!canSubmit}
                        isPending={isSubmitting}
                        aria-label={t("engagement.commentSend")}
                        onPress={() => void handleSubmit(editor)}
                    >
                        <SendIcon aria-hidden focusable="false" className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
