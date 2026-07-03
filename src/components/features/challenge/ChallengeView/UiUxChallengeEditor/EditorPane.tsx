"use client"

import React, { useEffect, useRef, useState } from "react"
import type { ComponentType } from "react"
import { Button, Chip, Skeleton, Tabs, cn } from "@heroui/react"
import type { EditorProps } from "@monaco-editor/react"
import { ArrowCounterClockwiseIcon, CheckIcon, MagicWandIcon } from "@phosphor-icons/react"
import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"
import { ExtendedTabs } from "@/components/blocks/navigation/ExtendedTabs"

import type { ChallengeStarter } from "../../hooks/useQueryChallengeSwr"

/** Editor language tab keys, mapped to Monaco language ids. */
export type EditorLang = "html" | "css" | "js"

const MONACO_LANGUAGE: Record<EditorLang, string> = {
    html: "html",
    css: "css",
    js: "javascript",
}

const LANGS: Array<EditorLang> = ["html", "css", "js"]

/** Minimal shape of the Monaco editor instance we drive (format action only). */
interface MonacoEditorHandle {
    getAction: (id: string) => { run: () => Promise<void> } | null
}

/** Props for {@link EditorPane}. */
export interface EditorPaneProps {
    /** Current code per language. */
    code: ChallengeStarter
    /** Fired when the learner edits the active language. */
    onChangeCode: (lang: EditorLang, value: string) => void
    /** Reset to starter + clear the local draft. */
    onReset: () => void
    /** Local draft has diverged from starter and is persisted. */
    draftSaved: boolean
    /** Premium gate — render read-only, hide toolbar actions. */
    readOnly: boolean
    className?: string
}

/**
 * The code pane of the UI/UX challenge editor: HTML/CSS/JS tabs + Monaco
 * (loaded client-side on demand) + a Reset/Format toolbar with the autosave
 * indicator. If Monaco fails to load (e.g. CDN blocked) it degrades to a flat
 * textarea per language so the learner is never blocked.
 */
export const EditorPane = ({
    code,
    onChangeCode,
    onReset,
    draftSaved,
    readOnly,
    className,
}: EditorPaneProps) => {
    const t = useTranslations("challenge")
    const { resolvedTheme } = useTheme()
    const [lang, setLang] = useState<EditorLang>("html")
    const [MonacoEditor, setMonacoEditor] = useState<ComponentType<EditorProps> | null>(null)
    const [monacoFailed, setMonacoFailed] = useState(false)
    const editorRef = useRef<MonacoEditorHandle | null>(null)

    // ponytail: load Monaco lazily in an effect instead of next/dynamic — same
    // client-only code-split, but with a catchable failure for the textarea fallback.
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

    const formatDocument = () => {
        void editorRef.current?.getAction("editor.action.formatDocument")?.run()
    }

    return (
        <div className={cn("flex min-h-0 flex-col gap-3", className)}>
            {/* toolbar: language tabs + autosave indicator + reset/format */}
            <div className="flex flex-wrap items-center gap-2">
                <ExtendedTabs
                    selectedKey={lang}
                    onSelectionChange={(key) => setLang(key as EditorLang)}
                >
                    <Tabs.ListContainer>
                        <Tabs.List aria-label={t("uiuxEditor.editorLabel")}>
                            {LANGS.map((key) => (
                                <Tabs.Tab key={key} id={key}>
                                    {t(`uiuxEditor.codeTabs.${key}`)}
                                </Tabs.Tab>
                            ))}
                        </Tabs.List>
                    </Tabs.ListContainer>
                </ExtendedTabs>
                <div className="ml-auto flex items-center gap-2">
                    {draftSaved ? (
                        <Chip size="sm" variant="soft" color="success">
                            <CheckIcon className="size-4" aria-hidden focusable="false" />
                            {t("uiuxEditor.draftSaved")}
                        </Chip>
                    ) : null}
                    {!readOnly ? (
                        <>
                            <Button size="sm" variant="ghost" onPress={onReset}>
                                <ArrowCounterClockwiseIcon
                                    className="size-4"
                                    aria-hidden
                                    focusable="false"
                                />
                                {t("uiuxEditor.reset")}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                isDisabled={!MonacoEditor}
                                onPress={formatDocument}
                            >
                                <MagicWandIcon className="size-4" aria-hidden focusable="false" />
                                {t("uiuxEditor.format")}
                            </Button>
                        </>
                    ) : null}
                </div>
            </div>

            {/* editor surface: Monaco → textarea fallback → loading skeleton */}
            <div
                className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-separator"
                aria-label={t("uiuxEditor.editorLabel")}
            >
                {MonacoEditor ? (
                    <MonacoEditor
                        height="100%"
                        language={MONACO_LANGUAGE[lang]}
                        value={code[lang]}
                        theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
                        onChange={(value) => onChangeCode(lang, value ?? "")}
                        onMount={(editor) => {
                            editorRef.current = editor as unknown as MonacoEditorHandle
                        }}
                        options={{
                            readOnly,
                            minimap: { enabled: false },
                            fontSize: 13,
                            wordWrap: "on",
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                        }}
                    />
                ) : monacoFailed ? (
                    <div className="flex h-full flex-col gap-2 p-3">
                        <span className="text-xs text-muted">
                            {t("uiuxEditor.fallbackHint", {
                                language: t(`uiuxEditor.codeTabs.${lang}`),
                            })}
                        </span>
                        <textarea
                            value={code[lang]}
                            readOnly={readOnly}
                            onChange={(event) => onChangeCode(lang, event.target.value)}
                            aria-label={t(`uiuxEditor.codeTabs.${lang}`)}
                            spellCheck={false}
                            className="min-h-0 w-full flex-1 resize-none bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-muted"
                        />
                    </div>
                ) : (
                    <Skeleton className="h-full w-full" />
                )}
            </div>
        </div>
    )
}
