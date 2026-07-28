import { FileTextIcon, PaperclipIcon, PlayCircleIcon } from "@phosphor-icons/react"
import type { Icon } from "@phosphor-icons/react"

/**
 * Canonical content kind a lesson resolves to for its content-map glyph. The BE
 * curriculum carries the raw spelling on `LessonView.type` (today "VIDEO" | "DOCUMENT");
 * this collapses the raw strings into one vocabulary so the row icon never keys off a
 * divergent spelling. `material` is forward-compat: it lights up the moment the BE
 * emits a resource/file lesson type — no tree change needed here.
 */
export type LessonContentKind = "video" | "document" | "material" | "unknown"

/**
 * Unifies the BE lesson content-type spellings into one {@link LessonContentKind}.
 * Case / separator insensitive (`RESOURCE`, `resource-link`, `SOURCE_CODE` all fold
 * alike). Today the curriculum only sends "VIDEO" | "DOCUMENT"; the `material` bucket
 * (resources / attachments / slide decks / files) is recognised so a future
 * resource-lesson type gets its own glyph without touching callers. Unknown / empty
 * falls through to `unknown` (the caller keeps the neutral default glyph).
 */
export const normalizeLessonType = (raw: string | null | undefined): LessonContentKind => {
    switch ((raw ?? "").toUpperCase().replace(/[\s_-]/g, "")) {
    case "VIDEO":
        return "video"
    case "DOCUMENT":
    case "DOC":
    case "ARTICLE":
    case "READING":
    case "TEXT":
        return "document"
    case "MATERIAL":
    case "MATERIALS":
    case "RESOURCE":
    case "RESOURCELINK":
    case "ATTACHMENT":
    case "FILE":
    case "LINK":
    case "PDF":
    case "SLIDE":
    case "SLIDES":
    case "SOURCECODE":
        return "material"
    default:
        return "unknown"
    }
}

/**
 * Phosphor icon for a lesson content-type — the per-type glyph shown on the
 * content-map / syllabus lesson row (a VIDEO row and a DOCUMENT row must never share
 * one icon). VIDEO → play, DOCUMENT (written lesson) → document sheet, materials /
 * resources → paperclip. Unknown / empty keeps the play glyph (the historical default).
 */
export const lessonTypeIcon = (raw: string | null | undefined): Icon => {
    switch (normalizeLessonType(raw)) {
    case "document":
        return FileTextIcon
    case "material":
        return PaperclipIcon
    case "video":
    default:
        return PlayCircleIcon
    }
}
