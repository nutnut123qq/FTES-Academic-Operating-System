/**
 * Human course-code kicker from the BE `courseCode`.
 *
 * Package-sale courses carry an INTERNAL package code (e.g. `MAE101_PACKAGE_MAIN`,
 * `JPD311_PACKAGE_MAIN`) whose subject base need NOT match the course the card actually
 * shows — a `JPD311_PACKAGE_MAIN` package can present a "JPD113 - …" course — so it is
 * never a trustworthy user-facing subject code. Any code carrying the `_PACKAGE` marker
 * is therefore hidden entirely (return ""), rather than shown or half-stripped to a base
 * that could contradict the title. A plain course code passes through unchanged.
 */
export const displayCourseCode = (code: string | null | undefined): string => {
    const trimmed = (code ?? "").trim()
    if (trimmed.toUpperCase().includes("_PACKAGE")) {
        return ""
    }
    return trimmed
}
