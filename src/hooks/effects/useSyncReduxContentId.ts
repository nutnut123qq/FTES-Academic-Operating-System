import { useLayoutEffect, useRef } from "react"
import { useParams, usePathname } from "next/navigation"
import { useAppDispatch } from "@/redux/hooks"
import { setChallengeCount, setChallengePageNumber, setChallenges } from "@/redux/slices/challenge"
import { setContent, setContentId } from "@/redux/slices/content"

/**
 * Syncs `content.id` from the `[contentId]` route param into Redux on navigation.
 * Clears the active content when the param is absent so singleton SWR does not keep a stale key.
 * @returns void
 */
export const useSyncReduxContentId = () => {
    const dispatch = useAppDispatch()
    const pathname = usePathname()
    const params = useParams()
    const prevContentIdRef = useRef<string | undefined>(undefined)
    useLayoutEffect(
        () => {
            const contentId = params.contentId as string | undefined
            const prevContentId = prevContentIdRef.current
            dispatch(setContentId(contentId))
            if (!contentId) {
                dispatch(setContent(undefined))
            }
            if (contentId !== prevContentId) {
                // Drop stale challenge list so the Challenges tab cannot show the previous lesson.
                dispatch(setChallenges([]))
                dispatch(setChallengeCount(undefined))
                dispatch(setChallengePageNumber(0))
            }
            prevContentIdRef.current = contentId
        },
        [
            dispatch,
            pathname,
            params.contentId,
        ],
    )
}