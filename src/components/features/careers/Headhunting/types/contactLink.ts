/** Translation key for a company contact-link label. */
export type HeadhuntingCompanyContactLabelKey =
    | "headhuntings.website"
    | "headhuntings.address"
    | "headhuntings.phone"
    | "headhuntings.email"
    | "headhuntings.linkedin"

/** Optional contact link row on company detail. */
export interface HeadhuntingCompanyContactLink {
    /** Translation key label. */
    labelKey: HeadhuntingCompanyContactLabelKey
    /** Display or href value. */
    value: string
    /** External href when applicable. */
    href?: string
}
