"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { Button, Skeleton, Typography, cn, toast } from "@heroui/react"
import {
    ArrowLeftIcon,
    CaretRightIcon,
    PlusIcon,
    WarningCircleIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import {
    archiveStudyPlan,
    createStudyPlan,
    getStudyPlans,
    patchStudyPlanProgress,
    type CreateStudyPlanRequest,
    type StudyPlanView,
} from "@/modules/api/rest/ai"
import { isQuotaError } from "../../hooks/useAiToolJob"
import { AiToolShell } from "../AiToolShell"
import { PlannerForm } from "./PlannerForm"
import { PlanTimeline } from "./PlanTimeline"
import { applyProgress } from "./logic"

/** SWR key for the caller's active study plans. */
export const STUDY_PLANS_SWR_KEY = "GET_STUDY_PLANS"

/**
 * `/ai/tools/planner` — the AI study planner. One page, three states resolved from the
 * caller's plans and their intent: a **list** of active plans, the creation **form**
 * (shown straight away when they have none), and a **plan** view (weekly timeline with
 * optimistic check-off + archive). Creating lands on the new plan; archiving returns to
 * the list. All writes update the SWR cache in place so the list stays in sync.
 */
export const PlannerTool = () => {
    const t = useTranslations("aiPlatform.toolPages.planner")
    const tToast = useTranslations("toast")

    const {
        data: plans,
        isLoading,
        error,
        mutate,
    } = useSWR<StudyPlanView[], Error>([STUDY_PLANS_SWR_KEY], () => getStudyPlans())

    const [activePlan, setActivePlan] = useState<StudyPlanView | null>(null)
    const [creating, setCreating] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [createError, setCreateError] = useState<Error | undefined>(undefined)
    const [archivingId, setArchivingId] = useState<string | null>(null)

    const list = plans ?? []
    // Empty list drops the user straight into the form (spec: "empty state goes straight
    // to the form"); an explicit "New plan" press also opens it.
    const showForm = creating || (!isLoading && !error && list.length === 0)

    const backToList = () => {
        setActivePlan(null)
        setCreating(false)
        setCreateError(undefined)
    }

    const handleCreate = async (request: CreateStudyPlanRequest) => {
        setGenerating(true)
        setCreateError(undefined)
        try {
            const created = await createStudyPlan(request)
            setActivePlan(created)
            setCreating(false)
            await mutate((prev) => [created, ...(prev ?? [])], { revalidate: false })
        } catch (caught) {
            setCreateError(caught instanceof Error ? caught : new Error(String(caught)))
        } finally {
            setGenerating(false)
        }
    }

    // Optimistic check-off: move the checkbox + progress bar immediately, reconcile with
    // the server view, and roll the whole plan back with a toast if the PATCH fails.
    const handleToggle = async (taskKey: string, done: boolean) => {
        if (!activePlan) return
        const previous = activePlan
        setActivePlan(applyProgress(previous, taskKey, done))
        try {
            const updated = await patchStudyPlanProgress(previous.id, { taskKey, done })
            setActivePlan(updated)
            await mutate(
                (prev) => (prev ?? []).map((plan) => (plan.id === updated.id ? updated : plan)),
                { revalidate: false },
            )
        } catch {
            setActivePlan(previous)
            toast.danger(tToast("errorTitle"), { description: t("toggleError") })
        }
    }

    const handleArchive = async () => {
        if (!activePlan) return
        const { id } = activePlan
        setArchivingId(id)
        try {
            await archiveStudyPlan(id)
            await mutate((prev) => (prev ?? []).filter((plan) => plan.id !== id), {
                revalidate: false,
            })
            setActivePlan(null)
        } catch {
            toast.danger(tToast("errorTitle"), { description: t("archiveError") })
        } finally {
            setArchivingId(null)
        }
    }

    return (
        <AiToolShell toolKey="planner">
            {activePlan ? (
                <div className="flex flex-col gap-4">
                    <BackButton label={t("backToPlans")} onPress={backToList} />
                    <PlanTimeline
                        plan={activePlan}
                        onToggleTask={handleToggle}
                        onArchive={handleArchive}
                        isArchiving={archivingId === activePlan.id}
                    />
                </div>
            ) : showForm ? (
                <div className="flex flex-col gap-4">
                    {list.length > 0 ? (
                        <BackButton label={t("backToPlans")} onPress={backToList} />
                    ) : null}
                    {createError ? (
                        <CreatePlanError
                            message={
                                isQuotaError(createError)
                                    ? t("quotaError")
                                    : createError.message || t("createError")
                            }
                        />
                    ) : null}
                    <PlannerForm onSubmit={handleCreate} isBusy={generating} />
                </div>
            ) : (
                <PlanList
                    plans={list}
                    isLoading={isLoading}
                    hasError={!!error}
                    onRetry={() => void mutate()}
                    onOpen={setActivePlan}
                    onNew={() => {
                        setCreating(true)
                        setActivePlan(null)
                        setCreateError(undefined)
                    }}
                />
            )}
        </AiToolShell>
    )
}

/** A muted "back" text button for in-tool navigation (distinct from the shell's hub back). */
const BackButton = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <button
        type="button"
        onClick={onPress}
        className="group flex items-center gap-1.5 self-start text-sm text-muted transition-colors hover:text-foreground"
    >
        <ArrowLeftIcon
            aria-hidden
            focusable="false"
            className="size-4 transition-transform group-hover:-translate-x-0.5"
        />
        {label}
    </button>
)

