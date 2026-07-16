import useSWRMutation from "swr/mutation"
import {
    putLessonReaction,
    LESSON_REACTION_LIKE,
    type LessonReactionSummaryView,
} from "@/modules/api/rest/course"

/** Params for {@link usePutLessonReactionSwr}. */
export interface PutLessonReactionParams {
    lessonId: string
    /** Reaction kind; defaults to `"LIKE"` (the only one the backend accepts today). */
    reaction?: string
}

/**
 * SWR mutation wrapper for {@link putLessonReaction} (set a lesson reaction). The trigger
 * resolves to the refreshed summary, which the caller feeds into the reaction query's
 * optimistic `mutate` so the footer commits the server truth after the request lands.
 */
export const usePutLessonReactionSwr = () => {
    const swr = useSWRMutation<LessonReactionSummaryView, Error, string, PutLessonReactionParams>(
        "PUT_LESSON_REACTION_SWR",
        async (_key, { arg }) => {
            return putLessonReaction(arg.lessonId, arg.reaction ?? LESSON_REACTION_LIKE)
        },
    )

    return swr
}
