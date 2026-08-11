"use client"

import React, { useState } from "react"
import { Button, Chip, Input, TextField, Typography } from "@heroui/react"
import { LinkIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useDeleteCareerSkillSubjectSwr } from "@/hooks/swr/api/rest/mutations/useDeleteCareerSkillSubjectSwr"
import { usePostMapCareerSkillSubjectSwr } from "@/hooks/swr/api/rest/mutations/usePostMapCareerSkillSubjectSwr"
import { useGetCareerSkillSubjectsSwr } from "@/hooks/swr/api/rest/queries/useGetCareerSkillSubjectsSwr"
import { useGetCareerSkillsSwr } from "@/hooks/swr/api/rest/queries/useGetCareerSkillsSwr"
import type { CareerSkillSubjectLink } from "@/modules/api/rest/career"
import { RestError } from "@/modules/api/rest/client"
import { useRestWithToast } from "@/modules/toast/hooks"
import { useQuerySubjectSwr, type Subject } from "../hooks/useQuerySubjectSwr"
import { useQuerySubjectsSwr } from "../hooks/useQuerySubjectsSwr"

/** Shared class of the native select (this workspace has no HeroUI Select on canon yet). */
const SELECT_CLASS =
    "w-full rounded-large border border-separator bg-default/40 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent disabled:cursor-not-allowed disabled:opacity-60"

/**
 * Parses the weight box.
 *
 * `career.skill_subject_map.weight` is `numeric(3,2)` CHECK 0..1 (V120), so a value
 * outside that range is a constraint violation, not a new option. An EMPTY box means
 * "no weight in the body" (the backend picks its default) — which is why `null` is
 * returned both for empty and for invalid input, and the caller tells the two apart by
 * looking at the raw text.
 *
 * @param text - the raw box content.
 * @returns the weight to send, or `null` when nothing should be sent.
 */
export const parseSkillSubjectWeight = (text: string): number | null => {
    const trimmed = text.trim()
    if (trimmed.length === 0) {
        return null
    }
    const weight = Number(trimmed)
    if (!Number.isFinite(weight) || weight < 0 || weight > 1) {
        return null
    }
    return weight
}

/** One `career.skill_subject_map` row, joined with the subject catalogue. */
export interface SkillSubjectRow {
    /** Subject UUID as the map row carries it. */
    id: string
    weight: number
    /** Catalogue match, or `null` when no subject carries that id. */
    subject: Subject | null
    /** True when the row points at the subject being viewed. */
    isCurrent: boolean
}

/**
 * Joins `GET /career/skills/{slug}/subjects` (id + weight ONLY) with the subject
 * catalogue so the list reads as subjects instead of as raw UUIDs.
 *
 * @param links - the map rows, straight off the wire.
 * @param subjectByUuid - subject catalogue, keyed by UUID.
 * @param currentSubjectUuid - the subject being viewed (`""` while it resolves).
 * @returns rows, the viewed subject first, then by code — an unresolved id keeps its
 * row (it is a STALE mapping to be cleaned up, not a row to swallow).
 */
export const joinSkillSubjectRows = (
    links: Array<CareerSkillSubjectLink>,
    subjectByUuid: Map<string, Subject>,
    currentSubjectUuid: string,
): Array<SkillSubjectRow> =>
    (links ?? [])
        .map((link) => {
            const id = link.subject_id ?? link.subjectId ?? ""
            return {
                id,
                weight: link.weight,
                subject: subjectByUuid.get(id) ?? null,
                isCurrent: id.length > 0 && id === currentSubjectUuid,
            }
        })
        .filter((row) => row.id.length > 0)
        .sort(
            (a, b) =>
                Number(b.isCurrent) - Number(a.isCurrent) ||
                (a.subject?.code ?? "").localeCompare(b.subject?.code ?? "") ||
                a.id.localeCompare(b.id),
        )

/** Props for {@link SkillSubjectMapper}. */
export interface SkillSubjectMapperProps {
    /** Revalidates the career tab after a write that touches the viewed subject. */
    onChanged: () => void
}

/**
 * Maps a catalogue skill onto the subject being viewed, and unmaps it —
 * `career.skill_subject_map`, which is what feeds the tab's "related skills".
 *
 * Endpoints (all `career.manage`, all idempotent):
 * `POST`/`DELETE /career/skills/{slug}/subjects/{subjectId}` and
 * `GET /career/skills/{slug}/subjects`.
 *
 * ⚠️ Two contract traps drive this UI:
 *
 * 1. the GET answers `{subject_id, weight}` and NOTHING else, so every row is joined
 *    against the subject catalogue — printing bare UUIDs at a curator is exactly the
 *    complaint the moderation queue just got;
 * 2. a mapped id may resolve to NO subject (the V121 dev seed left stale rows behind).
 *    Such a row keeps its id on screen and stays actionable (removing it is the only way
 *    to clean it up) — it is never rendered blank. The label says the NAME could not be
 *    resolved, NOT that the subject was deleted: the catalogue read is one page of at
 *    most 100 PUBLISHED subjects, so a live draft/archived/101st subject lands here too,
 *    and only the id itself is a fact this component can prove.
 *
 * The route segment is the subject CODE, so the write id comes from the resolved
 * subject (`Subject.uuid`) — a code posted there would be a 404.
 *
 * Rendered by {@link import("./CareerAdminPanel").CareerAdminPanel} INSIDE its
 * `career.manage` branch: the permission is checked once there, and mounting is what
 * gates the reads below (no second gate here).
 */
