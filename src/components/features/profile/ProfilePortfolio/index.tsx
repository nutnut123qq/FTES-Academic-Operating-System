"use client"

import React, { useCallback, useId, useState } from "react"
import { Button, Chip, Input, Label, TextField, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import {
    ArrowSquareOutIcon,
    LinkIcon,
    PencilSimpleIcon,
    PlusIcon,
    PushPinIcon,
    TrashIcon,
} from "@phosphor-icons/react"
import { ProfileAchievements } from "./ProfileAchievements"
import { ProfileCertificates } from "./ProfileCertificates"
import { ProfileResumeCard } from "./ProfileResumeCard"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import {
    useQueryMyPortfolioSwr,
    type MyPortfolio,
    type MyPortfolioLink,
    type MyPortfolioProject,
} from "../hooks/useQueryMyPortfolioSwr"

/** Editable project fields (tags as a comma-separated string in the form). */
interface ProjectDraft {
    title: string
    description: string
    tags: string
    url: string
}

/** Editable link fields. */
interface LinkDraft {
    label: string
    url: string
}

/** Which in-page form is open, if any. */
type Editing =
    | { kind: "addProject" }
    | { kind: "editProject"; id: string }
    | { kind: "addLink" }
    | { kind: "editLink"; id: string }
    | null

/** Labeled text input row (a11y: Label ↔ Input via id). */
const FieldRow = ({
    id,
    label,
    value,
    required,
    onChange,
}: {
    id: string
    label: string
    value: string
    required?: boolean
    onChange: (value: string) => void
}) => (
    <TextField variant="secondary">
        <Label htmlFor={id} className="text-sm">
            {label}
        </Label>
        <Input
            id={id}
            variant="secondary"
            required={required}
            value={value}
            onChange={(event) => onChange(event.target.value)}
        />
    </TextField>
)

/** In-page project add/edit form on local state. */
const ProjectForm = ({
    initial,
    onSave,
    onCancel,
}: {
    initial: ProjectDraft
    onSave: (draft: ProjectDraft) => void
    onCancel: () => void
}) => {
    const t = useTranslations()
    const formId = useId()
    const [draft, setDraft] = useState<ProjectDraft>(initial)
    const canSave = draft.title.trim().length > 0 && draft.url.trim().length > 0
    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
            <FieldRow
                id={`${formId}-title`}
                label={t("profile.portfolio.form.title")}
                value={draft.title}
                required
                onChange={(title) => setDraft({ ...draft, title })}
            />
            <FieldRow
                id={`${formId}-description`}
                label={t("profile.portfolio.form.description")}
                value={draft.description}
                onChange={(description) => setDraft({ ...draft, description })}
            />
            <FieldRow
                id={`${formId}-tags`}
                label={t("profile.portfolio.form.tags")}
                value={draft.tags}
                onChange={(tags) => setDraft({ ...draft, tags })}
            />
            <FieldRow
                id={`${formId}-url`}
                label={t("profile.portfolio.form.url")}
                value={draft.url}
                required
                onChange={(url) => setDraft({ ...draft, url })}
            />
            <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onPress={onCancel}>
                    {t("profile.portfolio.form.cancel")}
                </Button>
                <Button size="sm" variant="primary" isDisabled={!canSave} onPress={() => onSave(draft)}>
                    {t("profile.portfolio.form.save")}
                </Button>
            </div>
        </div>
    )
}

/** In-page link add/edit form on local state. */
const LinkForm = ({
    initial,
    onSave,
    onCancel,
}: {
    initial: LinkDraft
    onSave: (draft: LinkDraft) => void
    onCancel: () => void
}) => {
    const t = useTranslations()
    const formId = useId()
    const [draft, setDraft] = useState<LinkDraft>(initial)
    const canSave = draft.label.trim().length > 0 && draft.url.trim().length > 0
    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
            <FieldRow
                id={`${formId}-label`}
                label={t("profile.portfolio.form.label")}
                value={draft.label}
                required
                onChange={(label) => setDraft({ ...draft, label })}
            />
            <FieldRow
                id={`${formId}-url`}
                label={t("profile.portfolio.form.url")}
                value={draft.url}
                required
                onChange={(url) => setDraft({ ...draft, url })}
            />
            <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onPress={onCancel}>
                    {t("profile.portfolio.form.cancel")}
                </Button>
                <Button size="sm" variant="primary" isDisabled={!canSave} onPress={() => onSave(draft)}>
                    {t("profile.portfolio.form.save")}
                </Button>
            </div>
        </div>
    )
}

