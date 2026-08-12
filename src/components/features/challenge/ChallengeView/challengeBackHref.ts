/**
 * Subject codes as the workspace routes spell them (`/subjects/CSD201/practice`).
 * Anything else in `?subject=` is DROPPED rather than trusted: the value decides where
 * a link sends the reader, and a hand-edited one must not be able to point that link
 * off the practice tab — or off the site.
 */
const SUBJECT_CODE = /^[A-Za-z0-9_-]{1,32}$/

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
export const challengeBackHref = (subjectParam: string | null): string =>
    subjectParam && SUBJECT_CODE.test(subjectParam)
        ? `/subjects/${subjectParam}/practice`
        : "/challenges"
