import type { AbstractEntity } from "./abstract"

/** IT recruitment / headhunting company (e.g. Pegasi). */
export interface HeadhuntingCompanyEntity extends AbstractEntity {
    /** Human-facing stable identifier. */
    displayId: string
    /** Company display name. */
    title: string
    /** Optional company description. */
    description?: string | null
    /** Company public website URL. */
    websiteUrl?: string | null
    /** Logo image URL. */
    logoUrl?: string | null
    /** Physical office address. */
    address?: string | null
    /** Contact phone number. */
    phone?: string | null
    /** Contact email address. */
    email?: string | null
    /** Facebook page URL. */
    facebookUrl?: string | null
    /** LinkedIn company page URL. */
    linkedinUrl?: string | null
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
}
