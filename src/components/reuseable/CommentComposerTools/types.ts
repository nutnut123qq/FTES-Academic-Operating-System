/** A sticker the user can attach to a comment. */
export interface Sticker {
    /** Stable identifier (also the i18n key suffix). */
    id: string
    /** Public asset filename under `/stickers/`. */
    file: string
    /** Localized display label / alt text. */
    label: string
}
