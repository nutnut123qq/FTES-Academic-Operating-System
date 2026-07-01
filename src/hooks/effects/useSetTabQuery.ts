import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { ContentTab, setContentTab } from "@/redux/slices/tabs"

/**
 * URL → Redux for the content tab (deep link + browser back/forward).
 * Normalises legacy `codeExplaining`/`CodeImplementation` values to `CodeExplainings`.
 *
 * IMPORTANT: reacts only to the **URL** (`searchParams`), NOT to redux `tab`.
 * Clicking a tab (onTabChange in Content) sets both redux + url; `router.replace` is async, so
 * if this hook kept `tab` in deps, between dispatch and the url change there would be a moment
 * where `redux=Challenges` but the url has no `?tab` → the `!rawTab` branch resets to Content.
 * Removing `tab` from deps breaks that loop; Redux dedupes so a duplicate dispatch is harmless.
 * @returns void
 */
export const useSetTabQuery = () => {
    const dispatch = useAppDispatch()
    const searchParams = useSearchParams()
    const isSchemaV2 = useAppSelector((state) => Boolean(state.content.entity?.verified))

    useEffect(() => {
        const rawTab = searchParams.get("tab")
        // No ?tab= (fresh load / back to empty url) → default to Content.
        if (!rawTab) {
            dispatch(setContentTab(ContentTab.Content))
            return
        }
        let tabFromUrl =
            rawTab === ContentTab.LessonVideos
            || rawTab === "codeExplaining"
            || rawTab === ContentTab.CodeImplementation
                ? ContentTab.CodeExplainings
                : (rawTab as ContentTab)
        if (
            isSchemaV2
            && (
                tabFromUrl === ContentTab.CodeExplainings
                || tabFromUrl === ContentTab.LessonVideos
                || tabFromUrl === ContentTab.CodeImplementation
            )
        ) {
            tabFromUrl = ContentTab.Content
        }
        dispatch(setContentTab(tabFromUrl))
    }, [
        dispatch,
        isSchemaV2,
        searchParams,
    ])
}