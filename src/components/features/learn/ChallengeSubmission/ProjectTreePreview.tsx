"use client"

import React from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { ArrowCounterClockwiseIcon, FolderOpenIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { ProjectFileTree } from "@/components/blocks/code/ProjectFileTree"

/** Props for {@link ProjectTreePreview}. */
export interface ProjectTreePreviewProps {
    /** Archive name shown in the header (the picked zip / derived folder name). */
    fileName: string
    /** Project-relative paths to preview (from the prepared archive). */
    paths: Array<string>
    /** Reset the picked project so the learner can choose a different one. */
    onClear: () => void
}

/**
 * Pre-submit preview of a prepared project (PIN §4A). Shown BETWEEN picking a `.zip` /
 * folder and Submit — replaces the plain `file.name` chip with the actual file tree the
 * learner is about to submit, so they can confirm the right files (and nothing stray) go
 * to the grader. Feature-level: owns i18n + the header/scroll chrome; the tree itself is
 * the pure {@link ProjectFileTree} block (no status colouring pre-grade).
 */
export const ProjectTreePreview = ({ fileName, paths, onClear }: ProjectTreePreviewProps) => {
    const t = useTranslations("learn")
    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-default bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                    <FolderOpenIcon aria-hidden focusable="false" className="size-5 shrink-0 text-accent" />
                    <Typography type="body-sm" weight="medium" className="min-w-0 truncate">
                        {fileName}
                    </Typography>
                    <Chip size="sm" variant="soft" className="shrink-0">
                        {t("exercises.project.fileCount", { count: paths.length })}
                    </Chip>
                </div>
                <Button
                    variant="tertiary"
                    size="sm"
                    className="shrink-0"
                    onPress={onClear}
                >
                    <ArrowCounterClockwiseIcon aria-hidden focusable="false" className="size-4" />
                    {t("exercises.project.clear")}
                </Button>
            </div>
            <div className="max-h-80 overflow-y-auto rounded-xl border border-default bg-background p-2">
                <ProjectFileTree paths={paths} />
            </div>
        </div>
    )
}
