"use client"

import useSWR from "swr"
import {
    getLessonFlashcards,
    type LessonFlashcardsView,
} from "@/modules/api/rest/course"

/**
 * SWR wrapper cho {@link getLessonFlashcards} — đường đọc hợp nhất của màn thẻ ghi nhớ.
 *
 * Gọi TRƯỚC khi sinh thẻ bằng AI: bài đã có bộ do giảng viên soạn (`source: "AUTHORED"`) thì
 * dùng thẳng bộ đó, khỏi tốn một lượt gọi model và khỏi ra thẻ lạc đề (góp ý website
 * 2026-07-26). Chưa có bộ tay thì BE trả `source: "AI"` + `cards` rỗng, client giữ luồng cũ.
 *
 * `shouldRetryOnError: false` — 403 của bài chưa mở khoá là câu trả lời cuối cùng, retry vòng
 * lặp chỉ tổ đốt request.
 */
export const useGetLessonFlashcardsSwr = (lessonId: string) => {
    return useSWR<LessonFlashcardsView, Error>(
        lessonId ? ["LESSON_FLASHCARDS_SWR", lessonId] : null,
        () => getLessonFlashcards(lessonId),
        { shouldRetryOnError: false },
    )
}
