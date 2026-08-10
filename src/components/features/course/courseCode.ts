/**
 * Human course-code kicker from the BE `courseCode`. Package-sale courses carry an
 * internal package suffix (e.g. `MAE101_PACKAGE_MAIN`, `PRF192_PACKAGE_MAIN`) that must
 * never reach the UI — strip a trailing `_PACKAGE…` segment down to the plain subject
 * code (`MAE101`). A non-package code passes through unchanged. Returns "" when nothing
 * meaningful remains, so callers can hide the kicker.
 */
export const displayCourseCode = (code: string | null | undefined): string => {
    const trimmed = (code ?? "").trim()
    const packageAt = trimmed.toUpperCase().indexOf("_PACKAGE")
    return (packageAt > 0 ? trimmed.slice(0, packageAt) : trimmed).trim()
}
