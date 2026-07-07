"use client"

import {
    useQueryChallengeSubmissionsSwr,
    useQueryChallengeSwr,
    useQueryContentsSwr,
    useQueryCourseEnrollmentStatusSwr,
    useQueryIncompleteJobsSwr,
    useQueryLessonVideoSwr,
    useQuerySystemConfigSwr,
    useQueryUserSwr,
} from "./api"

/**
 * Mount point for SWR queries that have no direct component consumer but must run
 * app-wide for their side effect (hydrating Redux as the route/auth state changes).
 *
 * Previously these queries ran because they were mounted inside `SwrProvider` (now removed). This
 * component replaces that WITHOUT a context: it renders `null` (no children), so when a query
 * changes state only this component re-renders, NOT the whole app tree (unlike the old mega-context
 * that re-rendered all 57 consumers). Queries that already have a real consumer run there instead.
 * @returns `null` — only runs the hooks for their side effects.
 */
export const SwrSideEffects = () => {
    // Global auth/user — key always on, dispatches setUser/setAuthenticated.
    useQueryUserSwr()
    // System config used app-wide.
    useQuerySystemConfigSwr()
    // Enrollment status — sets app-wide `user.enrolled` (gates challenges, personal project, premium).
    // Gated by course?.id, so it only fetches once a course is active; needed on every course page
    // (the learn pages have no EnrollCard consumer of their own).
    useQueryCourseEnrollmentStatusSwr()
    // Route-param-reactive queries — gated by their key internally, dispatch into redux.
    useQueryChallengeSwr()
    useQueryChallengeSubmissionsSwr()
    useQueryContentsSwr()
    useQueryLessonVideoSwr()
    useQueryIncompleteJobsSwr()
    return null
}
