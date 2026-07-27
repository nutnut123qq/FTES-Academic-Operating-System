"use client"

import StarterKit from "@tiptap/starter-kit"
import TiptapLink from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import Placeholder from "@tiptap/extension-placeholder"
import Image from "@tiptap/extension-image"
import Mention from "@tiptap/extension-mention"
import { Markdown, type MarkdownStorage } from "tiptap-markdown"
import type { MarkdownSerializerState } from "prosemirror-markdown"
import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import type { Editor, Extensions } from "@tiptap/react"
import { mentionSuggestion } from "./mention-suggestion"

/**
 * Custom mention node that serializes to a clickable profile link in Markdown.
 * Editing representation stays a styled inline mention; export becomes
 * `[@label](/u/<id>)` so `MarkdownContent` can render it without extra logic.
 *
 * Shared base node — every rich composer (comment editor + body editor) reuses it
 * so the `@mention` typeahead + serialization behave identically everywhere.
 */
export const ProfileMention = Mention.extend({
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

/** Options for {@link buildEditorExtensions}. */
export interface BuildEditorExtensionsOptions {
    /** Placeholder shown when the editor is empty. */
    placeholder?: string
    /**
     * Enable the H2/H3 heading levels (the "full" body toolbar). Comment-scope
     * editors pass `false` so headings never leak into a short comment.
     */
    headings?: boolean
}

/**
 * Assembles the shared Tiptap extension list used by BOTH the comment editor
 * ({@link RichCommentEditor}) and the general body editor ({@link RichTextEditor}):
 * StarterKit (headings off unless requested) + link + underline + placeholder +
 * inline image + the {@link ProfileMention} node + `tiptap-markdown` so every
 * composer reads and writes Markdown.
 *
 * @param options - {@link BuildEditorExtensionsOptions}
 * @returns the Tiptap extension array for `useEditor({ extensions })`.
 */
export const buildEditorExtensions = ({
    placeholder = "",
    headings = false,
}: BuildEditorExtensionsOptions = {}): Extensions => [
    StarterKit.configure({ heading: headings ? { levels: [2, 3] } : false }),
    TiptapLink.configure({ openOnClick: false }),
    Underline,
    Placeholder.configure({ placeholder }),
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
]

/**
 * Reads the current document as Markdown from a Tiptap editor. Reaches into
 * `editor.storage.markdown.getMarkdown()` (installed by the `tiptap-markdown`
 * extension) with a narrow cast, since the storage type is not surfaced on the
 * public `Editor` type.
 *
 * @param editor - the live Tiptap editor.
 * @returns the serialized Markdown (untrimmed).
 */
export const getEditorMarkdown = (editor: Editor): string =>
    (editor.storage as unknown as { markdown: MarkdownStorage }).markdown.getMarkdown()

/**
 * Trims trailing whitespace/newlines from Markdown exported by Tiptap so an
 * "empty" editor serializes to `""` and drafts compare cleanly.
 * @param value - raw markdown from {@link getEditorMarkdown}.
 */
export const trimMarkdown = (value: string): string => value.replace(/\s+$/g, "")
