"use client"

import React, { useCallback, useId, useState } from "react"
import { Button, Chip, Input, Label, TextField, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { ArrowSquareOutIcon, LinkIcon, PencilSimpleIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
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
    const t = useTranslations("profile")
    const formId = useId()
    const [draft, setDraft] = useState<ProjectDraft>(initial)
    const canSave = draft.title.trim().length > 0 && draft.url.trim().length > 0
    return (
        <div className="flex flex-col gap-3 rounded-3xl border border-separator p-4">
            <FieldRow
                id={`${formId}-title`}
                label={t("portfolio.form.title")}
                value={draft.title}
                required
                onChange={(title) => setDraft({ ...draft, title })}
            />
            <FieldRow
                id={`${formId}-description`}
                label={t("portfolio.form.description")}
                value={draft.description}
                onChange={(description) => setDraft({ ...draft, description })}
            />
            <FieldRow
                id={`${formId}-tags`}
                label={t("portfolio.form.tags")}
                value={draft.tags}
                onChange={(tags) => setDraft({ ...draft, tags })}
            />
            <FieldRow
                id={`${formId}-url`}
                label={t("portfolio.form.url")}
                value={draft.url}
                required
                onChange={(url) => setDraft({ ...draft, url })}
            />
            <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onPress={onCancel}>
                    {t("portfolio.form.cancel")}
                </Button>
                <Button size="sm" variant="primary" isDisabled={!canSave} onPress={() => onSave(draft)}>
                    {t("portfolio.form.save")}
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
    const t = useTranslations("profile")
    const formId = useId()
    const [draft, setDraft] = useState<LinkDraft>(initial)
    const canSave = draft.label.trim().length > 0 && draft.url.trim().length > 0
    return (
        <div className="flex flex-col gap-3 rounded-3xl border border-separator p-4">
            <FieldRow
                id={`${formId}-label`}
                label={t("portfolio.form.label")}
                value={draft.label}
                required
                onChange={(label) => setDraft({ ...draft, label })}
            />
            <FieldRow
                id={`${formId}-url`}
                label={t("portfolio.form.url")}
                value={draft.url}
                required
                onChange={(url) => setDraft({ ...draft, url })}
            />
            <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onPress={onCancel}>
                    {t("portfolio.form.cancel")}
                </Button>
                <Button size="sm" variant="primary" isDisabled={!canSave} onPress={() => onSave(draft)}>
                    {t("portfolio.form.save")}
                </Button>
            </div>
        </div>
    )
}

/** Two-step inline remove confirmation (keyboard-operable buttons). */
const RemoveConfirm = ({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) => {
    const t = useTranslations("profile")
    return (
        <div className="flex items-center gap-2">
            <Typography type="body-xs" color="muted">
                {t("portfolio.confirmRemove")}
            </Typography>
            <Button size="sm" variant="danger" onPress={onConfirm}>
                {t("portfolio.confirm")}
            </Button>
            <Button size="sm" variant="ghost" onPress={onCancel}>
                {t("portfolio.cancelRemove")}
            </Button>
        </div>
    )
}

/** Skeleton mirroring the projects grid + links list. */
const PortfolioSkeleton = () => (
    <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Skeleton className="h-32 rounded-large" />
            <Skeleton className="h-32 rounded-large" />
        </div>
        <div className="flex flex-col gap-3">
            <Skeleton.ListRow />
            <Skeleton.ListRow />
        </div>
    </div>
)

/**
 * Portfolio section of the profile — projects (title, description, tech tags,
 * external URL) + external links, seeded from `useQueryMyPortfolioSwr` with
 * CRUD-lite add/edit/remove (remove is a two-step inline confirmation).
 *
 * ponytail: CRUD-lite mutates LOCAL component state only (no persistence) — a
 * reload returns to the seeded mock; swap the hook + wire mutations when BE lands.
 */
export const ProfilePortfolio = () => {
    const t = useTranslations("profile")
    const { data, isLoading, error } = useQueryMyPortfolioSwr()

    // local override starts as the seed and takes over on first edit
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

    /** Split a comma-separated tag string into trimmed, non-empty tags. */
    const parseTags = (tags: string): Array<string> =>
        tags.split(",").map((tag) => tag.trim()).filter(Boolean)

    const saveProject = (draft: ProjectDraft, id?: string) => {
        if (!portfolio) return
        const project: MyPortfolioProject = {
            id: id ?? `pr-${Date.now()}`,
            title: draft.title.trim(),
            description: draft.description.trim(),
            tags: parseTags(draft.tags),
            url: draft.url.trim(),
        }
        patch({
            projects: id
                ? portfolio.projects.map((item) => (item.id === id ? project : item))
                : [...portfolio.projects, project],
        })
    }

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
        >
            {portfolio ? (
                <div className="flex flex-col gap-6">
                    {isEmpty && editing === null ? (
                        // empty state with a CTA to add the first project
                        <div className="flex flex-col items-center gap-3 rounded-large border border-dashed border-separator p-6 text-center">
                            <Typography type="body" weight="medium">
                                {t("portfolio.empty.title")}
                            </Typography>
                            <Typography type="body-sm" color="muted">
                                {t("portfolio.empty.description")}
                            </Typography>
                            <Button size="sm" variant="primary" onPress={() => setEditing({ kind: "addProject" })}>
                                <PlusIcon className="size-4" aria-hidden focusable="false" />
                                {t("portfolio.empty.cta")}
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* projects */}
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <Typography type="h6" weight="bold" className="min-w-0 flex-1">
                                        {t("portfolio.projects")}
                                    </Typography>
                                    <Button size="sm" variant="secondary" onPress={() => setEditing({ kind: "addProject" })}>
                                        <PlusIcon className="size-4" aria-hidden focusable="false" />
                                        {t("portfolio.addProject")}
                                    </Button>
                                </div>
                                {editing?.kind === "addProject" ? (
                                    <ProjectForm
                                        initial={projectDraft()}
                                        onSave={(draft) => saveProject(draft)}
                                        onCancel={() => setEditing(null)}
                                    />
                                ) : null}
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {portfolio.projects.map((project) =>
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
                                                className="flex flex-col gap-2 rounded-3xl border border-separator p-4"
                                            >
                                                <div className="flex items-start gap-2">
                                                    <Typography type="body" weight="medium" className="min-w-0 flex-1">
                                                        {project.title}
                                                    </Typography>
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="ghost"
                                                        aria-label={t("portfolio.editProject")}
                                                        onPress={() => setEditing({ kind: "editProject", id: project.id })}
                                                    >
                                                        <PencilSimpleIcon className="size-4" aria-hidden focusable="false" />
                                                    </Button>
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-danger"
                                                        aria-label={t("portfolio.remove")}
                                                        onPress={() => setRemovingId(project.id)}
                                                    >
                                                        <TrashIcon className="size-4" aria-hidden focusable="false" />
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
                                                    {t("portfolio.openProject")}
                                                    <ArrowSquareOutIcon className="size-4" aria-hidden focusable="false" />
                                                    <span className="sr-only">{t("portfolio.externalHint")}</span>
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

                            {/* external links */}
                            <div className="flex flex-col gap-3 border-t border-separator pt-6">
                                <div className="flex items-center gap-2">
                                    <Typography type="h6" weight="bold" className="min-w-0 flex-1">
                                        {t("portfolio.links")}
                                    </Typography>
                                    <Button size="sm" variant="secondary" onPress={() => setEditing({ kind: "addLink" })}>
                                        <PlusIcon className="size-4" aria-hidden focusable="false" />
                                        {t("portfolio.addLink")}
                                    </Button>
                                </div>
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
                                            className="flex flex-wrap items-center gap-3 rounded-large border border-separator p-4"
                                        >
                                            <LinkIcon className="size-5 shrink-0 text-muted" aria-hidden focusable="false" />
                                            <Typography type="body-sm" weight="medium" className="shrink-0">
                                                {link.label}
                                            </Typography>
                                            <a
                                                href={link.url}
                                                target="_blank"
                                                rel="noreferrer noopener"
                                                className="inline-flex min-w-0 flex-1 items-center gap-1 truncate text-sm text-accent no-underline hover:underline"
                                            >
                                                <span className="truncate">{link.url}</span>
                                                <ArrowSquareOutIcon className="size-4 shrink-0" aria-hidden focusable="false" />
                                                <span className="sr-only">{t("portfolio.externalHint")}</span>
                                            </a>
                                            {removingId === link.id ? (
                                                <RemoveConfirm
                                                    onConfirm={() =>
                                                        patch({
                                                            links: portfolio.links.filter((item) => item.id !== link.id),
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
                                                        aria-label={t("portfolio.editLink")}
                                                        onPress={() => setEditing({ kind: "editLink", id: link.id })}
                                                    >
                                                        <PencilSimpleIcon className="size-4" aria-hidden focusable="false" />
                                                    </Button>
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-danger"
                                                        aria-label={t("portfolio.remove")}
                                                        onPress={() => setRemovingId(link.id)}
                                                    >
                                                        <TrashIcon className="size-4" aria-hidden focusable="false" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ),
                                )}
                            </div>
                        </>
                    )}
                </div>
            ) : null}
        </AsyncContent>
    )
}
