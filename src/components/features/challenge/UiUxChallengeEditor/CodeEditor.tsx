"use client"

import React, {
    useRef,
    useState,
} from "react"
import dynamic from "next/dynamic"
import { cn } from "@heroui/react"
import { useTheme } from "next-themes"
import type { WithClassNames } from "@/modules/types/base/class-name"
import type { OnMount } from "@monaco-editor/react"

/**
 * Monaco loaded dynamically, client-only (`ssr: false`) — guards the webpack build
 * against Monaco's `self`/worker access during SSR and keeps it out of the initial
 * bundle. While the chunk loads, `loading` renders the flat fallback textarea so the
 * learner is never blocked.
 */
const MonacoEditor = dynamic(
    () => import("@monaco-editor/react").then((mod) => mod.Editor),
    { ssr: false },
)

/** Supported editor languages (one per tab). */
export type CodeLanguage = "html" | "css" | "javascript"

/** Props for {@link CodeEditor}. */
export interface CodeEditorProps extends WithClassNames<undefined> {
    /** Current code value. */
    value: string
    /** Fired with the full new value on every change. */
    onChange: (value: string) => void
    /** Monaco language id, drives syntax highlighting. */
    language: CodeLanguage
    /** Accessible label (the active tab's language). */
    ariaLabel: string
    /** Fallback textarea placeholder / syntax hint. */
    fallbackHint: string
    /**
     * Registers Monaco's format action so the parent toolbar can trigger it.
     * Called with a formatter fn, or `null` when Monaco is unavailable (fallback).
     */
    onFormatterReady: (format: (() => void) | null) => void
}

/**
 * Single-language code pane. Renders Monaco when the chunk resolves; if Monaco fails
 * to load (offline / blocked), degrades to a flat `<textarea>` with a syntax hint —
 * the learner can still edit. The parent owns the value; this pane is controlled.
 *
 * @param props - {@link CodeEditorProps}
 */
export const CodeEditor = ({
    value,
    onChange,
    language,
    ariaLabel,
    fallbackHint,
    onFormatterReady,
    className,
}: CodeEditorProps) => {
    const { resolvedTheme } = useTheme()
    const [failed, setFailed] = useState(false)
    const editorRef = useRef<Parameters<OnMount>[0] | null>(null)

    const handleMount: OnMount = (editor) => {
        editorRef.current = editor
        onFormatterReady(() => {
            void editor.getAction("editor.action.formatDocument")?.run()
        })
    }

    if (failed) {
        return (
            <textarea
                aria-label={ariaLabel}
                value={value}
                spellCheck={false}
                onChange={(event) => onChange(event.target.value)}
                placeholder={fallbackHint}
                className={cn(
                    "size-full resize-none bg-transparent p-3 font-mono text-sm text-foreground outline-none placeholder:text-muted",
                    className,
                )}
            />
        )
    }

    return (
        <div className={cn("size-full", className)} aria-label={ariaLabel}>
            <MonacoEditor
                language={language}
                value={value}
                theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
                onChange={(next) => onChange(next ?? "")}
                onMount={handleMount}
                loading={
                    <textarea
                        aria-label={ariaLabel}
                        value={value}
                        spellCheck={false}
                        onChange={(event) => onChange(event.target.value)}
                        placeholder={fallbackHint}
                        className="size-full resize-none bg-transparent p-3 font-mono text-sm text-foreground outline-none placeholder:text-muted"
                    />
                }
                options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    tabSize: 2,
                    automaticLayout: true,
                    padding: { top: 12, bottom: 12 },
                }}
                beforeMount={() => setFailed(false)}
                // If the loader promise rejects, dynamic() surfaces nothing to catch here;
                // the fallback path is driven by an error boundary at the wrapper level.
            />
        </div>
    )
}
