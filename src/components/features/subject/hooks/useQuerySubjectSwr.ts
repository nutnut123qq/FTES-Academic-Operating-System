"use client"

import useSWR from "swr"
import { gql, type DocumentNode } from "@apollo/client"
import { createAuthApolloClient } from "@/modules/api/graphql/clients"
import { restRequest } from "@/modules/api/rest/client"
import { getSubjectDetail } from "@/modules/api/rest/subject"
import type {
    CallerMembership,
    LinkItem,
    SubjectDetail,
    SubjectSummary,
    WorkspaceView,
} from "@/modules/api/rest/subject"
import { useAppSelector } from "@/redux/hooks"

/** A Course-module course linked to the subject (workspace `learning.links`, link-out only). */
export interface SubjectCourseLink {
    /** Course id — the `/courses/[courseId]` segment (BE `LinkItem.targetId`). */
    id: string
    /** Curated title (link `titleOverride` → source title), may be empty when the BE has none. */
    title: string
    /** Whether the curator pinned this link (pinned links sort first). */
    pinned: boolean
}

/** Viewer-scoped facts merged onto the subject identity (all from auth-scoped reads). */
export interface SubjectViewerContext {
    /** Caller membership from `GET /subjects/{code}/workspace`, `null` when not a member. */
    membership?: CallerMembership | null
    /** Linked courses from the workspace `learning` tab. */
    courseLinks?: Array<SubjectCourseLink>
    /** Completion percent 0..100 from GraphQL `subjectMastery`, `null` when unavailable. */
    progress?: number | null
}

/** A subject workspace's identity, mapped from the real BE subject module. */
export interface Subject {
    /**
     * Route id (`[subjectId]`). The BE keys detail/workspace on the **course code**
     * (uuid → 404), so the id carried by every card + link is the code (`PRF192`).
     */
    id: string
    /**
     * Real subject UUID. The REST detail/workspace endpoints key on the code, but the
     * GraphQL `subjectWorkspace(subjectId: ID!)` / `subjectMastery(subjectId: ID!)` ops
     * require the UUID (a code inlined there 500s "Internal error"), so the discussion
     * feed and the mastery meter read this instead of `id`.
     */
    uuid: string
    /** Course code shown as the mark, e.g. `PRF192`. */
    code: string
    /** Human name — prefers the Vietnamese title (`nameVi`) for the VN UI. */
    name: string
    /** Credit count. */
    credits: number
    /** FE difficulty facet, bucketed from the BE `Difficulty` enum. */
    difficulty: "basic" | "intermediate" | "advanced"
    /**
     * Completion percent 0..100, or `null` when no per-user progress is available.
     * Real source: GraphQL `subjectMastery(userId, subjectId).completionPct` (already
     * 0..100, clamped BE-side). `null` for a guest, for a viewer with no mastery row
     * yet, or when the op errors — the header meter stays hidden rather than showing
     * a fabricated figure.
     */
    progress: number | null
    /**
     * Cover/identity image, or `null` when the subject has no artwork. Every seeded
     * subject has `thumbnailUrl: null` today, so this exercises the initials-badge
     * fallback. Wire the host into `next.config` `images.remotePatterns` if the BE
     * ever serves remote thumbnails.
     */
    imageUrl: string | null
    /**
     * Courses linked to this subject (link-out only), read from the workspace
     * `learning` tab (`targetType = COURSE`). Empty when the aggregate has no
     * course link — the Overview link-out card then renders nothing.
     */
    courseLinks: Array<SubjectCourseLink>
    /**
     * Whether the viewer is a member of this workspace. Real source: the workspace
     * aggregate's `callerMembership` (null for a guest / non-member), which is why
     * the workspace read must carry the Bearer token even though the endpoint is public.
     */
    isMember: boolean
    /** Membership role (`MEMBER` / `MODERATOR` / …) when a member, else `null`. */
    membershipRole: string | null
}

/** Maps the BE `Difficulty` enum (EASY|MEDIUM|HARD|VERY_HARD) to the FE 3-bucket facet. */
export const mapSubjectDifficulty = (
    be: string | null | undefined,
): Subject["difficulty"] => {
    switch (be) {
        case "EASY":
            return "basic"
        case "MEDIUM":
            return "intermediate"
        case "HARD":
        case "VERY_HARD":
            return "advanced"
        default:
            return "intermediate"
    }
}

