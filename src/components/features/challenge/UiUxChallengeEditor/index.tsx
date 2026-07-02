"use client"

import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react"
import {
    Button,
    Checkbox,
    Chip,
    Skeleton,
    Tabs,
    Typography,
    cn,
} from "@heroui/react"
import {
    ArrowClockwiseIcon,
    CheckCircleIcon,
    CodeIcon,
    ImageIcon,
    ListChecksIcon,
    PaintBrushIcon,
    TextAlignLeftIcon,
} from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { CodeEditor, type CodeLanguage } from "./CodeEditor"
import { PreviewFrame } from "./PreviewFrame"
import {
    useMutateSubmitUiUxChallengeSwr,
    type SubmitUiUxChallengeResult,
} from "../hooks/useMutateSubmitUiUxChallengeSwr"
import type { ChallengeSolve, UiUxStarter } from "../hooks/useQueryChallengeSolveSwr"

/** localStorage draft key namespace. */
const DRAFT_KEY_PREFIX = "ftesaos-uiux-draft:"

/** Editor code tabs. */
type EditorTab = "html" | "css" | "js"
/** Mobile top-level panes. */
type MobilePane = "editor" | "preview" | "brief"

const LANGUAGE_OF: Record<EditorTab, CodeLanguage> = {
    html: "html",
    css: "css",
    js: "javascript",
}

/** Props for {@link UiUxChallengeEditor}. */
export interface UiUxChallengeEditorProps extends WithClassNames<undefined> {
    /** The loaded UI/UX challenge (mock). */
    challenge: ChallengeSolve
}

/**
 * Live HTML/CSS/JS editor + sandboxed preview for solving a `uiux` challenge.
 *
 * Local state only (canon: closed-scope state stays local — no Redux/Zustand):
 * `{html, css, js}` seeded from `challenge.starter`, hydrated from localStorage on
 * mount, autosaved on a debounce. Desktop = split pane (editor | preview + target);
 * mobile = stacked with tabs (Soạn / Xem trước / Đề bài). Enroll gate overlays the
 * editor when locked (unlock = enroll the course, NOT VIP).
 *
 * @param props - {@link UiUxChallengeEditorProps}
 */
