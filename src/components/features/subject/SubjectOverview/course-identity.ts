/** Display identity of a linked course on the Overview link-out card. */
export interface CourseIdentity {
    /** Course code shown as the mark, e.g. `PRF192`. */
    code: string
    /** Human course name. */
    name: string
}

// ponytail: mock BE — the card is a link-out only, so no course query is wired here
// (the Course module owns course data). Known mock course ids (see the subject mocks'
// `courseIds`) map to a display identity; unknown ids fall back to a derived code.
const COURSE_IDENTITY_MOCK: Record<string, CourseIdentity> = {
    "prf192-course": { code: "PRF192", name: "Lập trình C" },
    "csd201-course": { code: "CSD201", name: "Cấu trúc dữ liệu & Giải thuật" },
    "prj301-course": { code: "PRJ301", name: "Lập trình Java Web" },
    "dbi202-course": { code: "DBI202", name: "Cơ sở dữ liệu" },
    "net1704-course": { code: "NET1704", name: "Mạng máy tính" },
}

/**
 * Resolves the display identity (code + name) of a linked course id for the
 * "Khóa học của môn này" card.
 *
 * @param courseId - a course id from `Subject.courseIds`.
 * @returns the mock identity, or a code derived from the id when unknown.
 */
export const getCourseIdentity = (courseId: string): CourseIdentity =>
    COURSE_IDENTITY_MOCK[courseId] ?? {
        code: courseId.replace(/-course$/, "").toUpperCase(),
        name: courseId,
    }
