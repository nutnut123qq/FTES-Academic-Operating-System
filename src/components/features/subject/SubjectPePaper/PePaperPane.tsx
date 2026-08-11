"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Button, Spinner, Typography } from "@heroui/react"
import { DownloadSimpleIcon, FileXIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { ExamImageViewer } from "@/components/features/subject/ExamImageViewer"
import { fetchResourceFileBlob } from "@/modules/api/rest/resource"
import { classifyPePaperFile, type PePaperFileFacts } from "./pePaperFile"

/** Props for {@link PePaperPane}. */
export interface PePaperPaneProps {
    /** The PE resource whose paper this is. */
    resourceId: string
    /** What the preview query resolved; `null` while it is still in flight. */
    facts: PePaperFileFacts | null
    /** True while the preview query is loading. */
    isLoading: boolean
    /** Hands the paper over as a browser download (the caller owns the toast + pending state). */
    onDownload: () => void
    /** True while that download is in flight. */
    isDownloading: boolean
}

/** The frame everything non-image renders into — same box, so the pane never jumps. */
const PANE_SHELL = "flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-center"

/**
 * LEFT pane of the PE paper page: the exam sheet itself, rendered by TYPE.
 *
 * - **picture** → the shared {@link ExamImageViewer}, so a photographed sheet zooms, pans
 *   and behaves exactly like an FE album page. The contract carries ONE image
 *   (`PePaperPreview.imageUrl`) and no list, so there is nothing to page through — the
 *   viewer simply renders without carets or filmstrip. It gains a slider the day the BE
 *   ships a multi-image PE paper; nothing here needs to change but the array.
 * - **PDF** → embedded and scrollable inside the frame. The bytes are pulled through the
 *   BE stream (`GET /resources/{id}/download`) and handed to an `<iframe>` as an object
 *   URL, because that endpoint authenticates by `Authorization` header — an `<iframe src>`
 *   pointing at it would send none and 401, and the provider's own URL for a `raw` object
 *   is 401 by policy anyway. The stream is the SAME one the download button uses, i.e. the
 *   server-processed (watermarked) copy: previewing hands the reader nothing the download
 *   already did. If the stream refuses (403 / 429 / offline) the pane degrades to the
 *   download card instead of an empty grey box.
 * - **anything else** (DOC/DOCX/ZIP…) → says plainly that it cannot be previewed and
 *   offers the download. No fake render.
 *
 * @param props - {@link PePaperPaneProps}
 */
export const PePaperPane = ({
    resourceId,
    facts,
    isLoading,
    onDownload,
    isDownloading,
}: PePaperPaneProps) => {
    const t = useTranslations("subjects")
    const kind = useMemo(
        () =>
            facts
                ? classifyPePaperFile(facts)
                : ("MISSING" as ReturnType<typeof classifyPePaperFile>),
        [facts],
    )

    /** Object URL of the streamed PDF; `null` until it lands. */
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [pdfFailed, setPdfFailed] = useState(false)

    useEffect(() => {
        if (kind !== "PDF") {
            return
        }
        let cancelled = false
        let objectUrl: string | null = null
        setPdfFailed(false)
        void fetchResourceFileBlob(resourceId)
            .then(({ blob }) => {
                if (cancelled) {
                    return
                }
                objectUrl = URL.createObjectURL(blob)
                setPdfUrl(objectUrl)
            })
            .catch(() => {
                if (!cancelled) {
                    setPdfFailed(true)
                }
            })
        return () => {
            cancelled = true
            setPdfUrl(null)
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl)
            }
        }
    }, [kind, resourceId])

    /** Download affordance — the fallback of every branch that cannot render inline. */
    const downloadButton = (
        <Button
            size="sm"
            variant="secondary"
            isPending={isDownloading}
            isDisabled={isDownloading}
            onPress={onDownload}
        >
            <DownloadSimpleIcon aria-hidden focusable="false" className="size-4" />
            {t("practice.pe.openPaper")}
        </Button>
    )

    if (isLoading && !facts) {
        return (
            <div className={PANE_SHELL}>
                <Spinner aria-label={t("practice.pe.paper.loading")} />
            </div>
        )
    }

    if (kind === "IMAGE" && facts?.imageUrl) {
        return (
            <ExamImageViewer
                images={[
                    {
                        id: `${resourceId}-paper`,
                        imageUrl: facts.imageUrl,
                        caption: t("practice.pe.paperAlt"),
                    },
                ]}
                index={0}
                onIndexChange={() => undefined}
                className="min-h-0 flex-1"
            />
        )
    }

    if (kind === "PDF" && !pdfFailed) {
        return (
            <div className="relative min-h-0 flex-1 bg-default">
                {pdfUrl ? (
                    <iframe
                        src={pdfUrl}
                        title={facts?.originalFilename ?? t("practice.pe.paperFile")}
                        className="absolute inset-0 size-full border-0"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Spinner aria-label={t("practice.pe.paper.loading")} />
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className={PANE_SHELL}>
            <FileXIcon aria-hidden focusable="false" className="size-10 text-muted" />
            <div className="flex flex-col gap-1">
                <Typography type="body-sm" weight="medium">
                    {kind === "MISSING"
                        ? t("practice.pe.paper.missing")
                        : pdfFailed
                            ? t("practice.pe.paper.previewFailed")
                            : t("practice.pe.paper.noPreview")}
                </Typography>
                <Typography type="body-xs" color="muted">
                    {facts?.originalFilename ?? t("practice.pe.paperFile")}
                </Typography>
            </div>
            {kind === "MISSING" ? null : downloadButton}
        </div>
    )
}
