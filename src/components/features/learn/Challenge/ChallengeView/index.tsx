"use client"

import { ArrowLeftIcon, CaretRightIcon, GearSixIcon, TrophyIcon, FlameIcon, LightbulbIcon } from "@phosphor-icons/react"
import React, { useEffect, useMemo, useState } from "react"
import { Accordion, Button, Chip, Drawer, Input, Label, Link, ScrollShadow, Spinner, Tabs, TextField, Typography, cn } from "@heroui/react"
import { ChallengeViewSkeleton } from "./ChallengeViewSkeleton"
import { ChallengeSubmissionPanel } from "../ChallengeSubmissionPanel"
import { useTranslations } from "next-intl"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { Score } from "@/components/reuseable/Score"
import { useMutateSyncPersonalProjectGithubSwr } from "@/hooks/swr/api/graphql/mutations/useMutateSyncPersonalProjectGithubSwr"
import { useGraphQLWithToast } from "@/modules/toast/hooks"
import { CheckListCard, CheckListItem } from "@/components/blocks/cards/CheckListCard"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { useAppSelector } from "@/redux/hooks"
import { difficultyPalette } from "@/components/pallettes/difficulty"
import { ChallengeDifficulty } from "@/modules/types/enums/challenge-difficulty"
import { listChallengeProgrammingLangs, resolveChallengeSectionRows } from "@/modules/types/utils/challenge-section"
import { resolveActiveProgrammingLang } from "@/modules/types/utils/programming-language"
import { type WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link ChallengeView}. */
export type ChallengeViewProps = WithClassNames<undefined> & {
    /** Back to the owning lesson (rendered as the column's back link). */
    onBack?: () => void
}

/**
 * SCHEMA V2 challenge solve surface — a SPLIT workspace mirroring the personal-project task
 * page (the same job: read a brief, submit a repo, get AI-graded). Both surfaces stay visually
 * one family:
 *  - CENTER (read, `max-w-3xl mx-auto`): a back link + the brief — title + score/difficulty/status
 *    chips, then prerequisites · requirements (with per-requirement points) · guided steps · expected
 *    outputs · hint. Clean reading sections (whitespace over the old border-per-section striping).
 *  - RIGHT (act, sticky `~360px` aside): a "Nộp bài" {@link LabeledCard} (the programming-language
 *    selector — the grading setting that ALSO drives which language's brief shows — over the
 *    {@link ChallengeSubmissionPanel}: repo URL + grader + submit, with the structured AI feedback on
 *    each result) above a "Kết quả của bạn" card (the headline {@link Score}).
 *
 * The course-tree rail stays (the learn shell). Grading criteria stay hidden (internal rubric).
 *
 * @param props - {@link ChallengeViewProps}
 */
