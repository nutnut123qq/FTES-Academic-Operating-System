/** Localize the shared SP/SU/FA academic-term names returned by the backend. */
export const localizeTermName = (
    locale: string,
    name: string | null | undefined,
    code?: string | null,
): string | null => {
    const trimmedName = name?.trim()
    const trimmedCode = code?.trim()
    const codeLabel = trimmedCode
        ? (/^T-(.+)-[0-9a-f]{8}$/.exec(trimmedCode)?.[1] ?? trimmedCode)
        : null
    const codeTerm = codeLabel ? /^(SP|SU|FA)(\d{2}|\d{4})$/i.exec(codeLabel) : null
    const nameTerm = trimmedName
        ? /(spring|xuân|summer|hè|fall|autumn|thu)\s+(\d{4})/iu.exec(trimmedName)
        : null
    const words: Record<string, "SP" | "SU" | "FA"> = {
        spring: "SP",
        "xuân": "SP",
        summer: "SU",
        "hè": "SU",
        fall: "FA",
        autumn: "FA",
        thu: "FA",
    }
    const term = (codeTerm?.[1].toUpperCase() as "SP" | "SU" | "FA" | undefined)
        ?? (nameTerm ? words[nameTerm[1].toLowerCase()] : undefined)
    const rawYear = codeTerm?.[2] ?? nameTerm?.[2]

    if (term && rawYear) {
        const year = rawYear.length === 2 ? `20${rawYear}` : rawYear
        const labels = locale.startsWith("vi")
            ? { SP: "Kỳ Xuân", SU: "Kỳ Hè", FA: "Kỳ Thu" }
            : { SP: "Spring", SU: "Summer", FA: "Fall" }
        return `${labels[term]} ${year}`
    }
    return trimmedName || codeLabel
}
