import { RestError, restRequest } from "@/modules/api/rest/client"
import type {
    CareerMyElo,
    CareerSkillCategory,
    CareerSkillGraph,
    CareerSkillProgress,
    CareerUserElo,
    CvProfileView,
    UpsertCvRequest,
} from "./types"

// ---------------- CareerSkillController ----------------

export const getCareerSkills = async (params?: {
    category?: string
    q?: string
}): Promise<CareerSkillGraph> =>
    restRequest<CareerSkillGraph>({
        method: "GET",
        url: "/career/skills",
        params: { ...params },
        // Career endpoints sit behind platform auth (401 PLATFORM_UNAUTHORIZED without a
        // bearer token) — unlike the public courses catalog. Attach the token for reads.
        authenticated: true,
    })

export const getMyCareerSkills = async (): Promise<CareerSkillProgress[]> =>
    restRequest<CareerSkillProgress[]>({
        method: "GET",
        url: "/career/me/skills",
        authenticated: true,
    })

/**
 * Reads the managed skill-category catalogue (change `course-skill-exp`).
 *
 * @returns every category in catalogue order — the buckets of the profile Elo chart.
 */
export const getCareerSkillCategories = async (): Promise<Array<CareerSkillCategory>> =>
    restRequest<Array<CareerSkillCategory>>({
        method: "GET",
        url: "/career/skill-categories",
        authenticated: true,
    })

/** `GET /career/me/elo` — the post-rename path. */
const MY_ELO_PATH = "/career/me/elo"

/**
 * `GET /career/me/skill-exp` — the PRE-RENAME path, kept alive on the backend as a
 * deprecated alias. Only reached by the fallback below; delete both this constant and
 * the fallback once the renamed backend is deployed everywhere.
 */
const MY_ELO_LEGACY_PATH = "/career/me/skill-exp"

/**
 * Reads the CURRENT learner's skill set and their accumulated **Elo** in each bucket.
 *
 * The buckets are their MAJOR's default skill set; categories not earned in yet come
 * back at `0`, so the caller never has to fill gaps itself.
 *
 * DEPLOY ORDER, and why this function is not a one-liner: this app deploys itself
 * through Vercel the moment the branch merges, while the backend is deployed BY HAND.
 * So there is always a window where this build is live and the backend still only
 * serves the old `/career/me/skill-exp`. Calling only the new path in that window
 * answers `404`, which the chart reports as "we could not read your Elo" — the exact
 * shape of the "Could not load the badge list" incident this project already had. So:
 * try the new path, and on `404` ONLY (not 401/403/5xx — those are real answers about
 * permission or breakage and must reach the caller) retry the deprecated alias.
 *
 * WIRE SHAPE: an object since change `default-skills-by-major`; it used to be a bare
 * array, and the legacy alias answers with `totalExp` instead of `totalElo`. The return
 * type keeps every variant, and {@link buildEloChart} reads all of them.
 *
 * @returns the skill-set envelope, or the legacy bare array from an older backend.
 */
export const getMyCareerElo = async (): Promise<
    CareerMyElo | Array<CareerUserElo>
> => {
    try {
        return await restRequest<CareerMyElo | Array<CareerUserElo>>({
            method: "GET",
            url: MY_ELO_PATH,
            authenticated: true,
        })
    } catch (cause) {
        // 404 here means "this backend does not know the new route yet" — anything else
        // (401, 403, 500, network) is an answer about THIS request and must not be retried
        // against a different URL, or the caller would branch on the wrong failure.
        if (!(cause instanceof RestError) || cause.status !== 404) {
            throw cause
        }
        return await restRequest<CareerMyElo | Array<CareerUserElo>>({
            method: "GET",
            url: MY_ELO_LEGACY_PATH,
            authenticated: true,
        })
    }
}

// ---------------- CvProfileController (Harvard CV builder) ----------------

/**
 * The caller's CV, or `null` when they have never built one.
 *
 * `GET /api/v1/career/cv/me` — authenticated. The backend answers `data: null`
 * (envelope code 200) for a first-time user, which {@link restRequest} unwraps to
 * `null`, so the builder shows an empty form rather than erroring.
 */
export const getMyCv = async (): Promise<CvProfileView | null> =>
    restRequest<CvProfileView | null>({
        method: "GET",
        url: "/career/cv/me",
        authenticated: true,
    })

/**
 * Upserts the caller's CV (create on first save, update thereafter — one CV/user).
 *
 * `PUT /api/v1/career/cv/me`. The backend validates `sections` against the Harvard
 * shape and a 64KB cap, rejecting violations with 400 `CV_PROFILE_INVALID`.
 */
export const putMyCv = async (request: UpsertCvRequest): Promise<CvProfileView> =>
    restRequest<CvProfileView>({
        method: "PUT",
        url: "/career/cv/me",
        data: request,
    })

/**
 * A CV by id, owner-only.
 *
 * `GET /api/v1/career/cv/{id}` — 404 `CV_PROFILE_NOT_FOUND` both when the id does
 * not exist and when it belongs to another user (existence is not leaked).
 */
export const getCv = async (id: string): Promise<CvProfileView> =>
    restRequest<CvProfileView>({
        method: "GET",
        url: `/career/cv/${id}`,
        authenticated: true,
    })
