"use client"

import useSWR from "swr"

/** One lesson comment. */
export interface LessonComment {
    id: string
    author: string
    /** Username for the profile link. */
    authorUsername: string
    /** Pre-formatted relative time, e.g. "2h ago". */
    timeLabel: string
    text: string
}

const COMMENTS: Array<LessonComment> = [
    {
        id: "c1",
        author: "Trần Lan",
        authorUsername: "lan",
        timeLabel: "2h",
        text: "The call-stack diagram finally made recursion click for me. Thanks!",
    },
    {
        id: "c2",
        author: "Đỗ Quân",
        authorUsername: "quan",
        timeLabel: "5h",
        text: "Is pass-by-value the same in every language covered here, or does it differ for objects?",
    },
]

const fetchCommentsMock = async (_courseId: string, _contentId: string): Promise<Array<LessonComment>> =>
    COMMENTS

/** Loads a lesson's comment thread. Mocked; SWR-shaped for a BE swap. */
export const useQueryLessonCommentsSwr = (courseId: string, contentId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        ["learn-lesson-comments", courseId, contentId],
        () => fetchCommentsMock(courseId, contentId),
    )
    return {
        comments: data ?? [],
        isLoading,
        error,
        mutate,
    }
}
