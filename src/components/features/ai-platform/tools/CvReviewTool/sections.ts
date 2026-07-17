import type {
    CvAwardItem,
    CvEducationItem,
    CvExperienceItem,
    CvHeaderLink,
    CvProjectItem,
    CvSections,
    CvSkillGroup,
} from "@/modules/api/rest/career"

/**
 * Pure helpers for the Harvard CV builder — an empty CV, repeater-row factories,
 * multiline ⇆ list conversion for bullet fields, and header validation. Kept free
 * of React so the shapes can be unit-tested and the fixtures reused (tasks 4.2/4.5).
 */

/** An empty CV — a header with no links and every repeater section empty. */
export const emptyCvSections = (): CvSections => ({
    header: { fullName: "", email: "", phone: "", location: "", links: [] },
    summary: "",
    education: [],
    experience: [],
    projects: [],
    skills: [],
    awards: [],
})

/** A blank header link row. */
export const emptyCvLink = (): CvHeaderLink => ({ label: "", url: "" })

/** A blank education row. */
export const emptyEducation = (): CvEducationItem => ({
    school: "",
    degree: "",
    major: "",
    start: "",
    end: "",
    gpa: "",
    highlights: [],
})

/** A blank experience row. */
export const emptyExperience = (): CvExperienceItem => ({
    company: "",
    title: "",
    start: "",
    end: "",
    bullets: [],
})

/** A blank project row. */
export const emptyProject = (): CvProjectItem => ({
    name: "",
    role: "",
    tech: [],
    bullets: [],
    link: "",
})

/** A blank skill-group row. */
export const emptySkillGroup = (): CvSkillGroup => ({ group: "", items: [] })

/** A blank award row. */
export const emptyAward = (): CvAwardItem => ({ name: "", by: "", year: "" })

/**
 * Splits a multiline textarea value into a trimmed list, dropping blank lines.
 * The bullet/highlight/tech/skill list fields are edited as one-item-per-line text.
 */
export const linesToList = (text: string): string[] =>
    text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

/** Joins a list back into a multiline value for the textarea. */
export const listToLines = (list: string[] | undefined): string =>
    (list ?? []).join("\n")

/** Whether a string is present and non-blank. */
const filled = (value: string | undefined): boolean => !!value && value.trim().length > 0

/** A minimal email shape check (the BE does no format check — this is a UX guard). */
export const isEmailLike = (value: string | undefined): boolean =>
    !!value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

/** The two required header fields, keyed for i18n error messages. */
export type CvHeaderErrorField = "fullName" | "email"

/**
 * Validates the header: `fullName` required, `email` required AND email-shaped.
 * Returns the set of offending fields (empty ⇒ valid) so the form can flag each
 * input and block save/review (spec: "bắt buộc header.fullName, email").
 */
export const cvHeaderErrors = (sections: CvSections): CvHeaderErrorField[] => {
    const header = sections.header ?? {}
    const errors: CvHeaderErrorField[] = []
    if (!filled(header.fullName)) errors.push("fullName")
    if (!isEmailLike(header.email)) errors.push("email")
    return errors
}

/** True when the header passes validation (ready to save / review). */
export const isCvHeaderValid = (sections: CvSections): boolean =>
    cvHeaderErrors(sections).length === 0