export const UiUxChallengeEditor = ({
    challenge,
    className,
}: UiUxChallengeEditorProps) => {
    const t = useTranslations("challengeSystem")
    const locale = useLocale()
    const router = useRouter()

    const draftKey = `${DRAFT_KEY_PREFIX}${challenge.id}`

    const [html, setHtml] = useState(challenge.starter.html)
    const [css, setCss] = useState(challenge.starter.css)
    const [js, setJs] = useState(challenge.starter.js)
    const [activeTab, setActiveTab] = useState<EditorTab>("html")
    const [mobilePane, setMobilePane] = useState<MobilePane>("editor")
    const [saved, setSaved] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)
    const [checked, setChecked] = useState<Array<boolean>>(() =>
        challenge.requirements.map(() => false),
    )
    const [result, setResult] = useState<SubmitUiUxChallengeResult | null>(null)

    const formatterRef = useRef<(() => void) | null>(null)
    const hydratedRef = useRef(false)

    const { trigger: submit, isMutating } = useMutateSubmitUiUxChallengeSwr()

    // Hydrate draft from localStorage once on mount; else keep the starter seed.
    useEffect(() => {
        if (hydratedRef.current) return
        hydratedRef.current = true
        try {
            const raw = window.localStorage.getItem(draftKey)
            if (raw) {
                const draft = JSON.parse(raw) as Partial<UiUxStarter>
                if (typeof draft.html === "string") setHtml(draft.html)
                if (typeof draft.css === "string") setCss(draft.css)
                if (typeof draft.js === "string") setJs(draft.js)
                setSaved(true)
            }
        } catch {
            // corrupt draft → ignore, fall back to starter
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draftKey])

    // Autosave draft on a debounce after edits settle.
    useEffect(() => {
        if (!hydratedRef.current) return
        const timer = window.setTimeout(() => {
            try {
                window.localStorage.setItem(
                    draftKey,
                    JSON.stringify({ html, css, js }),
                )
                setSaved(true)
            } catch {
                // storage full / disabled → silently skip autosave
            }
        }, 600)
        return () => window.clearTimeout(timer)
    }, [html, css, js, draftKey])

    const handleReset = useCallback(() => {
        setHtml(challenge.starter.html)
        setCss(challenge.starter.css)
        setJs(challenge.starter.js)
        setChecked(challenge.requirements.map(() => false))
        setResult(null)
        setSaved(false)
        try {
            window.localStorage.removeItem(draftKey)
        } catch {
            // ignore
        }
    }, [challenge.starter, challenge.requirements, draftKey])

    const handleSubmit = useCallback(async () => {
        const checkedCount = checked.filter(Boolean).length
        const res = await submit({
            total: challenge.requirements.length,
            checked: checkedCount,
            hasHtml: html.trim().length > 0,
        })
        setResult(res)
    }, [checked, challenge.requirements.length, html, submit])

    const activeValue = activeTab === "html" ? html : activeTab === "css" ? css : js
    const setActiveValue = (value: string) => {
        setSaved(false)
        if (activeTab === "html") setHtml(value)
        else if (activeTab === "css") setCss(value)
        else setJs(value)
    }

    const tabItems: Array<{ key: EditorTab; label: string; icon: React.ReactNode }> = [
        { key: "html", label: "HTML", icon: <CodeIcon className="size-5" aria-hidden focusable="false" /> },
        { key: "css", label: "CSS", icon: <PaintBrushIcon className="size-5" aria-hidden focusable="false" /> },
        { key: "js", label: "JS", icon: <CodeIcon className="size-5" aria-hidden focusable="false" /> },
    ]

    // ── Editor pane (tabs + Monaco + toolbar) ──────────────────────────────────
    const editorPane = (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-default bg-surface">
            <div className="flex items-center justify-between gap-2 border-b border-separator px-3 py-2">
                <Tabs
                    aria-label={t("uiuxEditor.tabsAriaLabel")}
                    selectedKey={activeTab}
                    onSelectionChange={(key) => setActiveTab(key as EditorTab)}
                >
                    <Tabs.List>
                        {tabItems.map((item) => (
                            <Tabs.Tab
                                key={item.key}
                                id={item.key}
                                aria-label={item.label}
                            >
                                <span className="flex items-center gap-2">
                                    {item.icon}
                                    <span className="hidden sm:inline">{item.label}</span>
                                </span>
                            </Tabs.Tab>
                        ))}
                    </Tabs.List>
                </Tabs>
                <div className="flex shrink-0 items-center gap-1">
                    <Button
                        size="sm"
                        variant="ghost"
                        aria-label={t("uiuxEditor.format")}
                        onPress={() => formatterRef.current?.()}
                    >
                        <TextAlignLeftIcon className="size-5" aria-hidden focusable="false" />
                        <span className="hidden sm:inline">{t("uiuxEditor.format")}</span>
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        aria-label={t("uiuxEditor.reset")}
                        onPress={handleReset}
                    >
                        <ArrowClockwiseIcon className="size-5" aria-hidden focusable="false" />
                        <span className="hidden sm:inline">{t("uiuxEditor.reset")}</span>
                    </Button>
                </div>
            </div>
            <div className="min-h-0 flex-1">
                <CodeEditor
                    value={activeValue}
                    onChange={setActiveValue}
                    language={LANGUAGE_OF[activeTab]}
                    ariaLabel={t("uiuxEditor.editorLabel", { lang: activeTab.toUpperCase() })}
                    fallbackHint={t("uiuxEditor.fallbackHint")}
                    onFormatterReady={(format) => {
                        formatterRef.current = format
                    }}
                />
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-separator px-3 py-2">
                <span className="flex items-center gap-1 text-muted">
                    <CheckCircleIcon
                        className={cn("size-4", saved ? "text-success" : "text-muted")}
                        aria-hidden
                        focusable="false"
                    />
                    <Typography type="body-xs" color="muted">
                        {saved ? t("uiuxEditor.saved") : t("uiuxEditor.unsaved")}
                    </Typography>
                </span>
                <Button
                    size="sm"
                    variant="primary"
                    isPending={isMutating}
                    isDisabled={isMutating}
                    onPress={() => void handleSubmit()}
                >
                    {t("uiuxEditor.submit")}
                </Button>
            </div>
        </div>
    )

    // ── Preview pane ───────────────────────────────────────────────────────────
    const previewPane = (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-default bg-surface">
            <div className="border-b border-separator px-3 py-2">
                <Typography type="body-sm" weight="medium">
                    {t("uiuxEditor.preview")}
                </Typography>
            </div>
            <div className="min-h-0 flex-1">
                <PreviewFrame
                    html={html}
                    css={css}
                    js={js}
                    title={t("uiuxEditor.previewTitle")}
                />
            </div>
        </div>
    )

    // ── Target + checklist panel ───────────────────────────────────────────────
    const briefPane = (
        <div className="flex flex-col gap-3">
            <div className="overflow-hidden rounded-3xl border border-default bg-surface">
                <div className="flex items-center gap-2 border-b border-separator px-3 py-2">
                    <ImageIcon className="size-5 text-muted" aria-hidden focusable="false" />
                    <Typography type="body-sm" weight="medium">
                        {t("uiuxEditor.target")}
                    </Typography>
                </div>
                <div className="relative aspect-video w-full bg-default">
                    {!imageLoaded ? (
                        <Skeleton className="absolute inset-0 size-full rounded-none" />
                    ) : null}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={challenge.targetImageUrl}
                        alt={t("uiuxEditor.targetAlt", { title: challenge.title })}
                        onLoad={() => setImageLoaded(true)}
                        className={cn(
                            "size-full object-cover transition-opacity",
                            imageLoaded ? "opacity-100" : "opacity-0",
                        )}
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-default bg-surface">
                <div className="flex items-center gap-2 border-b border-separator px-3 py-2">
                    <ListChecksIcon className="size-5 text-muted" aria-hidden focusable="false" />
                    <Typography type="body-sm" weight="medium">
                        {t("uiuxEditor.requirements")}
                    </Typography>
                </div>
                <ul className="flex flex-col gap-2 p-3">
                    {challenge.requirements.map((req, index) => (
                        <li key={req}>
                            <Checkbox
                                isSelected={checked[index]}
                                onChange={(next: boolean) =>
                                    setChecked((prev) => {
                                        const copy = [...prev]
                                        copy[index] = next
                                        return copy
                                    })
                                }
                            >
                                <Typography type="body-sm">{req}</Typography>
                            </Checkbox>
                        </li>
                    ))}
                </ul>
            </div>

            {result ? (
                <div className="flex flex-col gap-1 rounded-3xl border border-default bg-surface p-4">
                    <div className="flex items-center justify-between gap-2">
                        <Typography type="body-sm" weight="medium">
                            {t("uiuxEditor.resultTitle")}
                        </Typography>
                        <Chip
                            size="sm"
                            variant="soft"
                            color={result.passed ? "success" : "warning"}
                        >
                            {t("uiuxEditor.scoreValue", { score: result.score })}
                        </Chip>
                    </div>
                    <Typography type="body-xs" color="muted">
                        {result.passed ? t("uiuxEditor.passed") : t("uiuxEditor.notPassed")}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                        {t("uiuxEditor.mockNote")}
                    </Typography>
                </div>
            ) : null}
        </div>
    )

    // ── Enroll gate overlay (unlock = enroll course, NOT VIP) ──────────────────
    const gate = challenge.isLocked ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-default bg-surface p-8 text-center">
            <Typography type="h5" weight="bold">
                {t("uiuxEditor.gateTitle")}
            </Typography>
            <Typography type="body-sm" color="muted" className="max-w-md">
                {t("uiuxEditor.gateDescription")}
            </Typography>
            <Button
                variant="primary"
                onPress={() =>
                    router.push(`/${locale}/courses/${challenge.courseId}`)
                }
            >
                {t("uiuxEditor.gateCta")}
            </Button>
        </div>
    ) : null

    if (gate) {
        return (
            <div className={cn("mx-auto w-full max-w-6xl p-6", className)}>
                {gate}
            </div>
        )
    }

    return (
        <div className={cn("flex w-full flex-col gap-6 p-4 sm:p-6", className)}>
            {/* Mobile pane switcher */}
            <div className="sm:hidden">
                <Tabs
                    aria-label={t("uiuxEditor.paneTabsAriaLabel")}
                    selectedKey={mobilePane}
                    onSelectionChange={(key) => setMobilePane(key as MobilePane)}
                >
                    <Tabs.List>
                        <Tabs.Tab id="editor">{t("uiuxEditor.paneEditor")}</Tabs.Tab>
                        <Tabs.Tab id="preview">{t("uiuxEditor.panePreview")}</Tabs.Tab>
                        <Tabs.Tab id="brief">{t("uiuxEditor.paneBrief")}</Tabs.Tab>
                    </Tabs.List>
                </Tabs>
            </div>

            {/* Desktop: split pane (editor | preview + target). Mobile: one pane. */}
            <div className="flex min-h-[70vh] flex-col gap-4 lg:flex-row">
                <div
                    className={cn(
                        "flex min-h-[60vh] flex-1 flex-col lg:min-h-0",
                        mobilePane === "editor" ? "flex" : "hidden lg:flex",
                    )}
                >
                    {editorPane}
                </div>
                <div
                    className={cn(
                        "flex min-h-0 flex-1 flex-col gap-4",
                        mobilePane === "preview" || mobilePane === "brief"
                            ? "flex"
                            : "hidden lg:flex",
                    )}
                >
                    <div
                        className={cn(
                            "flex min-h-[50vh] flex-1 flex-col",
                            mobilePane === "preview" ? "flex" : "hidden lg:flex",
                        )}
                    >
                        {previewPane}
                    </div>
                    <div
                        className={cn(
                            mobilePane === "brief" ? "flex flex-col" : "hidden lg:flex lg:flex-col",
                        )}
                    >
                        {briefPane}
                    </div>
                </div>
            </div>
        </div>
    )
}