/** Maps a catalog summary row (`GET /subjects`) to the FE {@link Subject}. */
export const toSubjectFromSummary = (summary: SubjectSummary): Subject => ({
    id: summary.code,
    uuid: summary.id,
    code: summary.code,
    name: summary.nameVi || summary.name,
    credits: summary.credits,
    difficulty: mapSubjectDifficulty(summary.difficulty),
    progress: null,
    imageUrl: summary.thumbnailUrl || null,
    courseLinks: [],
    isMember: false,
    membershipRole: null,
})

/**
 * Maps the full detail (`GET /subjects/{code}`) to the FE {@link Subject}, merging the
 * viewer-scoped facts (membership / linked courses / mastery) when they are available.
 *
 * @param detail - the REST subject detail (also reachable as `workspace.overview`).
 * @param context - viewer-scoped extras; omitted → a guest-shaped subject.
 */
export const toSubjectFromDetail = (
    detail: SubjectDetail,
    context?: SubjectViewerContext,
): Subject => ({
    id: detail.code,
    uuid: detail.id,
    code: detail.code,
    name: detail.nameVi || detail.name,
    credits: detail.credits,
    difficulty: mapSubjectDifficulty(detail.difficulty),
    progress: context?.progress ?? null,
    imageUrl: detail.thumbnailUrl || null,
    courseLinks: context?.courseLinks ?? [],
    isMember: (context?.membership ?? null) !== null,
    membershipRole: context?.membership?.role ?? null,
})

// ------------------------------------------------------------------ workspace

/** Cache-key head of the workspace aggregate reads (shared with the membership writes). */
export const SUBJECT_WORKSPACE_KEY = "subject-workspace"

/**
 * SWR key of the workspace aggregate. Auth-scoped: `callerMembership` depends on the
 * caller, so the session flag is part of the key — signing in/out re-reads instead of
 * serving a stale "not a member" aggregate.
 */
export const subjectWorkspaceKey = (code: string, authenticated: boolean) =>
    [SUBJECT_WORKSPACE_KEY, code, authenticated] as const

/** SWR key of the public subject detail read. */
export const subjectDetailKey = (code: string) => ["subject", code] as const

/**
 * BE contract quirk: `WorkspaceView.callerMembership` is typed non-null in the DTO but
 * `WorkspaceAggregator.resolveCaller` returns `null` for a guest / non-member. Narrow it
 * honestly here instead of trusting the generated shape.
 */
const readCallerMembership = (
    workspace: WorkspaceView | undefined,
): CallerMembership | null =>
    (workspace?.callerMembership as CallerMembership | null | undefined) ?? null

/** Workspace link `targetType` marking a Course-module course. */
const COURSE_TARGET_TYPE = "COURSE"

/** Pinned links first, then curator sort order. */
const byPinnedThenOrder = (a: LinkItem, b: LinkItem) =>
    Number(b.pinned) - Number(a.pinned) || a.sortOrder - b.sortOrder

/** Picks the `COURSE` links of the workspace `learning` tab, in display order. */
export const toSubjectCourseLinks = (
    workspace: WorkspaceView | undefined,
): Array<SubjectCourseLink> =>
    [...(workspace?.learning?.data?.links ?? [])]
        .filter((link) => (link.targetType ?? "").toUpperCase() === COURSE_TARGET_TYPE)
        .sort(byPinnedThenOrder)
        .map((link) => ({
            id: link.targetId,
            title: link.title ?? "",
            pinned: link.pinned,
        }))

/**
 * Loads the workspace aggregate (`GET /subjects/{code}/workspace`).
 *
 * ⚠️ The endpoint is public, but `callerMembership` is only filled when the caller is
 * identified — so the Bearer token MUST ride along. The shared client's
 * `getSubjectWorkspace` opts out of auth (`authenticated: false`), which is why the call
 * is issued here with the default (authenticated) transport instead.
 *
 * @param subjectId - the `[subjectId]` route segment (a subject code).
 */
export const useQuerySubjectWorkspaceSwr = (subjectId: string) => {
    const code = subjectId ? subjectId.toUpperCase() : ""
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const { data, isLoading, error, mutate } = useSWR(
        code ? subjectWorkspaceKey(code, authenticated) : null,
        () =>
            restRequest<WorkspaceView>({
                method: "GET",
                url: `/subjects/${code}/workspace`,
            }),
        { shouldRetryOnError: false },
    )
    return { workspace: data, isLoading, error, mutate }
}

// ------------------------------------------------------------------ mastery

