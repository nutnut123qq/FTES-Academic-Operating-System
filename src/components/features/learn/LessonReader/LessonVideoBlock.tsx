"use client"

import { Card, CardContent } from "@heroui/react"
import { LessonHlsPlayer } from "./LessonHlsPlayer"
import { LessonYouTubePlayer } from "./LessonYouTubePlayer"

/** Extracts a YouTube video id from a watch / share / embed / shorts URL. */
const youtubeId = (ref: string): string | null => {
    const m = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([A-Za-z0-9_-]{11})/.exec(
        ref,
    )
    return m?.[1] ?? null
}

/**
 * Lesson video player. Migrated lessons carry their source in `videoRef`:
 *  - YouTube links → embed iframe.
 *  - internal `video_*` tokens → HLS via {@link LessonHlsPlayer} (stream.ftes.vn).
 *  - anything else (HTML notes, Drive links) → hidden.
 *
 * `videoRef` is null when the lesson is locked (BE strips it behind the paywall),
 * so a non-accessible lesson renders nothing here. Only mounted when the lesson
 * has a READY video (`videoStatus === "READY"`).
 *
 * `onHalfWatched` fires once when the learner has watched ≥ 50% of the video — the
 * reader uses it to auto-mark the lesson complete. Both player variants report it.
 */
export const LessonVideoBlock = ({
    videoRef,
    onHalfWatched,
}: {
    videoRef: string | null
    onHalfWatched?: () => void
}) => {
    if (!videoRef) return null

    const ytId = youtubeId(videoRef)
    if (!ytId) {
        // internal streaming token → HLS; other refs (HTML/Drive) self-hide inside the trim.
        return /^\s*video_/.test(videoRef) ? (
            <LessonHlsPlayer videoRef={videoRef.trim()} onHalfWatched={onHalfWatched} />
        ) : null
    }

    return (
        <div className="mx-auto w-full max-w-5xl">
            <Card>
                <CardContent className="p-0">
                    <LessonYouTubePlayer videoId={ytId} onHalfWatched={onHalfWatched} />
                </CardContent>
            </Card>
        </div>
    )
}
