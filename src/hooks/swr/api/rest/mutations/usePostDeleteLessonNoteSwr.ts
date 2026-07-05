import useSWRMutation from "swr/mutation"
import { deleteLessonNote } from "@/modules/api/rest/course"

/**
 * Params for {@link usePostDeleteLessonNoteSwr}.
 */
export interface DeleteLessonNoteParams {
    lessonId: string
    noteId: string
}

/**
 * SWR mutation wrapper for {@link deleteLessonNote}.
 */
export const usePostDeleteLessonNoteSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        DeleteLessonNoteParams
    >(
        "POST_DELETE_LESSON_NOTE_SWR",
        async (_key, { arg }) => {
            return deleteLessonNote(arg.lessonId, arg.noteId)
        },
    )

    return swr
}
