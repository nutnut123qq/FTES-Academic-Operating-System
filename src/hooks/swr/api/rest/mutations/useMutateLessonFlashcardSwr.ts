import useSWRMutation from "swr/mutation"
import {
    createLessonFlashcard,
    createLessonFlashcardsBulk,
    deleteLessonFlashcard,
    updateLessonFlashcard,
    type LessonFlashcardView,
    type UpsertFlashcardRequest,
} from "@/modules/api/rest/course"

/**
 * Ba đường ghi của màn soạn thẻ ghi nhớ per-bài. Gom một file vì chúng luôn dùng cùng nhau
 * trong đúng một màn — tách ba file chỉ thêm ba lớp bọc y hệt nhau.
 *
 * Người gọi tự `mutate()` lại `LESSON_FLASHCARDS_SWR` sau khi ghi: cùng một endpoint đọc phục
 * vụ cả học viên lẫn người soạn, nên revalidate là đủ, không cần cache riêng cho màn soạn.
 */

/** Tạo thẻ mới cho bài. */
export const usePostLessonFlashcardSwr = (lessonId: string) => {
    return useSWRMutation<LessonFlashcardView, Error, string, UpsertFlashcardRequest>(
        "POST_LESSON_FLASHCARD_SWR",
        async (_key, { arg }) => createLessonFlashcard(lessonId, arg),
    )
}

/** Nhận cả lô (bản nháp AI) — BE validate hết lô rồi mới ghi, hỏng một thẻ là không ghi thẻ nào. */
export const usePostLessonFlashcardsBulkSwr = (lessonId: string) => {
    return useSWRMutation<
        Array<LessonFlashcardView>,
        Error,
        string,
        Array<UpsertFlashcardRequest>
    >(
        "POST_LESSON_FLASHCARDS_BULK_SWR",
        async (_key, { arg }) => createLessonFlashcardsBulk(lessonId, arg),
    )
}

/** Sửa thẻ — field nào không gửi thì BE giữ nguyên. */
export const usePatchLessonFlashcardSwr = () => {
    return useSWRMutation<
        LessonFlashcardView,
        Error,
        string,
        { cardId: string; request: UpsertFlashcardRequest }
    >(
        "PATCH_LESSON_FLASHCARD_SWR",
        async (_key, { arg }) => updateLessonFlashcard(arg.cardId, arg.request),
    )
}

/** Xoá MỀM (BE đặt `status = ARCHIVED`) — arg là id thẻ. */
export const useDeleteLessonFlashcardSwr = () => {
    return useSWRMutation<void, Error, string, string>(
        "DELETE_LESSON_FLASHCARD_SWR",
        async (_key, { arg }) => deleteLessonFlashcard(arg),
    )
}
