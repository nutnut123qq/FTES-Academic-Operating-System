import type { SubjectCourseLink } from "../hooks/useQuerySubjectSwr"

/** Display identity of a linked course on the Overview link-out card. */
export interface CourseIdentity {
    /** Course code shown as the mark (e.g. `PRF192`), or `null` when the title carries none. */
    code: string | null
    /** Human course name. */
    name: string
}

/**
 * A curated link title that opens with a course code — `PRF192`, `PRF192 - Lập trình C`,
 * `CSD201: Cấu trúc dữ liệu`. Everything after the separator is the human name.
 */
const CODE_PREFIX = /^\s*([A-Za-z]{2,5}\d{2,4})\s*(?:[-–—·:|]\s*)?(.*)$/

/**
 * Resolves the display identity (code + name) of a linked course from the workspace
 * `learning` link. The card is a link-out only — the Course module owns course data —
 * so the identity is derived from the curated link title (`titleOverride` → source
 * title) rather than fetched.
 *
 * @param link - a `COURSE` link item from `Subject.courseLinks`.
 * @returns the code (when the title carries one) and the human name; the raw link
 * title is used as the name when it has no code prefix, and the id is the last resort
 * for a link the BE could not title at all.
 */
export const getCourseIdentity = (link: SubjectCourseLink): CourseIdentity => {
    const title = link.title.trim()
    if (!title) {
        return { code: null, name: link.id }
    }
    const match = CODE_PREFIX.exec(title)
    if (!match) {
        return { code: null, name: title }
    }
    const [, code, rest] = match
    const name = rest.trim()
    return { code: code.toUpperCase(), name: name || code.toUpperCase() }
}
