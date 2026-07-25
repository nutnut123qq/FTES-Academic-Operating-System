"use client"

import useSWR from "swr"
import { getMyLearnedLessons, type LearnedLessonView } from "@/modules/api/rest/course"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR query wrapper cho {@link getMyLearnedLessons} — bài viewer đã học gần đây (mới nhất trước).
 *
 * Thay `useQueryMyLearnedLessonsSwr` (GraphQL): BE KHÔNG có field `myLearnedLessons`, gọi vào chỉ
 * nhận validation error `FieldUndefined` nên picker "chọn bài" của AI Hub luôn rỗng — 3 công cụ
 * summary/flashcards/quiz không dùng được dù pipeline BE vẫn sống (E2E 2026-07-25).
 *
 * User-scoped: chỉ chạy khi đã đăng nhập.
 */
export const useGetMyLearnedLessonsSwr = (limit?: number) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    return useSWR<Array<LearnedLessonView>, Error>(
        authenticated ? ["GET_MY_LEARNED_LESSONS_SWR", limit ?? null] : null,
        () => getMyLearnedLessons(limit),
    )
}
