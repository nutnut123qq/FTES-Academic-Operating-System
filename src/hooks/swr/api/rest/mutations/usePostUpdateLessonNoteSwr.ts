import useSWRMutation from "swr/mutation"
import {
    updateLessonNote,
    type NoteRequest,
    type NoteView,
} from "@/modules/api/rest/course"

/**
 * Params for {@link usePostUpdateLessonNoteSwr}.
 */
export interface UpdateLessonNoteParams {
    lessonId: string
    noteId: string
    request: NoteRequest
}

/**
 * SWR mutation wrapper for {@link updateLessonNote}.
 */
export const usePostUpdateLessonNoteSwr = () => {
    const swr = useSWRMutation<
        NoteView,
        Error,
        string,
        UpdateLessonNoteParams
    >(
        "POST_UPDATE_LESSON_NOTE_SWR",
        async (_key, { arg }) => {
            return updateLessonNote(arg.lessonId, arg.noteId, arg.request)
        },
    )

    return swr
}