export const SkillSubjectMapper = ({ onChanged }: SkillSubjectMapperProps) => {
    const t = useTranslations("subjects")
    const runRest = useRestWithToast()
    const { subjectId: routeSubjectId } = useParams<{ subjectId: string }>()
    // The workspace shell already reads this (same SWR key) — no extra request.
    const { subject } = useQuerySubjectSwr(routeSubjectId)
    const subjectUuid = subject?.uuid ?? ""
    const {
        subjects,
        isLoading: isCatalogueLoading,
        error: catalogueError,
    } = useQuerySubjectsSwr()
    const skillsSwr = useGetCareerSkillsSwr()

    const [skillSlug, setSkillSlug] = useState("")
    const [weightText, setWeightText] = useState("")
    const [pendingSubjectId, setPendingSubjectId] = useState<string | null>(null)

    const linksSwr = useGetCareerSkillSubjectsSwr(skillSlug.length > 0 ? skillSlug : null)
    const mapSkill = usePostMapCareerSkillSubjectSwr()
    const unmapSkill = useDeleteCareerSkillSubjectSwr()

    const busy = mapSkill.isMutating || unmapSkill.isMutating
    const skills = [...(skillsSwr.data?.skills ?? [])].sort((a, b) =>
        a.name.localeCompare(b.name),
    )
    const weight = parseSkillSubjectWeight(weightText)
    const isWeightInvalid = weightText.trim().length > 0 && weight === null

    // A non-match may only be called STALE once the catalogue actually answered;
    // while it loads (or after it failed) the id simply has no name yet.
    const isCatalogueResolved = !isCatalogueLoading && !catalogueError && subjects.length > 0
    const subjectByUuid = new Map(subjects.map((entry) => [entry.uuid, entry]))
    const rows = joinSkillSubjectRows(linksSwr.data ?? [], subjectByUuid, subjectUuid)
    const currentRow = rows.find((row) => row.isCurrent) ?? null

    /**
     * Surfaces the one domain rejection these writes have — a subject the career module
     * cannot resolve (404 `CAREER_SUBJECT_NOT_FOUND`) — as its own message instead of the
     * generic error toast. Only the ATTACH path can raise it: the backend guards the write
     * with `requireSubjectExists` because `skill_subject_map.subject_id` has no FK, while
     * the delete is deliberately unguarded so a stale row can always be cleaned up.
     */
    const mapSubjectError = (error: unknown): never => {
        if (error instanceof RestError && error.errorCode === "CAREER_SUBJECT_NOT_FOUND") {
            throw new Error(t("career.admin.map.subjectNotFound"))
        }
        throw error
    }

    /** `POST /career/skills/{slug}/subjects/{uuid}` — attach (or re-weight) the pair. */
    const attach = async () => {
        if (busy || skillSlug.length === 0 || subjectUuid.length === 0 || isWeightInvalid) {
            return
        }
        const done = await runRest(
            async () => {
                try {
                    await mapSkill.trigger({
                        slug: skillSlug,
                        subjectId: subjectUuid,
                        ...(weight === null ? {} : { weight }),
                    })
                } catch (error) {
                    mapSubjectError(error)
                }
                return true as const
            },
            { successMessage: t("career.admin.map.attached") },
        )
        if (done) {
            // The BE evicts its own cache; what is left is the FE one — the skill's row
            // list AND the tab, whose "related skills" come from this very map.
            void linksSwr.mutate()
            onChanged()
        }
    }

    /** `DELETE /career/skills/{slug}/subjects/{id}` — detach one row (stale ones too). */
    const detach = async (targetSubjectId: string) => {
        if (busy || skillSlug.length === 0) {
            return
        }
        setPendingSubjectId(targetSubjectId)
        const done = await runRest(
            async () => {
                try {
                    await unmapSkill.trigger({ slug: skillSlug, subjectId: targetSubjectId })
                } catch (error) {
                    mapSubjectError(error)
                }
                return true as const
            },
            { successMessage: t("career.admin.map.detached") },
        )
        setPendingSubjectId(null)
        if (done) {
            void linksSwr.mutate()
            // Only a row of THIS subject changes what the tab shows; re-reading the whole
            // career aggregate for someone else's subject would be a wasted fan-out.
            if (targetSubjectId === subjectUuid) {
                onChanged()
            }
        }
    }

    return (
        <div className="flex flex-col gap-2 border-t border-separator pt-4">
            <Typography type="body-sm" weight="semibold">
                {t("career.admin.map.title")}
            </Typography>
            <Typography type="body-xs" color="muted">
                {t("career.admin.map.hint")}
            </Typography>

            <select
                aria-label={t("career.admin.map.skillLabel")}
                value={skillSlug}
                disabled={busy || skillsSwr.isLoading}
                onChange={(event) => setSkillSlug(event.target.value)}
                className={SELECT_CLASS}
            >
                <option value="">
                    {skillsSwr.isLoading
                        ? t("career.admin.map.skillsLoading")
                        : t("career.admin.map.skillPlaceholder")}
                </option>
                {skills.map((skill) => (
                    // the write keys on the skill SLUG, not its id
                    <option key={skill.slug} value={skill.slug}>
                        {skill.name}
                    </option>
                ))}
            </select>
            {skillsSwr.error ? (
                <Typography type="body-xs" color="muted">
                    {t("career.admin.map.skillsError")}
                </Typography>
            ) : null}

            <TextField className="w-full" aria-label={t("career.admin.map.weightLabel")}>
                <Input
                    variant="secondary"
                    inputMode="decimal"
                    value={weightText}
                    onChange={(event) => setWeightText(event.target.value)}
                    placeholder={t("career.admin.map.weightLabel")}
                    aria-label={t("career.admin.map.weightLabel")}
                    disabled={busy}
                />
            </TextField>
            {isWeightInvalid ? (
                <Typography type="body-xs" color="muted">
                    {t("career.admin.map.weightInvalid")}
                </Typography>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
                <Typography type="body-xs" color="muted" className="flex-1">
                    {subject
                        ? t("career.admin.map.currentSubjectHint", {
                            code: subject.code,
                            name: subject.name,
                        })
                        : t("career.admin.map.currentSubjectLoading")}
                </Typography>
                {currentRow ? (
                    <Button
                        size="sm"
                        variant="secondary"
                        isPending={pendingSubjectId === subjectUuid}
                        isDisabled={busy}
                        onPress={() => void detach(subjectUuid)}
                    >
                        {t("career.admin.map.detachCurrent")}
                    </Button>
                ) : null}
                <Button
                    size="sm"
                    variant="primary"
                    isPending={mapSkill.isMutating}
                    isDisabled={
                        busy ||
                        skillSlug.length === 0 ||
                        subjectUuid.length === 0 ||
                        isWeightInvalid
                    }
                    onPress={() => void attach()}
                >
                    <LinkIcon aria-hidden focusable="false" className="size-4" />
                    {currentRow
                        ? t("career.admin.map.updateWeight")
                        : t("career.admin.map.attach")}
                </Button>
            </div>

            {skillSlug.length > 0 ? (
                <>
                    <Typography type="body-xs" color="muted">
                        {t("career.admin.map.listTitle")}
                    </Typography>
                    {!isCatalogueResolved && !linksSwr.error && rows.length > 0 ? (
                        <Typography type="body-xs" color="muted">
                            {t("career.admin.map.catalogueUnavailable")}
                        </Typography>
                    ) : null}
                    {linksSwr.error ? (
                        <Typography type="body-xs" color="muted">
                            {t("career.admin.map.listError")}
                        </Typography>
                    ) : linksSwr.isLoading ? (
                        <Typography type="body-xs" color="muted">
                            {t("career.admin.map.listLoading")}
                        </Typography>
                    ) : rows.length === 0 ? (
                        <Typography type="body-xs" color="muted">
                            {t("career.admin.map.listEmpty")}
                        </Typography>
                    ) : (
                        rows.map((row) => (
                            <div
                                key={row.id}
                                className="flex flex-wrap items-center gap-2 rounded-2xl border border-separator p-3"
                            >
                                <div className="min-w-0 flex-1">
                                    <Typography type="body-sm" weight="medium" truncate>
                                        {row.subject
                                            ? `${row.subject.code} — ${row.subject.name}`
                                            : isCatalogueResolved
                                                ? t("career.admin.map.missingSubject")
                                                : row.id}
                                    </Typography>
                                    <Typography type="body-xs" color="muted" className="truncate">
                                        {row.subject
                                            ? t("career.admin.map.weightValue", {
                                                weight: row.weight,
                                            })
                                            : `${t("career.admin.map.weightValue", { weight: row.weight })} · ${row.id}`}
                                    </Typography>
                                </div>
                                {row.isCurrent ? (
                                    <Chip size="sm" variant="soft" color="accent">
                                        {t("career.admin.map.currentSubject")}
                                    </Chip>
                                ) : null}
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    isPending={pendingSubjectId === row.id}
                                    isDisabled={busy}
                                    onPress={() => void detach(row.id)}
                                >
                                    {t("career.admin.map.detach")}
                                </Button>
                            </div>
                        ))
                    )}
                </>
            ) : null}
        </div>
    )
}