/** An inline error/quota panel shown when plan generation fails. */
const CreatePlanError = ({ message }: { message: string }) => (
    <div className="flex items-center gap-3 rounded-2xl border border-danger/40 bg-danger/5 p-4">
        <WarningCircleIcon aria-hidden focusable="false" className="size-6 shrink-0 text-danger" />
        <Typography type="body-sm" color="muted">
            {message}
        </Typography>
    </div>
)

/** Props for {@link PlanList}. */
interface PlanListProps {
    plans: StudyPlanView[]
    isLoading: boolean
    hasError: boolean
    onRetry: () => void
    onOpen: (plan: StudyPlanView) => void
    onNew: () => void
}

/** The list of active plans, each a go-there row, plus a "new plan" affordance. */
const PlanList = ({ plans, isLoading, hasError, onRetry, onOpen, onNew }: PlanListProps) => {
    const t = useTranslations("aiPlatform.toolPages.planner")

    if (isLoading) {
        return (
            <div className="flex flex-col gap-3">
                {[0, 1, 2].map((row) => (
                    <div key={row} className="flex flex-col gap-2 rounded-2xl border border-separator p-4">
                        <Skeleton className="h-4 w-2/3 rounded-full" />
                        <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                ))}
            </div>
        )
    }

    if (hasError) {
        return (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-danger/40 bg-danger/5 p-8 text-center">
                <WarningCircleIcon aria-hidden focusable="false" className="size-8 text-danger" />
                <Typography type="body-sm" color="muted">
                    {t("loadError")}
                </Typography>
                <Button size="sm" variant="secondary" onPress={onRetry}>
                    {t("retry")}
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
                <Typography type="body-sm" weight="medium">
                    {t("myPlans")}
                </Typography>
                <Button variant="primary" size="sm" onPress={onNew}>
                    <PlusIcon aria-hidden focusable="false" className="size-4" />
                    {t("newPlan")}
                </Button>
            </div>
            <ul className="flex flex-col gap-3">
                {plans.map((plan) => (
                    <li key={plan.id}>
                        <button
                            type="button"
                            onClick={() => onOpen(plan)}
                            className={cn(
                                "group flex w-full items-center gap-3 rounded-2xl border border-separator p-4 text-left",
                                "transition-colors hover:border-default hover:bg-default/40",
                            )}
                        >
                            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                <Typography
                                    type="body-sm"
                                    weight="semibold"
                                    truncate
                                    className="transition-colors group-hover:underline"
                                >
                                    {plan.goal}
                                </Typography>
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-default">
                                        <div
                                            className="h-full rounded-full bg-accent"
                                            style={{ width: `${plan.percentDone}%` }}
                                        />
                                    </div>
                                    <Typography type="body-xs" color="muted" className="shrink-0">
                                        {t("percentComplete", { percent: plan.percentDone })}
                                    </Typography>
                                </div>
                            </div>
                            <CaretRightIcon
                                aria-hidden
                                focusable="false"
                                className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-1"
                            />
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}
