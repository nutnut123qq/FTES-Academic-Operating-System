import useSWRMutation from "swr/mutation"
import {
    addLessonNote,
    type NoteRequest,
    type NoteView,
} from "@/modules/api/rest/course"

/**
 * Params for {@link usePostAddLessonNoteSwr}.
 */
export interface AddLessonNoteParams {
    lessonId: string
    request: NoteRequest
}

/**
 * SWR mutation wrapper for {@link addLessonNote}.
 */
export const usePostAddLessonNoteSwr = () => {
    const swr = useSWRMutation<
        NoteView,
        Error,
        string,
        AddLessonNoteParams
    >(
        "POST_ADD_LESSON_NOTE_SWR",
        async (_key, { arg }) => {
            return addLessonNote(arg.lessonId, arg.request)
        },
    )

    return swr
}