/** Two-step inline remove confirmation (keyboard-operable buttons). */
const RemoveConfirm = ({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) => {
    const t = useTranslations()
    return (
        <div className="flex items-center gap-2">
            <Typography type="body-xs" color="muted">
                {t("profile.portfolio.confirmRemove")}
            </Typography>
            <Button size="sm" variant="danger" onPress={onConfirm}>
                {t("profile.portfolio.confirm")}
            </Button>
            <Button size="sm" variant="ghost" onPress={onCancel}>
                {t("profile.portfolio.cancelRemove")}
            </Button>
        </div>
    )
}

/** Skeleton mirroring resume + projects + certificates + achievements + links. */
const PortfolioSkeleton = () => (
    <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
            <Skeleton.Typography type="h6" width="1/3" />
            <Skeleton.Card lines={2} />
        </div>
        <div className="flex flex-col gap-3">
            <Skeleton.Typography type="h6" width="1/3" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl" />
            </div>
        </div>
        <div className="flex flex-col gap-3">
            <Skeleton.Typography type="h6" width="1/3" />
            <Skeleton.ListRow />
            <Skeleton.ListRow />
        </div>
        <div className="flex flex-col gap-3">
            <Skeleton.Typography type="h6" width="1/3" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
            </div>
        </div>
        <div className="flex flex-col gap-3">
            <Skeleton.Typography type="h6" width="1/3" />
            <Skeleton.ListRow />
            <Skeleton.ListRow />
        </div>
    </div>
)

/**
 * Portfolio section of the profile (§2). Projects + external links wrapped in
 * labeled cards, with the existing CRUD-lite local state preserved.
 */
export const ProfilePortfolio = () => {
    const t = useTranslations()
    const { data, isLoading, error, mutate } = useQueryMyPortfolioSwr()

    const [local, setLocal] = useState<MyPortfolio | null>(null)
    const portfolio = local ?? data
    const [editing, setEditing] = useState<Editing>(null)
    const [removingId, setRemovingId] = useState<string | null>(null)

    const patch = useCallback(
        (next: Partial<MyPortfolio>) => {
            if (!portfolio) return
            setLocal({ ...portfolio, ...next })
            setEditing(null)
            setRemovingId(null)
        },
        [portfolio],
    )

    const parseTags = (tags: string): Array<string> =>
        tags.split(",").map((tag) => tag.trim()).filter(Boolean)

    const saveProject = (draft: ProjectDraft, id?: string) => {
        if (!portfolio) return
        const existing = id ? portfolio.projects.find((item) => item.id === id) : undefined
        const project: MyPortfolioProject = {
            id: id ?? `pr-${Date.now()}`,
            title: draft.title.trim(),
            description: draft.description.trim(),
            tags: parseTags(draft.tags),
            url: draft.url.trim(),
            pinned: existing?.pinned ?? false,
        }
        patch({
            projects: id
                ? portfolio.projects.map((item) => (item.id === id ? project : item))
                : [...portfolio.projects, project],
        })
    }

    const sortedProjects = React.useMemo(
        () => [...(portfolio?.projects ?? [])].sort((a, b) => Number(b.pinned) - Number(a.pinned)),
        [portfolio?.projects],
    )

    const saveLink = (draft: LinkDraft, id?: string) => {
        if (!portfolio) return
        const link: MyPortfolioLink = {
            id: id ?? `li-${Date.now()}`,
            label: draft.label.trim(),
            url: draft.url.trim(),
        }
        patch({
            links: id
                ? portfolio.links.map((item) => (item.id === id ? link : item))
                : [...portfolio.links, link],
        })
    }

    const projectDraft = (project?: MyPortfolioProject): ProjectDraft => ({
        title: project?.title ?? "",
        description: project?.description ?? "",
        tags: project?.tags.join(", ") ?? "",
        url: project?.url ?? "",
    })

    const isEmpty = Boolean(portfolio && portfolio.projects.length === 0 && portfolio.links.length === 0)

    return (
        <AsyncContent
            isLoading={isLoading && !portfolio}
            skeleton={<PortfolioSkeleton />}
            error={!portfolio ? error : undefined}
            errorContent={{
                title: t("profile.loadingError"),
                retryLabel: t("profile.retry"),
                onRetry: () => void mutate(),
            }}
        >
            {portfolio ? (
                <div className="flex flex-col gap-6">
                    {isEmpty && editing === null ? (
                        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-separator p-6 text-center">
                            <PlusIcon className="size-8 text-muted" aria-hidden focusable="false" />
                            <div className="flex flex-col gap-2">
                                <Typography type="body" weight="medium">
                                    {t("profile.portfolio.empty.title")}
                                </Typography>
                                <Typography type="body-sm" color="muted">
                                    {t("profile.portfolio.empty.description")}
                                </Typography>
                            </div>
                            <Button
                                size="sm"
                                variant="primary"
                                onPress={() => setEditing({ kind: "addProject" })}
                            >
                                <PlusIcon className="size-4" aria-hidden focusable="false" />
                                {t("profile.portfolio.empty.cta")}
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* resume */}
                            <LabeledCard label={t("profile.portfolio.resume.title")}>
                                {portfolio.resume ? (
                                    <ProfileResumeCard resume={portfolio.resume} />
                                ) : (
                                    <EmptyContent title={t("profile.portfolio.resume.empty")} />
                                )}
                            </LabeledCard>

                            {/* projects */}
                            <LabeledCard
                                label={t("profile.portfolio.projects")}
                                action={
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onPress={() => setEditing({ kind: "addProject" })}
                                    >
                                        <PlusIcon className="size-4" aria-hidden focusable="false" />
                                        {t("profile.portfolio.addProject")}
                                    </Button>
                                }
                                frameless
                            >
                                <div className="flex flex-col gap-3">
                                    {editing?.kind === "addProject" ? (
                                        <ProjectForm
                                            initial={projectDraft()}
                                            onSave={(draft) => saveProject(draft)}
                                            onCancel={() => setEditing(null)}
                                        />
                                    ) : null}
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {sortedProjects.map((project) =>
                                            editing?.kind === "editProject" && editing.id === project.id ? (
                                                <ProjectForm
                                                    key={project.id}
                                                    initial={projectDraft(project)}
                                                    onSave={(draft) => saveProject(draft, project.id)}
                                                    onCancel={() => setEditing(null)}
                                                />
                                            ) : (
                                                <div
                                                    key={project.id}
                                                    className="flex flex-col gap-2 rounded-2xl border border-separator p-4"
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <div className="flex min-w-0 flex-1 items-center gap-2">
                                                            {project.pinned ? (
                                                                <PushPinIcon
                                                                    className="size-4 shrink-0 text-accent"
                                                                    aria-hidden
                                                                    focusable="false"
                                                                />
                                                            ) : null}
                                                            <Typography
                                                                type="body"
                                                                weight="medium"
                                                                className="min-w-0"
                                                                truncate
                                                            >
                                                                {project.title}
                                                            </Typography>
                                                        </div>
                                                        <Button
                                                            isIconOnly
                                                            size="sm"
                                                            variant="ghost"
                                                            aria-label={t("profile.portfolio.editProject")}
                                                            onPress={() =>
                                                                setEditing({ kind: "editProject", id: project.id })
                                                            }
                                                        >
                                                            <PencilSimpleIcon
                                                                className="size-4"
                                                                aria-hidden
                                                                focusable="false"
                                                            />
                                                        </Button>
                                                        <Button
                                                            isIconOnly
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-danger"
                                                            aria-label={t("profile.portfolio.remove")}
                                                            onPress={() => setRemovingId(project.id)}
                                                        >
                                                            <TrashIcon
                                                                className="size-4"
                                                                aria-hidden
                                                                focusable="false"
                                                            />
                                                        </Button>
                                                    </div>
                                                    <Typography type="body-sm" color="muted">
                                                        {project.description}
                                                    </Typography>
                                                    <div className="flex flex-wrap gap-2">
                                                        {project.tags.map((tag) => (
                                                            <Chip key={tag} size="sm" variant="soft" color="accent">
                                                                {tag}
                                                            </Chip>
                                                        ))}
                                                    </div>
                                                    <a
                                                        href={project.url}
                                                        target="_blank"
                                                        rel="noreferrer noopener"
                                                        className="inline-flex items-center gap-1 text-sm font-medium text-accent no-underline hover:underline"
                                                    >
                                                        {t("profile.portfolio.openProject")}
                                                        <ArrowSquareOutIcon
                                                            className="size-4"
                                                            aria-hidden
                                                            focusable="false"
                                                        />
                                                        <span className="sr-only">
                                                            {t("profile.portfolio.externalHint")}
                                                        </span>
                                                    </a>
                                                    {removingId === project.id ? (
                                                        <RemoveConfirm
                                                            onConfirm={() =>
                                                                patch({
                                                                    projects: portfolio.projects.filter(
                                                                        (item) => item.id !== project.id,
                                                                    ),
                                                                })
                                                            }
                                                            onCancel={() => setRemovingId(null)}
                                                        />
                                                    ) : null}
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            </LabeledCard>

                            {/* certificates */}
                            <LabeledCard label={t("profile.portfolio.certificates.title")}>
                                {portfolio.certificates.length === 0 ? (
                                    <EmptyContent title={t("profile.portfolio.certificates.empty")} />
                                ) : (
                                    <ProfileCertificates certificates={portfolio.certificates} />
                                )}
                            </LabeledCard>

                            {/* achievements */}
                            <LabeledCard label={t("profile.portfolio.achievements.title")} frameless>
                                {portfolio.achievements.length === 0 ? (
                                    <EmptyContent title={t("profile.portfolio.achievements.empty")} />
                                ) : (
                                    <ProfileAchievements achievements={portfolio.achievements} />
                                )}
                            </LabeledCard>

                            {/* external links */}
                            <LabeledCard
                                label={t("profile.portfolio.links")}
                                action={
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onPress={() => setEditing({ kind: "addLink" })}
                                    >
                                        <PlusIcon className="size-4" aria-hidden focusable="false" />
                                        {t("profile.portfolio.addLink")}
                                    </Button>
                                }
                            >
                                <div className="flex flex-col gap-3">
                                    {editing?.kind === "addLink" ? (
                                        <LinkForm
                                            initial={{ label: "", url: "" }}
                                            onSave={(draft) => saveLink(draft)}
                                            onCancel={() => setEditing(null)}
                                        />
                                    ) : null}
                                    {portfolio.links.map((link) =>
                                        editing?.kind === "editLink" && editing.id === link.id ? (
                                            <LinkForm
                                                key={link.id}
                                                initial={{ label: link.label, url: link.url }}
                                                onSave={(draft) => saveLink(draft, link.id)}
                                                onCancel={() => setEditing(null)}
                                            />
                                        ) : (
                                            <div
                                                key={link.id}
                                                className="flex flex-wrap items-center gap-3 rounded-2xl border border-separator p-4"
                                            >
                                                <LinkIcon
                                                    className="size-5 shrink-0 text-muted"
                                                    aria-hidden
                                                    focusable="false"
                                                />
                                                <Typography
                                                    type="body-sm"
                                                    weight="medium"
                                                    className="shrink-0"
                                                >
                                                    {link.label}
                                                </Typography>
                                                <a
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noreferrer noopener"
                                                    className="inline-flex min-w-0 flex-1 items-center gap-1 truncate text-sm text-accent no-underline hover:underline"
                                                >
                                                    <span className="truncate">{link.url}</span>
                                                    <ArrowSquareOutIcon
                                                        className="size-4 shrink-0"
                                                        aria-hidden
                                                        focusable="false"
                                                    />
                                                    <span className="sr-only">
                                                        {t("profile.portfolio.externalHint")}
                                                    </span>
                                                </a>
                                                {removingId === link.id ? (
                                                    <RemoveConfirm
                                                        onConfirm={() =>
                                                            patch({
                                                                links: portfolio.links.filter(
                                                                    (item) => item.id !== link.id,
                                                                ),
                                                            })
                                                        }
                                                        onCancel={() => setRemovingId(null)}
                                                    />
                                                ) : (
                                                    <div className="flex shrink-0 gap-2">
                                                        <Button
                                                            isIconOnly
                                                            size="sm"
                                                            variant="ghost"
                                                            aria-label={t("profile.portfolio.editLink")}
                                                            onPress={() =>
                                                                setEditing({ kind: "editLink", id: link.id })
                                                            }
                                                        >
                                                            <PencilSimpleIcon
                                                                className="size-4"
                                                                aria-hidden
                                                                focusable="false"
                                                            />
                                                        </Button>
                                                        <Button
                                                            isIconOnly
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-danger"
                                                            aria-label={t("profile.portfolio.remove")}
                                                            onPress={() => setRemovingId(link.id)}
                                                        >
                                                            <TrashIcon
                                                                className="size-4"
                                                                aria-hidden
                                                                focusable="false"
                                                            />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ),
                                    )}
                                </div>
                            </LabeledCard>
                        </>
                    )}
                </div>
            ) : null}
        </AsyncContent>
    )
}
