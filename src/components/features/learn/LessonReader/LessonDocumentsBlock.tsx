"use client"

import useSWR from "swr"
import { Card, CardContent, Typography } from "@heroui/react"
import { FilePdfIcon, PaperclipIcon } from "@phosphor-icons/react"
import { getLessonDocuments } from "@/modules/api/rest/course"

/**
 * Lesson document/slide attachments (`GET /lessons/{id}/documents`), each opening
 * its signed URL in a new tab (works for any mime — PDF/slide/etc.). Self-hides
 * when the lesson has no attachments or the viewer has no access.
 */
export const LessonDocumentsBlock = ({ lessonId }: { lessonId: string }) => {
    const { data } = useSWR(
        lessonId ? ["lesson-documents", lessonId] : null,
        () => getLessonDocuments(lessonId).catch(() => []),
        { shouldRetryOnError: false },
    )
    if (!data || data.length === 0) return null

    return (
        <div className="mx-auto w-full max-w-3xl">
            <Card>
                <CardContent className="flex flex-col gap-1 p-3">
                    {data.map((doc) => {
                        const isPdf = (doc.mimeType ?? "").includes("pdf")
                        const Icon = isPdf ? FilePdfIcon : PaperclipIcon
                        return (
                            <a
                                key={doc.id}
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center gap-3 rounded-medium px-3 py-2 transition-colors hover:bg-default/40"
                            >
                                <Icon aria-hidden focusable="false" className="size-5 shrink-0 text-accent" />
                                <Typography type="body-sm" className="min-w-0 flex-1 truncate group-hover:underline">
                                    {doc.title}
                                </Typography>
                            </a>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    )
}
