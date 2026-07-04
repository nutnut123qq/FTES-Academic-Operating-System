/**
 * Structured legal-document model — rendered natively with Typography (NO markdown).
 * A document is a lead paragraph + numbered sections; each section may mix paragraphs,
 * a bullet list, a callout, a definitions glossary, a card grid, numbered steps, a
 * contact block, and nested subsections. Every block is optional — a section renders
 * only what it declares.
 */

/** One bullet in a section list. */
export interface LegalListItem {
    /** Optional bold lead label rendered before {@link text} (e.g. "Thông tin tài khoản:"). */
    label?: string
    /** The item body text (plain — no markdown). */
    text: string
}

/** Semantic tone of a section callout (maps to the shared `Callout` block status). */
export type LegalCalloutTone = "warning" | "accent" | "default"

/** A tinted notice strip inside a section (e.g. "Thông báo quan trọng"). */
export interface LegalCallout {
    /** Tone → tint/icon colour. Default `"warning"`. */
    tone?: LegalCalloutTone
    /** Headline line. */
    title: string
    /** Supporting body text. */
    text: string
}

/** One glossary entry: a term, its definition, and an optional illustrative example. */
export interface LegalDefinition {
    /** The term being defined (bold lead). */
    term: string
    /** The definition body (plain text). */
    definition: string
    /** Optional example line rendered muted/italic under the definition. */
    example?: string
}

/** One card in a section card grid (payment method / info category / user right). */
export interface LegalCard {
    /** Icon key mapped to a Phosphor icon in the renderer (e.g. "qr", "wallet"). Optional. */
    icon?: string
    /** Card title. */
    label: string
    /** Card body text. */
    text: string
}

/** Company contact panel rendered at the foot of a document. */
export interface LegalContact {
    /** Legal company name. */
    company: string
    /** Postal address. */
    address: string
    /** Contact phone (may include a contact name). */
    phone: string
}

/** One numbered section of a legal document. Blocks are independent and optional. */
export interface LegalSection {
    /** Heading including its number, e.g. "1. Dữ liệu chúng tôi thu thập". */
    heading: string
    /** Body paragraphs (plain text). */
    paragraphs?: string[]
    /** Bullet list items, each an optional bold label + text. */
    items?: LegalListItem[]
    /** A tinted notice strip. */
    callout?: LegalCallout
    /** A term/definition glossary. */
    definitions?: LegalDefinition[]
    /** A responsive card grid. */
    cards?: LegalCard[]
    /** An ordered list, each rendered with a number badge. */
    steps?: string[]
    /** A company contact panel. */
    contact?: LegalContact
    /** Nested subsections (rendered with a smaller heading). Depth 1 in practice. */
    subsections?: LegalSection[]
}

/** A full legal document (privacy / terms) for one locale. */
export interface LegalDocument {
    /** Lead paragraph above the numbered sections. */
    intro: string
    /** Numbered sections in order. */
    sections: LegalSection[]
}
