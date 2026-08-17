/**
 * Subject codes as the workspace routes spell them (`/subjects/CSD201/practice`).
 * Anything else in `?subject=` is DROPPED rather than trusted: the value decides where
 * a link sends the reader, and a hand-edited one must not be able to point that link
 * off the practice tab — or off the site.
 */
const SUBJECT_CODE = /^[A-Za-z0-9_-]{1,32}$/

/**
 * The subject workspace a challenge was opened FROM, or `null` when there is none to
 * trust — the same untrusted-input rule {@link challengeBackHref} applies, exposed on
 * its own because the code is also what mounts the workspace rail around the page
 * (`SubjectWorkspaceShell` is keyed by the very segment `/subjects/<code>` uses).
 *
 * @param subjectParam - Raw `?subject=` value, or null when absent.
 * @returns The subject code, or `null`.
 */
export const challengeSubjectCode = (subjectParam: string | null): string | null =>
    subjectParam && SUBJECT_CODE.test(subjectParam) ? subjectParam : null

/**
 * Where "back" goes from a challenge solve page.
 *
 * A challenge reached from a subject's practice tab must return THERE. The challenge
 * knows its subject only as a UUID while that route is keyed by the subject CODE, so
 * the code rides along in `?subject=`. Reached any other way — the global catalogue, a
 * shared link, an old bookmark — there is no code to trust, and the catalogue is the
 * honest destination rather than a guess.
 *
 * @param subjectParam - Raw `?subject=` value, or null when absent.
 * @returns Href for the back link.
 */
export const challengeBackHref = (subjectParam: string | null): string => {
    // ponytail: one gate for both callers — the back link and the workspace rail must
    // agree on what counts as a subject, so they read the SAME answer.
    const code = challengeSubjectCode(subjectParam)
    return code ? `/subjects/${code}/practice` : "/challenges"
}
