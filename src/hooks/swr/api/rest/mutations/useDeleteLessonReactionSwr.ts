import useSWRMutation from "swr/mutation"
import {
    deleteLessonReaction,
    LESSON_REACTION_LIKE,
    type LessonReactionSummaryView,
} from "@/modules/api/rest/course"

/** Params for {@link useDeleteLessonReactionSwr}. */
export interface DeleteLessonReactionParams {
    lessonId: string
    /** Reaction kind; defaults to `"LIKE"` (the only one the backend accepts today). */
    reaction?: string
}

/**
 * SWR mutation wrapper for {@link deleteLessonReaction} (remove a lesson reaction). The
 * trigger resolves to the refreshed summary, fed into the reaction query's optimistic
 * `mutate` so the footer commits the server truth after the request lands.
 */
export const useDeleteLessonReactionSwr = () => {
    const swr = useSWRMutation<LessonReactionSummaryView, Error, string, DeleteLessonReactionParams>(
        "DELETE_LESSON_REACTION_SWR",
        async (_key, { arg }) => {
            return deleteLessonReaction(arg.lessonId, arg.reaction ?? LESSON_REACTION_LIKE)
        },
    )

    return swr
}
