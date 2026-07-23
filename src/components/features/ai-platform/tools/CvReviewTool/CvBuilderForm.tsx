"use client"

import React, { useEffect, useRef, useState } from "react"
import useSWR from "swr"
import {
    Button,
    Input,
    Label,
    TextArea,
    TextField,
    Typography,
    cn,
} from "@heroui/react"
import { PlusIcon, TrashIcon, FilePdfIcon, WarningCircleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { getMyCv, putMyCv } from "@/modules/api/rest/career"
import type { CvSections, CvStatus } from "@/modules/api/rest/career"
import {
    cvHeaderErrors,
    emptyAward,
    emptyCvLink,
    emptyCvSections,
    emptyEducation,
    emptyExperience,
    emptyProject,
    emptySkillGroup,
    linesToList,
    listToLines,
    type CvHeaderErrorField,
} from "./sections"

/** SWR key for the caller's CV. */
export const MY_CV_SWR_KEY = "GET_MY_CV"

/** Props for {@link CvBuilderForm}. */
export interface CvBuilderFormProps {
    /** Submit a review of the just-saved CV by its profile id. */
    onReview: (cvProfileId: string) => void
    /** True while a review job is submitting/running (disables the review button). */
    isReviewBusy: boolean
}

// ---- small field primitives (house pattern: Typography/Label + TextField+Input) ----

const Field = ({
    label,
    value,
    onChange,
    placeholder,
    invalid,
    type = "text",
}: {
    label: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
    invalid?: boolean
    type?: string
}) => (
    <TextField variant="primary" className="w-full">
        <Label className="text-sm">{label}</Label>
        <Input
            type={type}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className={cn(invalid && "border-danger")}
        />
    </TextField>
)

const ListField = ({
    label,
    value,
    onChange,
    hint,
}: {
    label: string
    value: string
    onChange: (value: string) => void
    hint: string
}) => (
    <div className="flex flex-col gap-1">
        <TextField variant="primary" className="w-full">
            <Label className="text-sm">{label}</Label>
            <TextArea
                rows={3}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={hint}
                className="resize-y"
            />
        </TextField>
        <Typography type="body-xs" color="muted">
            {hint}
        </Typography>
    </div>
)

/** A repeater section: heading, the rows, and an "add row" button. */
const Repeater = ({
    title,
    children,
    onAdd,
    addLabel,
}: {
    title: string
    children: React.ReactNode
    onAdd: () => void
    addLabel: string
}) => (
    <section className="flex flex-col gap-3">
        <Typography type="h6" weight="semibold">
            {title}
        </Typography>
        {children}
        <Button variant="tertiary" size="sm" className="self-start" onPress={onAdd}>
            <PlusIcon aria-hidden focusable="false" className="size-4" />
            {addLabel}
        </Button>
    </section>
)

/** A single repeater row card with a remove button in the corner. */
const Row = ({ children, onRemove, removeLabel }: {
    children: React.ReactNode
    onRemove: () => void
    removeLabel: string
}) => (
    <div className="relative flex flex-col gap-3 rounded-2xl border border-default bg-surface p-4">
        <Button
            isIconOnly
            variant="tertiary"
            size="sm"
            aria-label={removeLabel}
            className="absolute right-2 top-2"
            onPress={onRemove}
        >
            <TrashIcon aria-hidden focusable="false" className="size-4" />
        </Button>
        {children}
    </div>
)

/**
 * Loading skeleton mirroring the builder's real layout — the personal-details
 * heading + title field + 2-col grid, the summary block, and two repeater
 * headings — so the box holds its shape instead of collapsing behind a spinner.
 */
const CvBuilderFormSkeleton = () => (
    <div className="flex flex-col gap-8" aria-hidden>
        <section className="flex flex-col gap-3">
            <Skeleton.Typography type="h6" width="1/3" />
            <Skeleton.Input />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Skeleton.Input />
                <Skeleton.Input />
                <Skeleton.Input />
                <Skeleton.Input />
            </div>
        </section>
        <section className="flex flex-col gap-3">
            <Skeleton.Typography type="h6" width="1/4" />
            <Skeleton.TextArea rows={3} />
        </section>
        <section className="flex flex-col gap-3">
            <Skeleton.Typography type="h6" width="1/4" />
            <Skeleton className="h-24 w-full rounded-2xl" />
        </section>
        <section className="flex flex-col gap-3">
            <Skeleton.Typography type="h6" width="1/4" />
            <Skeleton className="h-24 w-full rounded-2xl" />
        </section>
    </div>
)

/**
 * The Harvard CV builder form. Loads the caller's CV (empty form when none),
 * edits header + summary + repeaters for education/experience/projects/skills/
 * awards, validates the required header fields, saves via `PUT /career/cv/me`,
 * exports a client-side PDF, and submits the saved CV to a review job.
 *
 * Bullet/highlight/tech/skill lists are edited as one-item-per-line text
 * (`linesToList`) to keep the form flat rather than deeply nested repeaters.
 */
export const CvBuilderForm = ({ onReview, isReviewBusy }: CvBuilderFormProps) => {
    const t = useTranslations("aiPlatform.toolPages.cvReview")
    const swr = useSWR(MY_CV_SWR_KEY, getMyCv)

    const [title, setTitle] = useState("")
    const [status, setStatus] = useState<CvStatus>("DRAFT")
    const [sections, setSections] = useState<CvSections>(emptyCvSections)
    const [errors, setErrors] = useState<CvHeaderErrorField[]>([])
    const [saveError, setSaveError] = useState<string | null>(null)
    const [saved, setSaved] = useState(false)
    const [busy, setBusy] = useState<null | "save" | "review" | "pdf">(null)

    // Hydrate once from the loaded CV (or leave the empty form for a first-time user).
    const hydratedRef = useRef(false)
    useEffect(() => {
        if (hydratedRef.current || swr.data === undefined) return
        hydratedRef.current = true
        if (swr.data) {
            setTitle(swr.data.title ?? "")
            setStatus(swr.data.status ?? "DRAFT")
            setSections({ ...emptyCvSections(), ...swr.data.sections })
        }
    }, [swr.data])

    const patchSections = (patch: Partial<CvSections>) => {
        setSections((prev) => ({ ...prev, ...patch }))
        setSaved(false)
    }
    const patchHeader = (patch: Partial<NonNullable<CvSections["header"]>>) =>
        patchSections({ header: { ...sections.header, ...patch } })

    // List-item helpers over a section array. Typed loosely (the section arrays are
    // a union of item shapes that TS can't index by a variable key) — the call sites
    // supply the correctly-shaped patch/factory.
    type ArraySectionKey = "education" | "experience" | "projects" | "skills" | "awards"
    const sectionArray = (key: ArraySectionKey): Array<Record<string, unknown>> =>
        (sections[key] ?? []) as Array<Record<string, unknown>>
    const updateItem = (key: ArraySectionKey, index: number, patch: Record<string, unknown>) => {
        const list = [...sectionArray(key)]
        list[index] = { ...list[index], ...patch }
        patchSections({ [key]: list } as Partial<CvSections>)
    }
    const addItem = (key: ArraySectionKey, factory: () => object) =>
        patchSections({ [key]: [...sectionArray(key), factory()] } as Partial<CvSections>)
    const removeItem = (key: ArraySectionKey, index: number) =>
        patchSections({
            [key]: sectionArray(key).filter((_, i) => i !== index),
        } as Partial<CvSections>)

    // Header links.
    const links = sections.header?.links ?? []
    const updateLink = (index: number, patch: { label?: string; url?: string }) => {
        const next = [...links]
        next[index] = { ...next[index], ...patch }
        patchHeader({ links: next })
    }

    /** Validate + PUT; returns the saved profile id, or null on validation/save failure. */
    const save = async (): Promise<string | null> => {
        const headerErrors = cvHeaderErrors(sections)
        setErrors(headerErrors)
        if (headerErrors.length > 0) return null
        setSaveError(null)
        try {
            const result = await putMyCv({ title: title.trim() || undefined, sections, status })
            setSaved(true)
            setTitle(result.title)
            setStatus(result.status)
            void swr.mutate(result, { revalidate: false })
            return result.id
        } catch (error) {
            setSaveError(error instanceof Error ? error.message : String(error))
            return null
        }
    }

    const handleSave = async () => {
        setBusy("save")
        await save()
        setBusy(null)
    }

    const handleReview = async () => {
        setBusy("review")
        const id = await save()
        setBusy(null)
        if (id) onReview(id)
    }

    const handleExportPdf = async () => {
        const headerErrors = cvHeaderErrors(sections)
        setErrors(headerErrors)
        if (headerErrors.length > 0) return
        setBusy("pdf")
        try {
            const { renderCvPdfBlob } = await import("./pdf")
            const blob = await renderCvPdfBlob(
                { title: title.trim() || t("pdfUntitled"), sections },
                {
                    summary: t("sections.summary"),
                    education: t("sections.education"),
                    experience: t("sections.experience"),
                    projects: t("sections.projects"),
                    skills: t("sections.skills"),
                    awards: t("sections.awards"),
                    untitled: t("pdfUntitled"),
                },
            )
            const url = URL.createObjectURL(blob)
            const anchor = document.createElement("a")
            anchor.href = url
            anchor.download = `${(sections.header?.fullName || title || "cv").trim().replace(/\s+/g, "_")}.pdf`
            document.body.appendChild(anchor)
            anchor.click()
            anchor.remove()
            URL.revokeObjectURL(url)
        } catch (error) {
            setSaveError(error instanceof Error ? error.message : String(error))
        } finally {
            setBusy(null)
        }
    }

    const hasError = (field: CvHeaderErrorField) => errors.includes(field)
    const anyBusy = busy !== null || isReviewBusy

    // Load-state switch. On a failed load we show an error with retry rather than
    // an empty editable form — saving from a blank form would upsert an empty CV
    // over the caller's saved one (PUT /career/cv/me is an upsert).
    return (
        <AsyncContent
            isLoading={swr.isLoading && !swr.data}
            skeleton={<CvBuilderFormSkeleton />}
            error={!swr.data ? swr.error : undefined}
            errorContent={{
                title: t("loadError.title"),
                description: t("loadError.description"),
                onRetry: () => void swr.mutate(),
                retryLabel: t("loadError.retry"),
            }}
        >
            <div className="flex flex-col gap-8">
                {/* Header */}
                <section className="flex flex-col gap-3">
                    <Typography type="h6" weight="semibold">
                        {t("sections.header")}
                    </Typography>
                    <Field
                        label={t("fields.title")}
                        value={title}
                        onChange={(value) => {
                            setTitle(value)
                            setSaved(false)
                        }}
                        placeholder={t("fields.titlePlaceholder")}
                    />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Field
                            label={t("fields.fullName")}
                            value={sections.header?.fullName ?? ""}
                            onChange={(value) => patchHeader({ fullName: value })}
                            invalid={hasError("fullName")}
                        />
                        <Field
                            label={t("fields.email")}
                            value={sections.header?.email ?? ""}
                            onChange={(value) => patchHeader({ email: value })}
                            invalid={hasError("email")}
                            type="email"
                        />
                        <Field
                            label={t("fields.phone")}
                            value={sections.header?.phone ?? ""}
                            onChange={(value) => patchHeader({ phone: value })}
                        />
                        <Field
                            label={t("fields.location")}
                            value={sections.header?.location ?? ""}
                            onChange={(value) => patchHeader({ location: value })}
                        />
                    </div>
                    {errors.length > 0 ? (
                        <Typography type="body-xs" className="text-danger">
                            {t("headerRequired")}
                        </Typography>
                    ) : null}
                    {/* Links */}
                    <div className="flex flex-col gap-2">
                        {links.map((link, index) => (
                            <div key={index} className="flex items-end gap-2">
                                <Field
                                    label={t("fields.linkLabel")}
                                    value={link.label ?? ""}
                                    onChange={(value) => updateLink(index, { label: value })}
                                />
                                <Field
                                    label={t("fields.linkUrl")}
                                    value={link.url ?? ""}
                                    onChange={(value) => updateLink(index, { url: value })}
                                />
                                <Button
                                    isIconOnly
                                    variant="tertiary"
                                    size="sm"
                                    aria-label={t("actions.remove")}
                                    onPress={() => patchHeader({ links: links.filter((_, i) => i !== index) })}
                                >
                                    <TrashIcon aria-hidden focusable="false" className="size-4" />
                                </Button>
                            </div>
                        ))}
                        <Button
                            variant="tertiary"
                            size="sm"
                            className="self-start"
                            onPress={() => patchHeader({ links: [...links, emptyCvLink()] })}
                        >
                            <PlusIcon aria-hidden focusable="false" className="size-4" />
                            {t("actions.addLink")}
                        </Button>
                    </div>
                </section>

                {/* Summary */}
                <section className="flex flex-col gap-3">
                    <Typography type="h6" weight="semibold">
                        {t("sections.summary")}
                    </Typography>
                    <TextField variant="primary" className="w-full">
                        <TextArea
                            rows={3}
                            value={sections.summary ?? ""}
                            onChange={(event) => patchSections({ summary: event.target.value })}
                            placeholder={t("fields.summaryPlaceholder")}
                            className="resize-y"
                        />
                    </TextField>
                </section>

                {/* Education */}
                <Repeater
                    title={t("sections.education")}
                    onAdd={() => addItem("education", emptyEducation)}
                    addLabel={t("actions.addEducation")}
                >
                    {(sections.education ?? []).map((item, index) => (
                        <Row key={index} onRemove={() => removeItem("education", index)} removeLabel={t("actions.remove")}>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Field label={t("fields.school")} value={item.school ?? ""} onChange={(v) => updateItem("education", index, { school: v })} />
                                <Field label={t("fields.degree")} value={item.degree ?? ""} onChange={(v) => updateItem("education", index, { degree: v })} />
                                <Field label={t("fields.major")} value={item.major ?? ""} onChange={(v) => updateItem("education", index, { major: v })} />
                                <Field label={t("fields.gpa")} value={item.gpa ?? ""} onChange={(v) => updateItem("education", index, { gpa: v })} />
                                <Field label={t("fields.start")} value={item.start ?? ""} onChange={(v) => updateItem("education", index, { start: v })} />
                                <Field label={t("fields.end")} value={item.end ?? ""} onChange={(v) => updateItem("education", index, { end: v })} />
                            </div>
                            <ListField
                                label={t("fields.highlights")}
                                hint={t("fields.lineHint")}
                                value={listToLines(item.highlights)}
                                onChange={(v) => updateItem("education", index, { highlights: linesToList(v) })}
                            />
                        </Row>
                    ))}
                </Repeater>

                {/* Experience */}
                <Repeater
                    title={t("sections.experience")}
                    onAdd={() => addItem("experience", emptyExperience)}
                    addLabel={t("actions.addExperience")}
                >
                    {(sections.experience ?? []).map((item, index) => (
                        <Row key={index} onRemove={() => removeItem("experience", index)} removeLabel={t("actions.remove")}>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Field label={t("fields.company")} value={item.company ?? ""} onChange={(v) => updateItem("experience", index, { company: v })} />
                                <Field label={t("fields.jobTitle")} value={item.title ?? ""} onChange={(v) => updateItem("experience", index, { title: v })} />
                                <Field label={t("fields.start")} value={item.start ?? ""} onChange={(v) => updateItem("experience", index, { start: v })} />
                                <Field label={t("fields.end")} value={item.end ?? ""} onChange={(v) => updateItem("experience", index, { end: v })} />
                            </div>
                            <ListField
                                label={t("fields.bullets")}
                                hint={t("fields.lineHint")}
                                value={listToLines(item.bullets)}
                                onChange={(v) => updateItem("experience", index, { bullets: linesToList(v) })}
                            />
                        </Row>
                    ))}
                </Repeater>

                {/* Projects */}
                <Repeater
                    title={t("sections.projects")}
                    onAdd={() => addItem("projects", emptyProject)}
                    addLabel={t("actions.addProject")}
                >
                    {(sections.projects ?? []).map((item, index) => (
                        <Row key={index} onRemove={() => removeItem("projects", index)} removeLabel={t("actions.remove")}>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Field label={t("fields.projectName")} value={item.name ?? ""} onChange={(v) => updateItem("projects", index, { name: v })} />
                                <Field label={t("fields.role")} value={item.role ?? ""} onChange={(v) => updateItem("projects", index, { role: v })} />
                                <Field label={t("fields.link")} value={item.link ?? ""} onChange={(v) => updateItem("projects", index, { link: v })} />
                            </div>
                            <ListField
                                label={t("fields.tech")}
                                hint={t("fields.lineHint")}
                                value={listToLines(item.tech)}
                                onChange={(v) => updateItem("projects", index, { tech: linesToList(v) })}
                            />
                            <ListField
                                label={t("fields.bullets")}
                                hint={t("fields.lineHint")}
                                value={listToLines(item.bullets)}
                                onChange={(v) => updateItem("projects", index, { bullets: linesToList(v) })}
                            />
                        </Row>
                    ))}
                </Repeater>

                {/* Skills */}
                <Repeater
                    title={t("sections.skills")}
                    onAdd={() => addItem("skills", emptySkillGroup)}
                    addLabel={t("actions.addSkill")}
                >
                    {(sections.skills ?? []).map((item, index) => (
                        <Row key={index} onRemove={() => removeItem("skills", index)} removeLabel={t("actions.remove")}>
                            <Field label={t("fields.skillGroup")} value={item.group ?? ""} onChange={(v) => updateItem("skills", index, { group: v })} />
                            <ListField
                                label={t("fields.skillItems")}
                                hint={t("fields.lineHint")}
                                value={listToLines(item.items)}
                                onChange={(v) => updateItem("skills", index, { items: linesToList(v) })}
                            />
                        </Row>
                    ))}
                </Repeater>

                {/* Awards */}
                <Repeater
                    title={t("sections.awards")}
                    onAdd={() => addItem("awards", emptyAward)}
                    addLabel={t("actions.addAward")}
                >
                    {(sections.awards ?? []).map((item, index) => (
                        <Row key={index} onRemove={() => removeItem("awards", index)} removeLabel={t("actions.remove")}>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <Field label={t("fields.awardName")} value={item.name ?? ""} onChange={(v) => updateItem("awards", index, { name: v })} />
                                <Field label={t("fields.awardBy")} value={item.by ?? ""} onChange={(v) => updateItem("awards", index, { by: v })} />
                                <Field label={t("fields.awardYear")} value={item.year ?? ""} onChange={(v) => updateItem("awards", index, { year: v })} />
                            </div>
                        </Row>
                    ))}
                </Repeater>

                {saveError ? (
                    <div className="flex items-center gap-2 rounded-2xl border border-danger/40 bg-danger/5 px-4 py-3">
                        <WarningCircleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-danger" />
                        <Typography type="body-sm" color="muted">
                            {saveError}
                        </Typography>
                    </div>
                ) : null}
                {saved ? (
                    <Typography type="body-sm" className="text-success">
                        {t("saved")}
                    </Typography>
                ) : null}

                <div className="flex flex-wrap gap-3">
                    <Button variant="primary" onPress={handleReview} isPending={busy === "review" || isReviewBusy} isDisabled={anyBusy}>
                        {t("reviewThisCv")}
                    </Button>
                    <Button variant="secondary" onPress={handleSave} isPending={busy === "save"} isDisabled={anyBusy}>
                        {t("save")}
                    </Button>
                    <Button
                        variant="tertiary"
                        onPress={handleExportPdf}
                        isPending={busy === "pdf"}
                        isDisabled={anyBusy}
                    >
                        <FilePdfIcon aria-hidden focusable="false" className="size-4" />
                        {t("exportPdf")}
                    </Button>
                </div>
            </div>
        </AsyncContent>
    )
}
