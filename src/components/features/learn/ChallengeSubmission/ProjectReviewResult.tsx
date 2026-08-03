"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Typography } from "@heroui/react"
import { FileMagnifyingGlassIcon, WarningCircleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { ProjectFileTree, type ProjectFileStatus } from "@/components/blocks/code/ProjectFileTree"
import { ProjectReviewFile, ReviewComment } from "@/components/blocks/code/ProjectReviewFile"
import { GradeResultCard } from "@/components/features/challenge/ChallengeView/GradeCodePanel/GradeResultCard"
import type { CodeChange, CodeGradeResult } from "@/modules/api/rest/ai"
import { useQueryChallengeSubmissionProjectTreeSwr } from "../hooks/useQueryChallengeSubmissionProjectTreeSwr"
import { useQueryChallengeSubmissionProjectFileSwr } from "../hooks/useQueryChallengeSubmissionProjectFileSwr"

/** Props for {@link ProjectReviewResult}. */
export interface ProjectReviewResultProps {
    /** The real challenge UUID the submission belongs to. */
    challengeId: string
    /** The graded project submission to review. */
    submissionId: string
    /** The graded AI feedback — carries `changes` (present ⇒ this is a project review). */
    aiFeedback: CodeGradeResult
}

/** Normalizes a path for map lookups (POSIX separators, strip a leading `./`). */
const normalizePath = (path: string): string => path.replace(/\\/g, "/").replace(/^\.\//, "")

/**
 * Maps a file path's extension to a shiki language id; falls back to `text` (shiki's
 * no-highlight passthrough) for unknown / binary-ish extensions so highlighting never throws.
 */
const SHIKI_LANG_BY_EXTENSION: Record<string, string> = {
    py: "python",
    js: "javascript",
    jsx: "jsx",
    mjs: "javascript",
    cjs: "javascript",
    ts: "typescript",
    tsx: "tsx",
    java: "java",
    c: "c",
    h: "c",
    cpp: "cpp",
    cc: "cpp",
    hpp: "cpp",
    cs: "csharp",
    go: "go",
    php: "php",
    rb: "ruby",
    rs: "rust",
    kt: "kotlin",
    swift: "swift",
    sql: "sql",
    html: "html",
    css: "css",
    scss: "scss",
    json: "json",
    yml: "yaml",
    yaml: "yaml",
    xml: "xml",
    md: "markdown",
    sh: "bash",
    bash: "bash",
    dockerfile: "docker",
}

/** Resolves the shiki language id for a project-relative path (extension-based). */
const shikiLangFromPath = (path: string): string => {
    const name = path.split("/").pop() ?? path
    if (name.toLowerCase() === "dockerfile") {
        return "docker"
    }
    const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : ""
    return SHIKI_LANG_BY_EXTENSION[ext] ?? "text"
}

/**
 * The VS Code-style review of a graded PROJECT submission (PIN §4B). Fetches the file tree
 * from the BE (`project/tree`), colours each file green (clean) / orange (has a flagged
 * change from `aiFeedback.changes`), and on click fetches the file body (`project/file`)
 * to render it with line numbers + shiki highlight + inline GitHub-style review comments.
 * The score/verdict/feedback header reuses {@link GradeResultCard}; every data region is
 * wrapped in {@link AsyncContent} with a layout-mirroring skeleton.
 */
export const ProjectReviewResult = ({
    challengeId,
    submissionId,
    aiFeedback,
}: ProjectReviewResultProps) => {
    const t = useTranslations("learn")
    const { resolvedTheme } = useTheme()
    const shikiTheme = resolvedTheme === "dark" ? "material-theme-darker" : "material-theme-lighter"

    const treeSwr = useQueryChallengeSubmissionProjectTreeSwr(challengeId, submissionId, true)

    // Group the flagged changes by (normalized) path so the tree can colour nodes and the
    // file viewer can pull just its own line comments.
    const changesByPath = useMemo(() => {
        const map = new Map<string, Array<CodeChange>>()
        for (const change of aiFeedback.changes ?? []) {
            const key = normalizePath(change.file)
            const list = map.get(key)
            if (list) {
                list.push(change)
            } else {
                map.set(key, [change])
            }
        }
        return map
    }, [aiFeedback.changes])

    const treePaths = useMemo(
        () => (treeSwr.data ?? []).map((entry) => normalizePath(entry.path)),
        [treeSwr.data],
    )

    // Per-path colour: orange when the path has a flagged change, green otherwise.
    const statusByPath = useMemo(() => {
        const map: Record<string, ProjectFileStatus> = {}
        for (const path of treePaths) {
            map[path] = changesByPath.has(path) ? "changed" : "clean"
        }
        return map
    }, [treePaths, changesByPath])

    // Comments the tree/file viewer can NEVER surface — their `file` is absent from the served
    // tree, OR the tree failed to load at all (a github-URL agentic grade carries `changes` but
    // has no uploaded zip to serve, so `project/tree` errors). Without a flat fallback these
    // per-line suggestions — the feature's whole point — would be silently lost. Computed only
    // once the tree has settled (loaded or errored) so a still-loading tree shows nothing here.
    const treeSettled = treeSwr.data !== undefined || treeSwr.error !== undefined
    const unreachableChanges = useMemo(() => {
        if (!treeSettled) {
            return []
        }
        const treeSet = new Set(treePaths)
        return (aiFeedback.changes ?? []).filter(
            (change) => !treeSet.has(normalizePath(change.file)),
        )
    }, [treeSettled, treePaths, aiFeedback.changes])

    const [selectedPath, setSelectedPath] = useState<string | null>(null)

    // Auto-open the first flagged file once the tree loads, so the review lands on
    // something actionable; only fires while nothing is selected (never overrides a click).
    useEffect(() => {
        if (selectedPath !== null || treePaths.length === 0) {
            return
        }
        const firstChanged = treePaths.find((path) => changesByPath.has(path))
        if (firstChanged) {
            setSelectedPath(firstChanged)
        }
    }, [selectedPath, treePaths, changesByPath])

    const fileSwr = useQueryChallengeSubmissionProjectFileSwr(
        challengeId,
        submissionId,
        selectedPath ?? "",
        selectedPath !== null,
    )

    const filesReadCount = aiFeedback.files_read?.length ?? 0

    return (
        <div className="flex flex-col gap-4">
            {/* Score / verdict / feedback header — the same card as a plain code grade. */}
            <GradeResultCard result={aiFeedback} />

            {/* "Trích đọc" — how much of the project the agentic grader opened. */}
            {filesReadCount > 0 ? (
                <Typography type="body-xs" color="muted">
                    {t("exercises.project.filesReadHint", {
                        count: filesReadCount,
                        iterations: aiFeedback.iterations ?? 0,
                    })}
                </Typography>
            ) : null}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
                {/* LEFT — the VS Code tree, coloured by review status. */}
                <div className="flex flex-col gap-2">
                    <Typography type="body-xs" weight="semibold" color="muted">
                        {t("exercises.project.treeTitle")}
                    </Typography>
                    <AsyncContent
                        isLoading={treeSwr.isLoading && !treeSwr.data}
                        skeleton={<ProjectTreeSkeleton />}
                        isEmpty={Boolean(treeSwr.data) && treePaths.length === 0}
                        emptyContent={{ title: t("exercises.project.treeEmpty") }}
                        error={!treeSwr.data ? treeSwr.error : undefined}
                        errorContent={{
                            title: t("exercises.project.treeError"),
                            onRetry: () => { void treeSwr.mutate() },
                            retryLabel: t("common.retry"),
                        }}
                    >
                        <div className="max-h-[32rem] overflow-y-auto rounded-2xl border border-default bg-surface p-2">
                            <ProjectFileTree
                                paths={treePaths}
                                statusByPath={statusByPath}
                                selectedPath={selectedPath ?? undefined}
                                onSelect={setSelectedPath}
                            />
                        </div>
                        {/* Legend — what the two colours mean. */}
                        <div className="mt-2 flex flex-wrap items-center gap-4 px-1">
                            <span className="flex items-center gap-2">
                                <span aria-hidden className="size-2 rounded-full bg-success" />
                                <Typography type="body-xs" color="muted">
                                    {t("exercises.project.noChanges")}
                                </Typography>
                            </span>
                            <span className="flex items-center gap-2">
                                <span aria-hidden className="size-2 rounded-full bg-warning" />
                                <Typography type="body-xs" color="muted">
                                    {t("exercises.project.hasChanges")}
                                </Typography>
                            </span>
                        </div>
                    </AsyncContent>
                </div>

                {/* RIGHT — the selected file's content + inline review comments. */}
                <div className="min-w-0">
                    {selectedPath === null ? (
                        <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-default p-6 text-center">
                            <FileMagnifyingGlassIcon aria-hidden focusable="false" className="size-8 text-muted" />
                            <Typography type="body-sm" color="muted">
                                {t("exercises.project.selectFileHint")}
                            </Typography>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <Typography type="body-xs" weight="medium" className="truncate font-mono">
                                {selectedPath}
                            </Typography>
                            <AsyncContent
                                isLoading={fileSwr.isLoading && !fileSwr.data}
                                skeleton={<Skeleton className="h-64 w-full rounded-2xl" />}
                                error={!fileSwr.data ? fileSwr.error : undefined}
                                errorContent={{
                                    title: t("exercises.project.fileError"),
                                    onRetry: () => { void fileSwr.mutate() },
                                    retryLabel: t("common.retry"),
                                }}
                            >
                                {fileSwr.data ? (
                                    <ProjectReviewFile
                                        content={fileSwr.data.content}
                                        language={shikiLangFromPath(selectedPath)}
                                        theme={shikiTheme}
                                        changes={changesByPath.get(selectedPath) ?? []}
                                        reasonLabel={t("exercises.project.reason")}
                                        suggestionLabel={t("exercises.project.suggestion")}
                                    />
                                ) : null}
                            </AsyncContent>
                        </div>
                    )}
                </div>
            </div>

            {/* Safety net — every flagged change whose file the tree can't open (path not in the
                served tree, or the tree failed to load) rendered as a flat list, so no per-line
                review is silently swallowed. Empty on the happy path (all files in the tree). */}
            {unreachableChanges.length > 0 ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-warning/40 bg-warning/5 p-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <WarningCircleIcon aria-hidden focusable="false" className="size-4 shrink-0 text-warning" />
                            <Typography type="body-sm" weight="semibold" className="text-warning">
                                {t("exercises.project.unanchoredTitle")}
                            </Typography>
                        </div>
                        <Typography type="body-xs" color="muted">
                            {t("exercises.project.unanchoredHint")}
                        </Typography>
                    </div>
                    <div className="flex flex-col gap-3">
                        {unreachableChanges.map((change, index) => (
                            <div
                                key={index}
                                className="flex flex-col gap-3 rounded-xl border border-default bg-background p-3"
                            >
                                <Typography type="body-xs" weight="medium" className="truncate font-mono text-muted">
                                    {change.line >= 1
                                        ? t("exercises.project.fileLine", { file: change.file, line: change.line })
                                        : change.file}
                                </Typography>
                                <ReviewComment
                                    comment={change}
                                    reasonLabel={t("exercises.project.reason")}
                                    suggestionLabel={t("exercises.project.suggestion")}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    )
}

/** Skeleton mirroring the file tree — a stack of indented rows. */
const ProjectTreeSkeleton = () => (
    <div className="flex flex-col gap-2 rounded-2xl border border-default bg-surface p-3">
        {[0, 1, 2, 3, 4, 5].map((row) => (
            <div
                key={row}
                style={{ width: `${70 - (row % 3) * 12}%`, marginInlineStart: `${(row % 3) * 14}px` }}
            >
                <Skeleton className="h-5 rounded-md" />
            </div>
        ))}
    </div>
)
