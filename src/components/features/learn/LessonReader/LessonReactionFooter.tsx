"use client"

import React from "react"
import { InteractionBar } from "@/components/reuseable/Discussion/InteractionBar"
import { useGetLessonReactionsSwr } from "@/hooks/swr/api/rest/queries/useGetLessonReactionsSwr"

/**
 * Lesson view count. The endpoint still returns the legacy like fields, but lesson
 * reactions are no longer a product surface, so only the view metric is rendered.
 */
export const LessonReactionFooter = ({ contentId }: { contentId: string }) => {
    const { data } = useGetLessonReactionsSwr(contentId)

    return (
        <div className="mt-6 rounded-2xl border border-default px-4 py-3">
            <InteractionBar
                summary={undefined}
                onReact={() => {}}
                viewCount={data?.viewCount}
                showReactions={false}
            />
        </div>
    )
}
