"use client"

import useSWR from "swr"
import { getMyLearnedLessons, type LearnedLessonView } from "@/modules/api/rest/course"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** Key prefix — module-private on purpose (see {@link myLearnedLessonsSwrKey}). */
const GET_MY_LEARNED_LESSONS_SWR_KEY = "GET_MY_LEARNED_LESSONS_SWR"

/**
 * The SWR key this hook subscribes to for one `limit` window, for callers that
 * need to `mutate()` it.
 *
 * Exported as a BUILDER rather than a bare prefix so a call site cannot rebuild the
 * array by hand and silently drift from the hook: the viewer id is part of the key,
 * and a hand-written `["GET_MY_LEARNED_LESSONS_SWR", limit]` would match nothing.
 *
 * @param viewerId - the signed-in viewer's id ({@link useViewerScopeId}).
 * @param limit - page size, or `undefined` for the backend default.
 */
export const myLearnedLessonsSwrKey = (viewerId: string, limit?: number) =>
    [GET_MY_LEARNED_LESSONS_SWR_KEY, viewerId, limit ?? null]

/**
 * SWR query wrapper cho {@link getMyLearnedLessons} — bài viewer đã học gần đây (mới nhất trước).
 *
 * Thay `useQueryMyLearnedLessonsSwr` (GraphQL): BE KHÔNG có field `myLearnedLessons`, gọi vào chỉ
 * nhận validation error `FieldUndefined` nên picker "chọn bài" của AI Hub luôn rỗng — 3 công cụ
 * summary/flashcards/quiz không dùng được dù pipeline BE vẫn sống (E2E 2026-07-25).
 *
 * User-scoped: chỉ chạy khi đã đăng nhập VÀ đã biết viewer là ai — key mang luôn id người xem
 * ({@link useViewerScopeId}). "Có người đăng nhập" không phải là danh tính: với key trần, đăng
 * xuất A rồi đăng nhập B trong cùng một tab sẽ re-key về đúng entry cũ và B đọc trúng danh sách
 * bài đã học của A.
 */
export const useGetMyLearnedLessonsSwr = (limit?: number) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    return useSWR<Array<LearnedLessonView>, Error>(
        authenticated && viewerId ? myLearnedLessonsSwrKey(viewerId, limit) : null,
        () => getMyLearnedLessons(limit),
    )
}