export const ChallengeView = ({ className, onBack }: ChallengeViewProps) => {
    const t = useTranslations()
    const challenge = useAppSelector((state) => state.challenge.entity)
    const completionTasks = useAppSelector((state) => state.challenge.completionTasks)
    const config = useAppSelector((state) => state.system.config)
    const challengeSubmissions = useAppSelector((state) => state.challenge.challengeSubmissions)

    const langs = useMemo(
        () => listChallengeProgrammingLangs(challenge),
        [challenge],
    )
    const [selectedLang, setSelectedLang] = useState<string | null>(null)
    const activeLang = useMemo(
        () => resolveActiveProgrammingLang(selectedLang, langs),
        [selectedLang, langs],
    )
    // the language selector lives behind a settings Drawer (mirrors the personal-project task panel)
    const [isLangOpen, setLangOpen] = useState(false)

    // optional private-repo token (encrypted at rest), shared per-enrollment with the
    // personal-project capstone — the challenge grader clones private student repos with it.
    const courseId = useAppSelector((state) => state.course.entity?.id)
    const runGraphQL = useGraphQLWithToast()
    const syncGithubSwr = useMutateSyncPersonalProjectGithubSwr()
    const [tokenInput, setTokenInput] = useState("")
    const [savingToken, setSavingToken] = useState(false)
    const saveGithubToken = async () => {
        const trimmed = tokenInput.trim()
        if (!courseId || !trimmed) {
            return
        }
        setSavingToken(true)
        await runGraphQL(
            async () => {
                const result = await syncGithubSwr.trigger({ courseId, githubToken: trimmed })
                const payload = result?.data?.syncPersonalProjectGithub
                if (!payload?.success) {
                    throw new Error(payload?.error ?? payload?.message ?? t("finalProject.page.submitGithub.syncFailed"))
                }
                setTokenInput("")
                return payload
            },
            { showSuccessToast: true },
        ).finally(() => setSavingToken(false))
    }
    const clearGithubToken = async () => {
        if (!courseId) {
            return
        }
        setSavingToken(true)
        await runGraphQL(
            async () => {
                const result = await syncGithubSwr.trigger({ courseId, clearGithubToken: true })
                const payload = result?.data?.syncPersonalProjectGithub
                if (!payload?.success) {
                    throw new Error(payload?.error ?? payload?.message ?? t("finalProject.page.submitGithub.syncFailed"))
                }
                setTokenInput("")
                return payload
            },
            { showSuccessToast: true },
        ).finally(() => setSavingToken(false))
    }
    /** Human label for the active language, shown on the settings summary row. */
    const langLabelMap: Record<string, string> = {
        typescript: t("programmingLanguage.typescript"),
        java: t("programmingLanguage.java"),
        csharp: t("programmingLanguage.csharp"),
        go: t("programmingLanguage.go"),
    }
    // the programming language the learner last submitted with, if any (to reopen the tabs on it)
    const storedLang = useMemo(
        () => challengeSubmissions
            ?.find((submission) => submission.userSubmission?.selectedLang)
            ?.userSubmission?.selectedLang ?? null,
        [challengeSubmissions],
    )

    useEffect(() => {
        setSelectedLang(null)
    }, [challenge?.id])

    // open the tabs on the persisted language once it loads — only until the learner picks one
    useEffect(() => {
        if (selectedLang === null && storedLang) {
            setSelectedLang(storedLang)
        }
    }, [storedLang, selectedLang])

    const requirements = useMemo(
        () => resolveChallengeSectionRows(challenge?.requirements, activeLang),
        [challenge?.requirements, activeLang],
    )
    const steps = useMemo(
        () => resolveChallengeSectionRows(challenge?.steps, activeLang),
        [challenge?.steps, activeLang],
    )
    const outputs = useMemo(
        () => resolveChallengeSectionRows(challenge?.outputs, activeLang)
            .filter((row) => row.body.trim().length > 0),
        [challenge?.outputs, activeLang],
    )
    const prerequisites = useMemo(
        () => resolveChallengeSectionRows(challenge?.prerequisites, activeLang)
            .filter((row) => row.body.trim().length > 0),
        [challenge?.prerequisites, activeLang],
    )
    const hint = challenge?.hint?.trim() ?? ""

    const passThreshold = config?.challenge?.passThreshold ?? 0
    const challengeProgress = useMemo(
        () => completionTasks.find((completionTask) => completionTask.id === challenge?.id) ?? null,
        [completionTasks, challenge?.id],
    )
    const earnedScore = challengeProgress?.lastScore ?? 0
    const maxScore = challengeProgress?.maxScore ?? challenge?.score ?? 0
    const statusBadge = useMemo(() => {
        switch (challengeProgress?.status) {
        case "completed":
            return { color: "success" as const, label: t("challenge.pass") }
        case "failed":
            return { color: "danger" as const, label: t("challenge.fail") }
        case "inProgress":
            return { color: "warning" as const, label: t("challenge.inProgress") }
        default:
            return null
        }
    }, [challengeProgress?.status, t])
    const challengeDifficultyKey = useMemo(() => {
        switch (challenge?.difficulty) {
        case ChallengeDifficulty.Easy:
            return "challenge.difficulty.easy"
        case ChallengeDifficulty.Medium:
            return "challenge.difficulty.medium"
        case ChallengeDifficulty.Hard:
            return "challenge.difficulty.hard"
        default:
            return "challenge.difficulty.easy"
        }
    }, [challenge?.difficulty])

    // the challenge entity is hydrated into redux by the singleton SWR (SwrSideEffects); until it
    // lands, mirror the split layout with a skeleton so the page does not flash an empty shell.
    if (!challenge) {
        return <ChallengeViewSkeleton className={className} />
    }

    return (
        <div className={cn("flex flex-col gap-6 xl:flex-row xl:items-start xl:gap-8", className)}>
            {/* CENTER — the brief (read), a centered reading column */}
            <div className="min-w-0 flex-1">
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
                    {/* header → PageHeader: back link (breadcrumb slot = leaf nav) · title H3 ·
                        description · meta chips (score · difficulty · status) */}
                    <PageHeader
                        breadcrumb={onBack ? (
                            <Link
                                onPress={onBack}
                                className="inline-flex w-fit cursor-pointer items-center gap-2 font-medium text-accent"
                            >
                                <ArrowLeftIcon aria-hidden className="size-5" />
                                <Typography type="body-sm" className="font-medium">{t("challenge.back")}</Typography>
                            </Link>
                        ) : undefined}
                        title={challenge?.title ?? ""}
                        description={challenge?.description || undefined}
                        meta={(
                            <div className="flex flex-wrap items-center gap-2">
                                <Chip color="accent" variant="soft">
                                    <TrophyIcon className="size-5" />
                                    <Chip.Label>{t("challenge.score", { score: challenge?.score ?? 0 })}</Chip.Label>
                                </Chip>
                                <Chip className={difficultyPalette[challenge?.difficulty ?? ChallengeDifficulty.Easy].text} variant="soft">
                                    <FlameIcon className="size-5" />
                                    <Chip.Label>{t(challengeDifficultyKey)}</Chip.Label>
                                </Chip>
                                {statusBadge ? (
                                    <Chip color={statusBadge.color} variant="soft">
                                        <Chip.Label>{statusBadge.label}</Chip.Label>
                                    </Chip>
                                ) : null}
                            </div>
                        )}
                    />

                    {/* brief sections */}
                    <div className="flex flex-col gap-6">
                        {prerequisites.length > 0 ? (
                            <LabeledCard frameless label={t("challenge.prerequisites")}>
                                {/* shared check-list card; prerequisites = NO tick (needed beforehand,
                                    not achievements) */}
                                <CheckListCard>
                                    {prerequisites.map((item, index) => (
                                        <CheckListItem key={`prereq-${index}`} showCheck={false}>
                                            <MarkdownContent markdown={item.body} className="[&_p]:m-0" />
                                        </CheckListItem>
                                    ))}
                                </CheckListCard>
                            </LabeledCard>
                        ) : null}

                        {requirements.length > 0 ? (
                            <section className="flex flex-col gap-3">
                                <Typography type="body" weight="semibold" className="text-foreground">
                                    {t("challenge.requirements")}
                                </Typography>
                                {/* requirements as a surface accordion (card fill — this is a standalone
                                    solve page, not a markdown code-block cluster); collapsed by default —
                                    the per-requirement points stay visible in each header. */}
                                <Accordion
                                    variant="surface"
                                    className="overflow-hidden border border-default"
                                    allowsMultipleExpanded
                                >
                                    {requirements.map((item, index) => (
                                        <Accordion.Item key={`req-${index}`} id={`req-${index}`} aria-label={item.title}>
                                            <Accordion.Heading>
                                                <Accordion.Trigger className="w-full">
                                                    <div className="flex w-full items-center justify-between gap-3 text-start">
                                                        <span className="text-base font-semibold">{item.title}</span>
                                                        <div className="flex shrink-0 items-center gap-2">
                                                            {item.score !== undefined ? (
                                                                <Chip color="accent" variant="soft" size="sm">
                                                                    <Chip.Label>{t("challenge.score", { score: item.score })}</Chip.Label>
                                                                </Chip>
                                                            ) : null}
                                                            <Accordion.Indicator />
                                                        </div>
                                                    </div>
                                                </Accordion.Trigger>
                                            </Accordion.Heading>
                                            <Accordion.Panel>
                                                <Accordion.Body>
                                                    <MarkdownContent markdown={item.body} />
                                                </Accordion.Body>
                                            </Accordion.Panel>
                                        </Accordion.Item>
                                    ))}
                                </Accordion>
                            </section>
                        ) : null}

                        {steps.length > 0 ? (
                            <section className="flex flex-col gap-3">
                                <Typography type="body" weight="semibold" className="text-foreground">
                                    {t("challenge.steps.title")}
                                </Typography>
                                {/* steps share the requirements' surface accordion, collapsed by
                                    default (a guide you expand step by step). */}
                                <Accordion
                                    variant="surface"
                                    className="overflow-hidden border border-default"
                                    allowsMultipleExpanded
                                >
                                    {steps.map((step, index) => (
                                        <Accordion.Item key={`step-${index}`} id={`step-${index}`} aria-label={step.title}>
                                            <Accordion.Heading>
                                                <Accordion.Trigger className="w-full">
                                                    <div className="flex w-full items-center justify-between gap-3 text-start">
                                                        <span className="text-base font-semibold">
                                                            {`${index + 1}. ${step.title || t("challenge.steps.label", { index: index + 1 })}`}
                                                        </span>
                                                        <Accordion.Indicator />
                                                    </div>
                                                </Accordion.Trigger>
                                            </Accordion.Heading>
                                            <Accordion.Panel>
                                                <Accordion.Body>
                                                    <MarkdownContent markdown={step.body} />
                                                </Accordion.Body>
                                            </Accordion.Panel>
                                        </Accordion.Item>
                                    ))}
                                </Accordion>
                            </section>
                        ) : null}

                        {outputs.length > 0 ? (
                            <LabeledCard frameless label={t("challenge.outputs")}>
                                {/* shared check-list card: tick-led rows, markdown body keeps inline code */}
                                <CheckListCard>
                                    {outputs.map((item, index) => (
                                        <CheckListItem key={`output-${index}`}>
                                            <MarkdownContent markdown={item.body} className="[&_p]:m-0" />
                                        </CheckListItem>
                                    ))}
                                </CheckListCard>
                            </LabeledCard>
                        ) : null}

                        {hint.length > 0 ? (
                            <Accordion
                                variant="surface"
                                className="overflow-hidden border border-default"
                            >
                                <Accordion.Item id="hint" aria-label={t("challenge.hint")}>
                                    <Accordion.Heading>
                                        <Accordion.Trigger className="w-full">
                                            <div className="flex w-full items-center justify-between gap-3 text-start">
                                                <div className="flex items-center gap-2 text-foreground">
                                                    <LightbulbIcon className="size-5 text-warning" />
                                                    <span className="text-base font-semibold">
                                                        {t("challenge.hint")}
                                                    </span>
                                                </div>
                                                <Accordion.Indicator />
                                            </div>
                                        </Accordion.Trigger>
                                    </Accordion.Heading>
                                    <Accordion.Panel>
                                        <Accordion.Body>
                                            <MarkdownContent markdown={hint} />
                                        </Accordion.Body>
                                    </Accordion.Panel>
                                </Accordion.Item>
                            </Accordion>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* RIGHT — the submit + result (act): a sticky aside of cards, like the task page.
                The inner ScrollShadow owns the overflow + fades the top/bottom edges so a long
                submission panel scrolls within the viewport with a clear "more below" cue. */}
            <aside className="w-full shrink-0 xl:sticky xl:top-24 xl:w-[360px] xl:self-start">
                <ScrollShadow
                    hideScrollBar
                    className="flex flex-col gap-6 xl:max-h-[calc(100dvh-7rem)] xl:overflow-y-auto"
                >
                    <LabeledCard
                        label={t("challenge.submissionModal.title")}
                        contentClassName="flex flex-col gap-3"
                    >
                        {/* language = a grading setting (also drives which language's brief shows),
                            picked behind a Drawer like the personal-project grading settings — a
                            read-only summary row opens it. */}
                        <button
                            type="button"
                            onClick={() => setLangOpen(true)}
                            aria-label={t("challenge.gradingSettings")}
                            aria-expanded={isLangOpen}
                            className="group flex cursor-pointer items-center justify-between gap-3 rounded-medium bg-default-100 px-3 py-2 text-left"
                        >
                            <span className="flex items-center gap-2 text-sm">
                                <GearSixIcon className="size-4 shrink-0" />
                                <span className="group-hover:underline">{t("challenge.gradingSettings")}</span>
                            </span>
                            <span className="flex min-w-0 items-center gap-2 text-xs text-muted">
                                <span className="truncate">{langLabelMap[activeLang] ?? activeLang}</span>
                                <CaretRightIcon className="size-4 shrink-0" />
                            </span>
                        </button>
                        <ChallengeSubmissionPanel lang={activeLang} />
                    </LabeledCard>

                    <LabeledCard
                        label={t("challenge.yourScore")}
                        contentClassName="flex flex-col gap-2"
                    >
                        <Score current={earnedScore} max={maxScore} threshold={passThreshold} />
                        <Typography type="body-xs" className="text-muted">
                            {t("challenge.minimumPassRequirementAll")}
                        </Typography>
                    </LabeledCard>
                </ScrollShadow>
            </aside>

            {/* language-settings Drawer (mirrors the personal-project grading-settings drawer; for a
                challenge the only grading setting is the programming language) */}
            <Drawer>
                <Drawer.Backdrop isOpen={isLangOpen} onOpenChange={setLangOpen} className="backdrop-blur-sm">
                    <Drawer.Content placement="right">
                        <Drawer.Dialog className="p-0">
                            <div className="p-3">
                                <Drawer.CloseTrigger />
                                <Drawer.Header>
                                    <Drawer.Heading>{t("challenge.gradingSettings")}</Drawer.Heading>
                                </Drawer.Header>
                            </div>
                            <div className="border-b" />
                            <Drawer.Body className="p-6 pt-3">
                                <div className="flex flex-col gap-6">
                                    <div className="flex flex-col gap-2">
                                        <Label>{t("challenge.language")}</Label>
                                        {/* block tabs (primary), same as the personal-project grading-settings drawer */}
                                        <Tabs
                                            selectedKey={activeLang}
                                            variant="primary"
                                            className="w-fit"
                                            onSelectionChange={(key) => setSelectedLang(String(key))}
                                        >
                                            <Tabs.ListContainer>
                                                <Tabs.List aria-label={t("challenge.language")}>
                                                    {langs.map((lang) => (
                                                        <Tabs.Tab key={lang} id={lang}>
                                                            {langLabelMap[lang] ?? lang}
                                                            <Tabs.Indicator />
                                                        </Tabs.Tab>
                                                    ))}
                                                </Tabs.List>
                                            </Tabs.ListContainer>
                                        </Tabs>
                                    </div>
                                    {/* optional private-repo token (write-only, encrypted at rest) — only
                                        needed when the student's challenge repo is PRIVATE; public/org repos
                                        grade with the org token. Shared per-enrollment with the capstone. */}
                                    <div className="flex flex-col gap-2">
                                        <Label>{t("finalProject.page.submitGithub.privateTokenFieldTitle")}</Label>
                                        <TextField variant="secondary" className="w-full">
                                            <Input
                                                className="w-full"
                                                type="password"
                                                autoComplete="off"
                                                placeholder={t("finalProject.page.submitGithub.privateTokenPlaceholder")}
                                                name="githubToken"
                                                value={tokenInput}
                                                onChange={(event) => setTokenInput(event.target.value)}
                                            />
                                        </TextField>
                                        <Typography type="body-sm" color="muted">
                                            {t("finalProject.page.submitGithub.privateTokenHint")}
                                        </Typography>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button
                                                variant="secondary"
                                                isDisabled={savingToken || tokenInput.trim().length === 0}
                                                onPress={() => void saveGithubToken()}
                                            >
                                                {savingToken ? <Spinner size="sm" color="current" /> : null}
                                                {t("finalProject.page.submitGithub.privateTokenSaveButton")}
                                            </Button>
                                            <Button
                                                variant="tertiary"
                                                isDisabled={savingToken}
                                                onPress={() => void clearGithubToken()}
                                            >
                                                {t("finalProject.page.submitGithub.privateTokenRemoveButton")}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Drawer.Body>
                        </Drawer.Dialog>
                    </Drawer.Content>
                </Drawer.Backdrop>
            </Drawer>
        </div>
    )
}
