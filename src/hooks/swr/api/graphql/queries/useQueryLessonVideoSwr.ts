import useSWR from "swr"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { queryLessonVideo } from "@/modules/api/graphql/queries/query-lesson-video"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setLessonVideo } from "@/redux/slices/lession-video"

/**
 * Singleton SWR for `lessonVideo(request: { id })` — id from `lessonVideo.id` (`setLessonVideoId`).
 */
export const useQueryLessonVideoSwr = () => {
    const lessonVideoId = useAppSelector((state) => state.lessonVideo.id)
    const courseId = useAppSelector((state) => state.course.id)
    const dispatch = useAppDispatch()
    const swr = useSWR(
        lessonVideoId && courseId
            ? [
                "QUERY_LESSON_VIDEO_SWR",
                lessonVideoId,
                courseId,
            ]
            : null,
        async () => {
            if (!lessonVideoId || !courseId) {
                throw new Error("Lesson video or course id not found")
            }
            const data = await queryLessonVideo({
                request: { id: lessonVideoId },
                headers: {
                    [GraphQLHeadersKey.XCourseId]: courseId,
                },
            })
            if (!data?.data?.lessonVideo?.data) {
                throw new Error("Lesson video not found")
            }
            dispatch(setLessonVideo(data.data.lessonVideo.data))
            return data.data.lessonVideo.data
        },
    )
    return swr
}
