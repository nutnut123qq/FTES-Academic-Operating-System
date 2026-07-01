/**
 * Structured legal-document model — rendered natively with Typography (NO markdown).
 * A document is a lead paragraph + numbered sections; each section is paragraphs and/or
 * a bullet list whose items may carry a bold lead label.
 */

/** One bullet in a section list. */
export interface LegalListItem {
    /** Optional bold lead label rendered before {@link text} (e.g. "Thông tin tài khoản:"). */
    label?: string
    /** The item body text (plain — no markdown). */
    text: string
}

/** One numbered section of a legal document. */
export interface LegalSection {
    /** Heading including its number, e.g. "1. Dữ liệu chúng tôi thu thập". */
    heading: string
    /** Body paragraphs (plain text). */
    paragraphs?: string[]
    /** Bullet list items, each an optional bold label + text. */
    items?: LegalListItem[]
}

/** A full legal document (privacy / terms) for one locale. */
export interface LegalDocument {
    /** Lead paragraph above the numbered sections. */
    intro: string
    /** Numbered sections in order. */
    sections: LegalSection[]
}
