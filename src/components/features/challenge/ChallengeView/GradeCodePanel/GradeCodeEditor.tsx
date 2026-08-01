"use client"

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import type { ComponentType } from "react"
import { Skeleton, cn } from "@heroui/react"
import type { EditorProps } from "@monaco-editor/react"
import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"

/** Minimal shape of the Monaco editor instance we drive (format action only). */
interface MonacoEditorHandle {
    getAction: (id: string) => { run: () => Promise<void> } | null
}

/** Imperative handle exposed to the panel — triggers Monaco's format action. */
export interface GradeCodeEditorHandle {
    /** Runs `editor.action.formatDocument` (no-op in the textarea fallback). */
    format: () => void
}

/** Props for {@link GradeCodeEditor}. */
export interface GradeCodeEditorProps {
    /** Controlled source. */
    value: string
    /** Fired on every edit. */
    onChange: (value: string) => void
    /** Monaco language id (`python`, `sql`, …). */
    language: string
    /** Disable editing while a run/grade is in flight. */
    disabled?: boolean
    /** Reports whether Monaco is live (false → textarea fallback, so Format is unavailable). */
    onReadyChange?: (ready: boolean) => void
    className?: string
}

/**
 * The code surface of the sandbox panel: Monaco loaded lazily client-side (same split
 * as `UiUxChallengeEditor/EditorPane` — an in-effect `import().then(loader.init())` with
 * a catchable failure) that degrades to a flat textarea if the CDN is blocked, so the
 * learner is never stuck. Theme follows the app theme; the panel drives Format via the
 * exposed {@link GradeCodeEditorHandle}.
 */
export const GradeCodeEditor = forwardRef<GradeCodeEditorHandle, GradeCodeEditorProps>(
    ({ value, onChange, language, disabled, onReadyChange, className }, ref) => {
        const t = useTranslations("learn")
        const { resolvedTheme } = useTheme()
        const [MonacoEditor, setMonacoEditor] = useState<ComponentType<EditorProps> | null>(null)
        const [monacoFailed, setMonacoFailed] = useState(false)
        const editorRef = useRef<MonacoEditorHandle | null>(null)

        // Load Monaco lazily in an effect instead of next/dynamic — same client-only
        // code-split, but with a catchable failure for the textarea fallback.
        useEffect(() => {
            let mounted = true
            import("@monaco-editor/react")
                .then(async (mod) => {
                    await mod.loader.init()
                    return mod.default
                })
                .then((Editor) => {
                    if (mounted) setMonacoEditor(() => Editor)
                })
                .catch(() => {
                    if (mounted) setMonacoFailed(true)
                })
            return () => {
                mounted = false
            }
        }, [])

        useEffect(() => {
            onReadyChange?.(MonacoEditor !== null)
        }, [MonacoEditor, onReadyChange])

        useImperativeHandle(
            ref,
            () => ({
                format: () => {
                    void editorRef.current?.getAction("editor.action.formatDocument")?.run()
                },
            }),
            [],
        )

        return (
            <div
                className={cn("overflow-hidden rounded-2xl border border-separator", className)}
                aria-label={t("codeGrading.yourCode")}
            >
                {MonacoEditor ? (
                    <MonacoEditor
                        height="24rem"
                        language={language}
                        value={value}
                        theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
                        onChange={(next) => onChange(next ?? "")}
                        onMount={(editor) => {
                            editorRef.current = editor as unknown as MonacoEditorHandle
                        }}
                        options={{
                            readOnly: disabled,
                            minimap: { enabled: false },
                            fontSize: 13,
                            wordWrap: "on",
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                        }}
                    />
                ) : monacoFailed ? (
                    <div className="flex h-96 flex-col gap-2 p-3">
                        <span className="text-xs text-muted">{t("codeGrading.editorFallback")}</span>
                        <textarea
                            value={value}
                            disabled={disabled}
                            onChange={(event) => onChange(event.target.value)}
                            placeholder={t("codeGrading.codePlaceholder")}
                            aria-label={t("codeGrading.yourCode")}
                            spellCheck={false}
                            className="min-h-0 w-full flex-1 resize-none bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-muted"
                        />
                    </div>
                ) : (
                    <Skeleton className="h-96 w-full" />
                )}
            </div>
        )
    },
)

GradeCodeEditor.displayName = "GradeCodeEditor"
