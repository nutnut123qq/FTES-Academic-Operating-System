"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Button, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import TiptapLink from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import Placeholder from "@tiptap/extension-placeholder"
import Image from "@tiptap/extension-image"
import Mention from "@tiptap/extension-mention"
import { Markdown, type MarkdownStorage } from "tiptap-markdown"
import type { MarkdownSerializerState } from "prosemirror-markdown"
import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
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
import { mentionSuggestion } from "./mention-suggestion"

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
    /** Called when the editor receives focus. */
    onFocus?: () => void
    /** Called when the editor loses focus. */
    onBlur?: () => void
}

/**
 * Custom mention node that serializes to a clickable profile link in Markdown.
 * Editing representation stays a styled inline mention; export becomes
 * `[@label](/u/<id>)` so `MarkdownContent` can render it without extra logic.
 */
const ProfileMention = Mention.extend({
    addStorage() {
        return {
            markdown: {
                serialize(state: MarkdownSerializerState, node: ProseMirrorNode) {
                    const id = String(node.attrs.id ?? "")
                    const label = String(node.attrs.label ?? id)
                    state.write(`[@${label}](/u/${id})`)
                },
            },
        }
    },
})

/**
 * Trim trailing whitespace/newlines from a Markdown string exported by Tiptap.
 * @param value - Raw markdown from `editor.storage.markdown.getMarkdown()`.
 * @returns Trimmed markdown string.
 */
const trimMarkdown = (value: string): string => value.replace(/\s+$/g, "")

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
    onFocus,
    onBlur,
    className,
}: RichCommentEditorProps) => {
    const t = useTranslations("communityHub")
    const [internalPending, setInternalPending] = useState(false)
    const isSubmitting = isPending ?? internalPending

    const stickers = useMemo(() => localizeStickers(STICKER_CATALOG, t), [t])

    const handleSubmit = useCallback(async (editor: Editor) => {
        if (disabled || isSubmitting || editor.isEmpty) {
            return
        }
        const body = trimMarkdown((editor.storage as unknown as MarkdownStorage).getMarkdown())
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
        autofocus: autoFocus,
        editable: !disabled,
        extensions: [
            StarterKit.configure({ heading: false }),
            TiptapLink.configure({ openOnClick: false }),
            Underline,
            Placeholder.configure({
                placeholder: placeholder ?? t("engagement.commentPlaceholder"),
            }),
            Image.configure({ inline: true, allowBase64: false }),
            ProfileMention.configure({
                suggestion: mentionSuggestion,
                renderText: ({ node }) => `@${String(node.attrs.label ?? node.attrs.id ?? "")}`,
                renderHTML: ({ node }) => [
                    "span",
                    {
                        "data-type": "mention",
                        "data-id": String(node.attrs.id ?? ""),
                        "data-label": String(node.attrs.label ?? ""),
                        class: "rounded px-1 font-medium text-accent bg-accent/10",
                    },
                    `@${String(node.attrs.label ?? node.attrs.id ?? "")}`,
                ],
            }),
            Markdown.configure({ html: false }),
        ],
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
                    if (editor) {
                        void handleSubmit(editor)
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

    useEffect(() => {
        if (editor && focusTrigger !== undefined) {
            editor.commands.focus("end")
        }
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
