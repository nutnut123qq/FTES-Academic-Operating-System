"use client"

import React, { useEffect, useRef, useState } from "react"
import { MotionConfig } from "framer-motion"
import { Alert, Button, Input, Label, TextField, Typography } from "@heroui/react"
import { FilePdfIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { A4Page, CV_HEADER_ERROR_ID } from "./A4Page"
import { DesignToolbar } from "./DesignToolbar"
import { SectionRail } from "./SectionRail"
import { useCvDraft } from "./useCvDraft"
import {
    CV_SECTION_KEYS,
    defaultDesign,
    defaultLayout,
    loadDesign,
    loadLayout,
    orderedVisibleKeys,
    saveDesign,
    saveLayout,
    type CvAccent,
    type CvDensity,
    type CvDesign,
    type CvFontChoice,
    type CvLayout,
    type CvSectionKey,
} from "./layout"

export { MY_CV_SWR_KEY } from "./useCvDraft"

/** Props for {@link CvLiveEditor} — the SAME contract as the old builder form. */
export interface CvLiveEditorProps {
    /** Submit a review of the just-saved CV by its profile id. */
    onReview: (cvProfileId: string) => void
    /** True while a review job is submitting/running (disables the review button). */
    isReviewBusy: boolean
}

/** A4-shaped loading skeleton (rail + page) so the box holds its shape. */
const EditorSkeleton = () => (
    <div className="flex flex-col gap-4" aria-hidden>
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex w-full flex-col gap-2 sm:w-56">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full rounded-xl" />
                ))}
            </div>
            <div className="flex-1">
                <Skeleton className="mx-auto h-[420px] w-full max-w-[210mm] rounded-lg" />
            </div>
        </div>
    </div>
)

/**
 * The Live A4 CV editor (Canva-style). The résumé renders as a real A4 page the
 * user edits in place; a left rail reorders / shows-hides sections; a top toolbar
 * carries the design knobs; and an actions row saves, exports a PDF, and submits
 * the CV to the AI review job.
 *
 * Section ORDER, VISIBILITY and DESIGN are FE-only presentation prefs persisted
 * in localStorage (never in the CV payload — the BE rejects unknown keys), and
 * both the on-screen A4 and the exported PDF consume the same `layout.ts` helpers
 * so they stay in parity.
 */
