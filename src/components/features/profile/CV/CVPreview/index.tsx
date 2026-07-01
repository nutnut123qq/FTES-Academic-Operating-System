"use client"

import { MagnifyingGlassPlusIcon } from "@phosphor-icons/react"
import React, {
    useEffect,
    useMemo,
} from "react"
import {
    Button,
    cn,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import dynamic from "next/dynamic"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useAppSelector } from "@/redux/hooks"
import { useCvPreviewOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useQueryCvUrlSwr } from "@/hooks/swr/api/graphql/queries/useQueryCvUrlSwr"
import { useCvApplyStore } from "@/hooks/zustand/cvApply/store"

const PDFView = dynamic(
    () => import("@/components/reuseable/PDFView").then((module) => module.PDFView),
    { ssr: false },
)

/** Props for {@link CVPreview}. */
export type CVPreviewProps = WithClassNames<undefined>

/**
 * Sticky PDF preview of the current CV (blob or saved URL) plus fullscreen entry.
 * @param props - {@link CVPreviewProps}
 */
export const CVPreview = ({ className }: CVPreviewProps) => {
    const t = useTranslations()
    const cvFile = useCvApplyStore((state) => state.cvFile)
    const {
        open: openCvPreviewModal,
    } = useCvPreviewOverlayState()
    useQueryCvUrlSwr()
    const cvUrlPayload = useAppSelector((state) => state.cvUrl.entity)
    const selectedFileUrl = useMemo(() => {
        if (!cvFile) return ""
        return URL.createObjectURL(cvFile)
    }, [
        cvFile,
    ])
    const previewPdfUrl = useMemo(
        () => selectedFileUrl || (cvUrlPayload?.cvUrl ?? ""), [
            selectedFileUrl,
            cvUrlPayload?.cvUrl,
        ]
    )

    useEffect(() => {
        return () => {
            if (selectedFileUrl) URL.revokeObjectURL(selectedFileUrl)
        }
    }, [
        selectedFileUrl,
    ])

    return (
        <div
            className={cn(
                "col-span-2 flex flex-col lg:sticky lg:top-16 lg:self-start lg:h-[calc(100vh-64px)] lg:min-h-0",
                className,
            )}
        >
            {/*
              PDF scrolls inside a flex child with `min-h-0` so the "Xem full" bar stays
              anchored under the preview instead of being pushed to the viewport bottom.
            */}
            <div className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 overflow-hidden lg:flex lg:min-h-0 lg:flex-col">
                    <PDFView
                        key={previewPdfUrl || "cv-preview-empty"}
                        src={previewPdfUrl}
                        title={t("cv.preview.title")}
                        heightClassName="h-[300px] lg:h-full lg:min-h-0"
                        showAllPages={true}
                        allowVerticalScroll={true}
                        fitToContainer={true}
                    />
                </div>
                <div className="shrink-0 border-t bg-content1/80 p-3 pb-5 backdrop-blur-sm lg:pb-4">
                    <Button
                        size="lg"
                        className="w-full"
                        variant="outline"
                        onPress={openCvPreviewModal}
                    >
                        <MagnifyingGlassPlusIcon aria-hidden className="size-5" />
                        {t("cv.preview.fullscreen")}
                    </Button>
                </div>
            </div>
        </div>
    )
}
