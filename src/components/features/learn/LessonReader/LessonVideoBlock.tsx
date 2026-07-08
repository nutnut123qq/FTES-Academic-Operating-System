"use client"

import { Card, CardContent } from "@heroui/react"

/** Extracts a YouTube video id from a watch / share / embed / shorts URL. */
const youtubeId = (ref: string): string | null => {
    const m = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([A-Za-z0-9_-]{11})/.exec(
        ref,
    )
    return m?.[1] ?? null
}

/**
 * Lesson video player. Migrated lessons carry their source in `videoRef`: most are
 * YouTube links (rendered as an embed). Anything else — HTML notes, Drive links,
 * unsupported refs — hides the player. Only mounted when the lesson has a READY
 * video (`videoStatus === "READY"`).
 *
 * ponytail: internal `video_*` HLS refs (a minority of migrated courses) are not
 * handled yet — they self-hide. Add a stream.ftes.vn HLS branch when one surfaces.
 */
export const LessonVideoBlock = ({ videoRef }: { videoRef: string | null }) => {
    const ytId = videoRef ? youtubeId(videoRef) : null
    if (!ytId) return null

    return (
        <div className="mx-auto w-full max-w-3xl">
            <Card>
                <CardContent className="p-0">
                    <iframe
                        src={`https://www.youtube.com/embed/${ytId}`}
                        title="Lesson video"
                        className="aspect-video w-full rounded-2xl"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                    />
                </CardContent>
            </Card>
        </div>
    )
}
