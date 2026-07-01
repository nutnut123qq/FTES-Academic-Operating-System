/**
 * Kind of resource a foundation item represents (matches API `FoundationKind`).
 */
export enum FoundationKind {
    /** An external hyperlink (e.g. official docs, article). */
    ExternalLink = "external_link",
    /** An embedded or linked video resource. */
    Video = "video",
    /** A document or written guide. */
    Document = "document",
}
