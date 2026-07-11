"use client"

import React, { useEffect, useState } from "react"
import { Button, Chip, Spinner, Tabs, Typography, cn } from "@heroui/react"
import { LockIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { ExtendedTabs } from "@/components/blocks/navigation/ExtendedTabs"

import { useMutateSubmitUiUxChallengeSwr } from "../../hooks/useMutateSubmitUiUxChallengeSwr"
import type { ChallengeDetail, ChallengeStarter } from "../../hooks/useQueryChallengeSwr"
import { EditorPane } from "./EditorPane"
import type { EditorLang } from "./EditorPane"
import { TargetPanel } from "./TargetPanel"

/** Mobile pane keys — stacked layout switches between them via tabs. */
type MobilePane = "editor" | "preview" | "brief"

const MOBILE_PANES: Array<MobilePane> = ["editor", "preview", "brief"]

/** localStorage draft key, per challenge (mock autosave, per-device). */
const draftKey = (challengeId: string) => `ftesaos-uiux-draft:${challengeId}`

const readDraft = (challengeId: string): ChallengeStarter | null => {
    if (typeof window === "undefined") return null
    try {
        const raw = window.localStorage.getItem(draftKey(challengeId))
        if (!raw) return null
        const parsed = JSON.parse(raw) as Partial<ChallengeStarter>
        return {
            html: typeof parsed.html === "string" ? parsed.html : "",
            css: typeof parsed.css === "string" ? parsed.css : "",
            js: typeof parsed.js === "string" ? parsed.js : "",
        }
    } catch {
        return null
    }
}

/** Compose the sandboxed preview document from the three sources. */
const composeSrcDoc = ({ html, css, js }: ChallengeStarter) =>
    `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}<script>${js}</script></body></html>`

/** Props for {@link UiUxChallengeEditor}. */
export interface UiUxChallengeEditorProps {
    challenge: ChallengeDetail
}

/**
 * The UI/UX challenge solve surface: split-pane editor (HTML/CSS/JS via Monaco)
 * | live sandboxed iframe preview + target design & requirement checklist.
 * Desktop = 2-column split; mobile = stacked with Soạn/Xem trước/Đề bài tabs.
 * Drafts autosave to localStorage (mock); Submit runs a mock FE scoring —
 * BE grading is GIẢ ĐỊNH. Premium gate = ENROLL the course (not VIP).
 */
export const UiUxChallengeEditor = ({ challenge }: UiUxChallengeEditorProps) => {
    const t = useTranslations("challenge")
    const router = useRouter()
    // hydrate from the local draft first, else seed from starter (same ref — used
    // by the autosave effect to mean "not diverged yet")
    const [code, setCode] = useState<ChallengeStarter>(
        () => readDraft(challenge.id) ?? challenge.starter,
    )
    const [srcDoc, setSrcDoc] = useState(() => composeSrcDoc(code))
    const [draftSaved, setDraftSaved] = useState(code !== challenge.starter)
    const [mobilePane, setMobilePane] = useState<MobilePane>("editor")
    const [checked, setChecked] = useState<Array<boolean>>(() =>
        challenge.requirements.map(() => false),
    )
    const { submit, isSubmitting, result } = useMutateSubmitUiUxChallengeSwr()

    // live preview: rebuild the iframe srcDoc ~400ms after the last keystroke.
    // No auto-scroll/animation on rebuild, so reduced-motion needs no special case.
    useEffect(() => {
        const timer = setTimeout(() => setSrcDoc(composeSrcDoc(code)), 400)
        return () => clearTimeout(timer)
    }, [code])

    // autosave: debounce the draft into localStorage; starter ref = pristine → keep
    // no draft (Reset returns to this state and clears the key)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (code === challenge.starter) {
                window.localStorage.removeItem(draftKey(challenge.id))
                setDraftSaved(false)
                return
            }
            window.localStorage.setItem(draftKey(challenge.id), JSON.stringify(code))
            setDraftSaved(true)
        }, 800)
        return () => clearTimeout(timer)
    }, [code, challenge.id, challenge.starter])

    const onChangeCode = (lang: EditorLang, value: string) =>
        setCode((current) => ({ ...current, [lang]: value }))

    const onReset = () => setCode(challenge.starter)

    const onToggleRequirement = (index: number) =>
        setChecked((current) => current.map((value, i) => (i === index ? !value : value)))

    const onSubmit = () => {
        void submit({
            challengeId: challenge.id,
            ...code,
            checkedCount: checked.filter(Boolean).length,
            totalCount: challenge.requirements.length,
        })
    }

    return (
        <div className="flex flex-col gap-3">
            {/* mobile pane switcher — desktop shows all panes side by side */}
            <ExtendedTabs
                className="lg:hidden"
                selectedKey={mobilePane}
                onSelectionChange={(key) => setMobilePane(key as MobilePane)}
            >
                <Tabs.ListContainer>
                    <Tabs.List aria-label={t("uiuxEditor.paneTabsLabel")}>
                        {MOBILE_PANES.map((key) => (
                            <Tabs.Tab key={key} id={key}>
                                {t(`uiuxEditor.paneTabs.${key}`)}
                            </Tabs.Tab>
                        ))}
                    </Tabs.List>
                </Tabs.ListContainer>
            </ExtendedTabs>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:grid-rows-[auto_auto]">
                {/* editor pane (gated by enroll when premium) */}
                <div
                    className={cn(
                        mobilePane === "editor" ? "flex" : "hidden",
                        "relative min-h-[480px] flex-col lg:row-span-2 lg:flex",
                    )}
                >
                    <EditorPane
                        code={code}
                        onChangeCode={onChangeCode}
                        onReset={onReset}
                        draftSaved={draftSaved}
                        readOnly={challenge.isLocked}
                        className="h-full"
                    />
                    {challenge.isLocked ? (
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/70 p-6">
                            <div className="flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-separator bg-surface p-6 text-center">
                                <LockIcon
                                    className="size-8 text-accent"
                                    aria-hidden
                                    focusable="false"
                                />
                                <Typography type="body-sm" weight="semibold">
                                    {t("uiuxEditor.gate.title")}
                                </Typography>
                                <Typography type="body-sm" color="muted">
                                    {t("uiuxEditor.gate.description")}
                                </Typography>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onPress={() =>
                                        router.push(`/courses/${challenge.courseId}`)
                                    }
                                >
                                    {t("uiuxEditor.gate.cta")}
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* live preview — sandboxed, no allow-same-origin so learner JS can't
                    reach the app origin (storage/cookies) */}
                <div
                    className={cn(
                        mobilePane === "preview" ? "flex" : "hidden",
                        "flex-col gap-3 lg:flex",
                    )}
                >
                    <Typography type="body-sm" weight="medium">
                        {t("uiuxEditor.preview.title")}
                    </Typography>
                    <iframe
                        sandbox="allow-scripts"
                        srcDoc={srcDoc}
                        title={t("uiuxEditor.preview.iframeTitle")}
                        className="h-[320px] w-full rounded-2xl border border-separator bg-white lg:h-[360px]"
                    />
                </div>

                {/* target design + requirement checklist */}
                <TargetPanel
                    targetImageUrl={challenge.targetImageUrl}
                    requirements={challenge.requirements}
                    checked={checked}
                    onToggle={onToggleRequirement}
                    className={cn(mobilePane === "brief" ? "flex" : "hidden", "lg:flex")}
                />
            </div>

            {/* submit (mock scoring — BE grading là GIẢ ĐỊNH) */}
            {!challenge.isLocked ? (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="primary"
                            size="sm"
                            isPending={isSubmitting}
                            isDisabled={isSubmitting}
                            onPress={onSubmit}
                        >
                            {({ isPending }) => (
                                <>
                                    {isPending ? (
                                        <Spinner size="sm" color="current" />
                                    ) : (
                                        <PaperPlaneTiltIcon
                                            className="size-4"
                                            aria-hidden
                                            focusable="false"
                                        />
                                    )}
                                    {isPending
                                        ? t("uiuxEditor.submitting")
                                        : t("uiuxEditor.submit")}
                                </>
                            )}
                        </Button>
                    </div>
                    {result ? (
                        <div className="flex flex-col gap-2 rounded-2xl border border-separator p-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <Typography type="body-sm" weight="semibold">
                                    {t("uiuxEditor.result.title")}
                                </Typography>
                                <Chip
                                    size="sm"
                                    variant="soft"
                                    color={result.passed ? "success" : "danger"}
                                >
                                    {result.passed
                                        ? t("uiuxEditor.result.passed")
                                        : t("uiuxEditor.result.failed")}
                                </Chip>
                                <Typography type="body-sm">
                                    {t("uiuxEditor.result.score", { score: result.score })}
                                </Typography>
                            </div>
                            <Typography type="body-xs" color="muted">
                                {t("uiuxEditor.result.mockNote")}
                            </Typography>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    )
}