/** GraphQL `SubjectMastery` (gamification) — the viewer's progress on a subject. */
export interface SubjectMastery {
    /** Completion percent, already 0..100 BE-side. */
    completionPct: number
    consistencyScore: number
    subjectXp: number
    masteryLevel: string
}

/** Apollo response shape for `subjectMastery` (returned directly — no envelope). */
interface QuerySubjectMasteryResponse {
    subjectMastery: SubjectMastery | null
}

/**
 * Builds the mastery document with both ids INLINED.
 *
 * ⚠️ Same gateway quirk as `subjectWorkspace` (see `query-subject-community`): the
 * pre-GraphQL security filter 401s any operation declaring a NON-NULL variable, and
 * `subjectMastery(userId: ID!, subjectId: ID!)` takes two — so they are inlined as
 * string literals via `JSON.stringify`.
 */
const subjectMasteryDocument = (userId: string, subjectId: string): DocumentNode =>
    gql(
        `query SubjectMastery {\n` +
            `  subjectMastery(userId: ${JSON.stringify(userId)}, subjectId: ${JSON.stringify(subjectId)}) {\n` +
            `    completionPct\n` +
            `    consistencyScore\n` +
            `    subjectXp\n` +
            `    masteryLevel\n` +
            `  }\n` +
            `}`,
    )

/**
 * Loads the signed-in viewer's mastery for a subject (GraphQL
 * `subjectMastery(userId, subjectId)`), which is the only real source of per-user
 * completion. Skipped entirely for guests (no viewer id) or before the subject UUID
 * resolves. An error resolves to `null` — a missing meter beats a broken header.
 *
 * @param subjectUuid - the real subject UUID (`Subject.uuid`), NOT the code.
 */
export const useQuerySubjectMasterySwr = (subjectUuid: string | undefined) => {
    const viewerId = useAppSelector((state) => state.user.user?.id)
    const { data, isLoading, error } = useSWR(
        subjectUuid && viewerId
            ? (["subject-mastery", subjectUuid, viewerId] as const)
            : null,
        async ([, subject, user]): Promise<SubjectMastery | null> => {
            const apollo = createAuthApolloClient({ cache: false })
            try {
                const result = await apollo.query<QuerySubjectMasteryResponse>({
                    query: subjectMasteryDocument(user, subject),
                })
                return result.data?.subjectMastery ?? null
            } catch {
                // No mastery row / forbidden / transport error → hide the meter.
                return null
            }
        },
        { shouldRetryOnError: false },
    )
    return { mastery: data ?? null, isLoading, error }
}

// ------------------------------------------------------------------ subject

/**
 * Loads the subject for a workspace from the real BE. Composes three reads:
 *
 * 1. `GET /subjects/{code}` — the public identity (name/credits/difficulty/art).
 * 2. `GET /subjects/{code}/workspace` **with the Bearer token** — `callerMembership`
 *    (the honest `isMember`) + the `learning` tab's linked courses.
 * 3. GraphQL `subjectMastery` — the viewer's completion percent for the header meter.
 *
 * The BE keys REST on the uppercase course code, so the route segment is normalised
 * before the fetch; the GraphQL op keys on the UUID carried by the detail.
 *
 * @param subjectId - the `[subjectId]` route segment (a subject code).
 */
export const useQuerySubjectSwr = (subjectId: string) => {
    const code = subjectId ? subjectId.toUpperCase() : ""
    const { data, isLoading, error, mutate } = useSWR(
        code ? subjectDetailKey(code) : null,
        () => getSubjectDetail(code),
    )
    const {
        workspace,
        isLoading: isMembershipLoading,
        mutate: mutateWorkspace,
    } = useQuerySubjectWorkspaceSwr(subjectId)
    // The aggregate embeds the same detail, so the identity still resolves if the
    // standalone detail read is slower (or fails while the aggregate succeeded).
    const detail = data ?? workspace?.overview
    const { mastery } = useQuerySubjectMasterySwr(detail?.id)

    return {
        subject: detail
            ? toSubjectFromDetail(detail, {
                  membership: readCallerMembership(workspace),
                  courseLinks: toSubjectCourseLinks(workspace),
                  progress: mastery?.completionPct ?? null,
              })
            : undefined,
        isLoading,
        /** Membership/linked-course read still in flight (gate join/leave CTAs on it). */
        isMembershipLoading,
        error,
        mutate,
        mutateWorkspace,
    }
}
