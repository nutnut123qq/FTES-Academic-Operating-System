import type { HeadhuntingCompanyContactLink } from "../types"
import type { HeadhuntingCompanyEntity } from "@/modules/types/entities/headhunting-company"

/**
 * Builds contact rows from a headhunting company entity.
 * @param company - The company entity, or undefined while loading.
 * @returns Ordered contact link rows present on the company.
 */
export const buildHeadhuntingCompanyContactLinks = (
    company: HeadhuntingCompanyEntity | undefined,
): Array<HeadhuntingCompanyContactLink> => {
    if (!company) {
        return []
    }

    const rows: Array<HeadhuntingCompanyContactLink> = []

    if (company.websiteUrl) {
        rows.push({
            labelKey: "headhuntings.website",
            value: company.websiteUrl,
            href: company.websiteUrl,
        })
    }
    if (company.address) {
        rows.push({
            labelKey: "headhuntings.address",
            value: company.address,
        })
    }
    if (company.phone) {
        rows.push({
            labelKey: "headhuntings.phone",
            value: company.phone,
        })
    }
    if (company.email) {
        rows.push({
            labelKey: "headhuntings.email",
            value: company.email,
            href: `mailto:${company.email}`,
        })
    }
    if (company.linkedinUrl) {
        rows.push({
            labelKey: "headhuntings.linkedin",
            value: company.linkedinUrl,
            href: company.linkedinUrl,
        })
    }

    return rows
}