export const CvLiveEditor = ({ onReview, isReviewBusy }: CvLiveEditorProps) => {
    const t = useTranslations("aiPlatform.toolPages.cvReview")
    const draft = useCvDraft()

    const [layout, setLayout] = useState<CvLayout>(defaultLayout)
    const [design, setDesign] = useState<CvDesign>(defaultDesign)
    const [busy, setBusy] = useState<null | "save" | "review" | "pdf">(null)
    const [exportError, setExportError] = useState<string | null>(null)

    // Hydrate FE-only prefs from localStorage once the CV (and its id scope) loads.
    const prefsHydratedRef = useRef(false)
    useEffect(() => {
        if (prefsHydratedRef.current || !draft.hasData) return
        prefsHydratedRef.current = true
        setLayout(loadLayout(draft.cvId))
        setDesign(loadDesign(draft.cvId))
    }, [draft.hasData, draft.cvId])

    // Persist prefs after hydration (guarded so the initial default never clobbers
    // a stored value before we've read it).
    useEffect(() => {
        if (!prefsHydratedRef.current) return
        saveLayout(draft.cvId, layout)
    }, [layout, draft.cvId])
    useEffect(() => {
        if (!prefsHydratedRef.current) return
        saveDesign(draft.cvId, design)
    }, [design, draft.cvId])

    const visibleKeys = orderedVisibleKeys(layout)

    const toggleHidden = (key: CvSectionKey) =>
        setLayout((prev) => ({
            ...prev,
            hidden: prev.hidden.includes(key)
                ? prev.hidden.filter((k) => k !== key)
                : [...prev.hidden, key],
        }))

    const moveInOrder = (index: number, dir: -1 | 1) =>
        setLayout((prev) => {
            const order = [...prev.order]
            const target = index + dir
            if (target < 0 || target >= order.length) return prev
            const [moved] = order.splice(index, 1)
            order.splice(target, 0, moved)
            return { ...prev, order }
        })

    const sectionLabels = Object.fromEntries(
        CV_SECTION_KEYS.map((key) => [key, t(`sections.${key}`)]),
    ) as Record<CvSectionKey, string>

    const handleSave = async () => {
        setBusy("save")
        await draft.save()
        setBusy(null)
    }

    const handleReview = async () => {
        setBusy("review")
        const id = await draft.save()
        setBusy(null)
        if (id) onReview(id)
    }

    const handleExport = async () => {
        if (draft.validateHeader().length > 0) return
        setBusy("pdf")
        setExportError(null)
        try {
            const { renderCvPdfBlob } = await import("../pdf")
            const blob = await renderCvPdfBlob(
                { title: draft.title.trim() || t("pdfUntitled"), sections: draft.sanitized() },
                {
                    summary: t("sections.summary"),
                    education: t("sections.education"),
                    experience: t("sections.experience"),
                    projects: t("sections.projects"),
                    skills: t("sections.skills"),
                    awards: t("sections.awards"),
                    untitled: t("pdfUntitled"),
                },
                layout,
                design,
            )
            const url = URL.createObjectURL(blob)
            const anchor = document.createElement("a")
            anchor.href = url
            anchor.download = `${(draft.draft.header.fullName || draft.title || "cv").trim().replace(/\s+/g, "_")}.pdf`
            document.body.appendChild(anchor)
            anchor.click()
            anchor.remove()
            URL.revokeObjectURL(url)
        } catch (error) {
            // A hard failure here is rare (renderCvPdfBlob falls back through font
            // families first), but never swallow it silently — log it and surface a
            // banner so the user knows the download didn't happen.
            console.error("CV PDF export failed", error)
            setExportError(t("exportError"))
        } finally {
            setBusy(null)
        }
    }

    const anyBusy = busy !== null || isReviewBusy

    return (
        <AsyncContent
            isLoading={draft.isLoading}
            skeleton={<EditorSkeleton />}
            error={draft.loadError}
            errorContent={{
                title: t("loadError.title"),
                description: t("loadError.description"),
                onRetry: draft.reload,
                retryLabel: t("loadError.retry"),
            }}
        >
            <MotionConfig reducedMotion="user">
                <div className="flex flex-col gap-4">
                    <DesignToolbar
                        design={design}
                        onAccent={(accent: CvAccent) => setDesign((prev) => ({ ...prev, accent }))}
                        onDensity={(density: CvDensity) => setDesign((prev) => ({ ...prev, density }))}
                        onFont={(font: CvFontChoice) => setDesign((prev) => ({ ...prev, font }))}
                    />

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                        <SectionRail
                            order={layout.order}
                            hidden={layout.hidden}
                            labels={sectionLabels}
                            onReorder={(order) => setLayout((prev) => ({ ...prev, order }))}
                            onToggle={toggleHidden}
                            onMove={moveInOrder}
                        />
                        <div className="min-w-0 flex-1">
                            <A4Page draft={draft} visibleKeys={visibleKeys} design={design} />
                        </div>
                    </div>

                    {draft.saveError || exportError ? (
                        <Alert status="danger">
                            <Alert.Indicator />
                            <Alert.Content>
                                <Alert.Title>{draft.saveError ?? exportError}</Alert.Title>
                            </Alert.Content>
                        </Alert>
                    ) : null}
                    {draft.errors.length > 0 ? (
                        <Typography
                            id={CV_HEADER_ERROR_ID}
                            type="body-xs"
                            className="text-danger"
                            role="alert"
                        >
                            {t("headerRequired")}
                        </Typography>
                    ) : null}
                    {draft.saved ? (
                        <Typography type="body-sm" className="text-success" role="status">
                            {t("saved")}
                        </Typography>
                    ) : null}

                    <div className="flex flex-wrap items-end gap-3">
                        <TextField variant="primary" className="w-full sm:w-64">
                            <Label className="text-sm">{t("fields.title")}</Label>
                            <Input
                                value={draft.title}
                                onChange={(event) => draft.setTitle(event.target.value)}
                                placeholder={t("fields.titlePlaceholder")}
                            />
                        </TextField>
                        <div className="flex flex-wrap gap-3">
                            <Button
                                variant="primary"
                                onPress={handleReview}
                                isPending={busy === "review" || isReviewBusy}
                                isDisabled={anyBusy}
                            >
                                {t("reviewThisCv")}
                            </Button>
                            <Button
                                variant="secondary"
                                onPress={handleSave}
                                isPending={busy === "save"}
                                isDisabled={anyBusy}
                            >
                                {t("save")}
                            </Button>
                            <Button
                                variant="tertiary"
                                onPress={handleExport}
                                isPending={busy === "pdf"}
                                isDisabled={anyBusy}
                            >
                                <FilePdfIcon aria-hidden focusable="false" className="size-4" />
                                {t("exportPdf")}
                            </Button>
                        </div>
                    </div>
                </div>
            </MotionConfig>
        </AsyncContent>
    )
}
