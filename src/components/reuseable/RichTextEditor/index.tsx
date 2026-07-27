"use client"

import React, { useCallback, useEffect, useRef } from "react"
import { Button, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import {
    Code as CodeIcon,
    CodeBlock as CodeBlockIcon,
    Image as ImageIcon,
    Link as LinkIcon,
    ListBullets as BulletListIcon,
    ListNumbers as OrderedListIcon,
    Quotes as BlockquoteIcon,
    TextB as BoldIcon,
    TextHTwo as HeadingTwoIcon,
    TextHThree as HeadingThreeIcon,
    TextItalic as ItalicIcon,
    TextStrikethrough as StrikethroughIcon,
    TextUnderline as UnderlineIcon,
} from "@phosphor-icons/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { uploadCommunityMedia } from "@/modules/api/rest/community"
import { buildEditorExtensions, getEditorMarkdown, trimMarkdown } from "./extensions"

/** Which toolbar a {@link RichTextEditor} shows. */
export type RichTextToolbar = "comment" | "full"

/** Props for {@link RichTextEditor}. */
export interface RichTextEditorProps extends WithClassNames<undefined> {
    /** Current value as Markdown (controlled). */
    value: string
    /** Called with the serialized Markdown on every edit. */
    onChange: (markdown: string) => void
    /** Placeholder shown when the editor is empty. */
    placeholder?: string
    /**
     * Minimum height (px) of the writing area. Defaults to a compact height for
     * the `"comment"` toolbar and a taller body height for `"full"`.
     */
    minHeight?: number
    /**
     * `"comment"` — inline formatting only (bold/italic/underline/strike/link/
     * lists/quote/code). `"full"` — adds H2/H3 headings and an image button.
     * Defaults to `"comment"`.
     */
    toolbar?: RichTextToolbar
    /**
     * Uploads a picked image and resolves its URL (inserted as `![alt](url)`).
     * Defaults to {@link uploadCommunityMedia} → the community media endpoint.
     * Only used by the `"full"` toolbar.
     */
    onUploadImage?: (file: File) => Promise<string>
    /** Focus the editor on mount. */
    autoFocus?: boolean
    /** Disable editing. */
    disabled?: boolean
    /** Accessible label for the editing region (falls back to the placeholder). */
    ariaLabel?: string
}

/**
 * A CONTROLLED, presentational rich-text editor built on Tiptap that reads and
 * writes Markdown (via `tiptap-markdown`). It shares its extension list with the
 * comment editor through {@link buildEditorExtensions}, so `@mention`, links,
 * lists, quotes and inline code behave identically across every composer.
 *
 * Value flow: the initial `value` seeds the document (parsed as Markdown); each
 * edit fires `onChange(markdown)`; an EXTERNAL `value` change (a parent reset to
 * `""`, or seeding an edit form) is synced back into the editor without
 * re-emitting `onChange`. Because both sides serialize through the same helper,
 * ordinary typing never triggers a re-sync (no cursor jump).
 *
 * Presentational only — no submit button, no data fetching beyond the optional
 * image upload; the parent owns the draft, submit and gating.
 *
 * @param props - {@link RichTextEditorProps}
 */
export const RichTextEditor = ({
    value,
    onChange,
    placeholder,
    minHeight,
    toolbar = "comment",
    onUploadImage,
    autoFocus,
    disabled,
    ariaLabel,
    className,
}: RichTextEditorProps) => {
    const t = useTranslations("richEditor")
    const isFull = toolbar === "full"
    const resolvedMinHeight = minHeight ?? (isFull ? 160 : 36)

    // Always call the LATEST onChange from the (creation-time) onUpdate closure.
    const onChangeRef = useRef(onChange)
    onChangeRef.current = onChange
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    const editor = useEditor({
        immediatelyRender: false,
        // tiptap v3 defaults this to false → toolbar `isActive` reads stale editor
        // state; true restores v2 per-transaction re-render for the toolbar.
        shouldRerenderOnTransaction: true,
        autofocus: autoFocus,
        editable: !disabled,
        extensions: buildEditorExtensions({
            placeholder: placeholder ?? "",
            headings: isFull,
        }),
        // Seeded once; `tiptap-markdown` parses this Markdown string into the doc.
        content: value,
        editorProps: {
            attributes: {
                class: cn(
                    "prose prose-sm max-w-none overflow-y-auto bg-transparent text-sm text-foreground outline-none",
                    "prose-p:my-0 prose-ul:my-0 prose-ol:my-0 prose-blockquote:my-0 prose-headings:mb-1 prose-headings:mt-2",
                    "empty:before:text-muted empty:before:content-[attr(data-placeholder)] empty:before:pointer-events-none",
                ) ?? "",
                style: `min-height:${resolvedMinHeight}px;max-height:24rem`,
                ...(ariaLabel || placeholder
                    ? { "aria-label": ariaLabel ?? placeholder ?? "" }
                    : {}),
            },
        },
        onUpdate: ({ editor: current }) => {
            onChangeRef.current(trimMarkdown(getEditorMarkdown(current)))
        },
    })

    // Sync EXTERNAL value changes into the editor (reset to "", edit-form seeding).
    // Ordinary typing keeps `value` equal to the serialized doc, so this is a no-op
    // then — the guard prevents a re-set (and the cursor jump it would cause).
    useEffect(() => {
        if (!editor) {
            return
        }
        const current = trimMarkdown(getEditorMarkdown(editor))
        if (value !== current) {
            editor.commands.setContent(value, { emitUpdate: false })
        }
    }, [value, editor])

    // Keep `editable` in sync with the disabled prop.
    useEffect(() => {
        editor?.setEditable(!disabled)
    }, [editor, disabled])

    const upload = onUploadImage ?? (async (file: File) => (await uploadCommunityMedia(file)).secureUrl)

    const onPickImage = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0]
            // reset so re-picking the same file fires change again
            event.target.value = ""
            if (!file || !editor) {
                return
            }
            try {
                const url = await upload(file)
                editor.chain().focus().setImage({ src: url, alt: t("imageAlt") }).run()
            } catch {
                // Presentational: surface upload failures through the console; the
                // parent can wrap `onUploadImage` to toast if it wants to.
                // eslint-disable-next-line no-console
                console.error("RichTextEditor: image upload failed")
            }
        },
        [editor, upload, t],
    )

    const toolbarButton = useCallback(
        (
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
        ),
        [],
    )

    if (!editor) {
        return null
    }

    return (
        <div
            className={cn(
                "flex flex-col gap-2 rounded-2xl border border-separator bg-surface px-3 py-2 focus-within:border-accent",
                disabled && "opacity-60",
                className,
            )}
        >
            <EditorContent editor={editor} />
            <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
                {isFull
                    ? (
                        <>
                            {toolbarButton(
                                t("heading2"),
                                <HeadingTwoIcon aria-hidden focusable="false" className="size-4" />,
                                () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
                                editor.isActive("heading", { level: 2 }),
                            )}
                            {toolbarButton(
                                t("heading3"),
                                <HeadingThreeIcon aria-hidden focusable="false" className="size-4" />,
                                () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
                                editor.isActive("heading", { level: 3 }),
                            )}
                            <span className="mx-1 h-5 w-px bg-default" aria-hidden />
                        </>
                    )
                    : null}
                {toolbarButton(
                    t("bold"),
                    <BoldIcon aria-hidden focusable="false" className="size-4" />,
                    () => editor.chain().focus().toggleBold().run(),
                    editor.isActive("bold"),
                )}
                {toolbarButton(
                    t("italic"),
                    <ItalicIcon aria-hidden focusable="false" className="size-4" />,
                    () => editor.chain().focus().toggleItalic().run(),
                    editor.isActive("italic"),
                )}
                {toolbarButton(
                    t("underline"),
                    <UnderlineIcon aria-hidden focusable="false" className="size-4" />,
                    () => editor.chain().focus().toggleUnderline().run(),
                    editor.isActive("underline"),
                )}
                {toolbarButton(
                    t("strikethrough"),
                    <StrikethroughIcon aria-hidden focusable="false" className="size-4" />,
                    () => editor.chain().focus().toggleStrike().run(),
                    editor.isActive("strike"),
                )}
                {toolbarButton(
                    t("link"),
                    <LinkIcon aria-hidden focusable="false" className="size-4" />,
                    () => {
                        if (editor.isActive("link")) {
                            editor.chain().focus().unsetLink().run()
                            return
                        }
                        const url = window.prompt(t("addLink"))
                        if (url && url.trim()) {
                            editor.chain().focus().setLink({ href: url.trim() }).run()
                        }
                    },
                    editor.isActive("link"),
                )}
                {toolbarButton(
                    t("bulletList"),
                    <BulletListIcon aria-hidden focusable="false" className="size-4" />,
                    () => editor.chain().focus().toggleBulletList().run(),
                    editor.isActive("bulletList"),
                )}
                {toolbarButton(
                    t("orderedList"),
                    <OrderedListIcon aria-hidden focusable="false" className="size-4" />,
                    () => editor.chain().focus().toggleOrderedList().run(),
                    editor.isActive("orderedList"),
                )}
                {toolbarButton(
                    t("blockquote"),
                    <BlockquoteIcon aria-hidden focusable="false" className="size-4" />,
                    () => editor.chain().focus().toggleBlockquote().run(),
                    editor.isActive("blockquote"),
                )}
                {toolbarButton(
                    t("codeInline"),
                    <CodeIcon aria-hidden focusable="false" className="size-4" />,
                    () => editor.chain().focus().toggleCode().run(),
                    editor.isActive("code"),
                )}
                {toolbarButton(
                    t("codeBlock"),
                    <CodeBlockIcon aria-hidden focusable="false" className="size-4" />,
                    () => editor.chain().focus().toggleCodeBlock().run(),
                    editor.isActive("codeBlock"),
                )}
                {isFull
                    ? (
                        <>
                            <span className="mx-1 h-5 w-px bg-default" aria-hidden />
                            {toolbarButton(
                                t("image"),
                                <ImageIcon aria-hidden focusable="false" className="size-4" />,
                                () => fileInputRef.current?.click(),
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/gif"
                                className="hidden"
                                onChange={(event) => void onPickImage(event)}
                            />
                        </>
                    )
                    : null}
            </div>
        </div>
    )
}
