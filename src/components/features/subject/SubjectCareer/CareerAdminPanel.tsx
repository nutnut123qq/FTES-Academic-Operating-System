"use client"

import React, { useState } from "react"
import { Button, Input, TextArea, TextField, Typography } from "@heroui/react"
import { PlusIcon, ShieldCheckIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { usePostCreateCareerOpportunitySwr } from "@/hooks/swr/api/rest/mutations/usePostCreateCareerOpportunitySwr"
import { usePostCreateCareerRoadmapSwr } from "@/hooks/swr/api/rest/mutations/usePostCreateCareerRoadmapSwr"
import { usePostCreateCareerSkillSwr } from "@/hooks/swr/api/rest/mutations/usePostCreateCareerSkillSwr"
import { usePostPatchCareerOpportunitySwr } from "@/hooks/swr/api/rest/mutations/usePostPatchCareerOpportunitySwr"
import { usePostPatchCareerRoadmapSwr } from "@/hooks/swr/api/rest/mutations/usePostPatchCareerRoadmapSwr"
import { useHasPermission } from "@/hooks/useHasPermission"
import { useRestWithToast } from "@/modules/toast/hooks"
import { SkillSubjectMapper } from "./SkillSubjectMapper"
import {
    OPPORTUNITY_TYPE_KEY,
    OPPORTUNITY_TYPES,
    ROADMAP_TRACKS,
    SKILL_CATEGORIES,
} from "./taxonomy"
import { useQueryDraftOpportunitiesSwr } from "./useQueryDraftOpportunitiesSwr"

/** One rung of a skill's `levels` ladder, as the backend stores it (jsonb). */
export interface SkillLevelInput {
    level: number
    name: string
    threshold: number
}

/**
 * Parses the level-ladder editor: one rung per line, `name | threshold`.
 *
 * Mirrors the flashcard bulk editor of this workspace (`front | back`). The `level` number
 * is assigned by POSITION, never typed, so the ladder can never come out with a gap or a
 * duplicate rung. Lines without a separator, without a name, or with a non-numeric /
 * negative threshold are dropped instead of being sent as a broken rung.
 *
 * The list is capped at 5: `career.skill_progress.level` is CHECK-constrained to 0..5, so
 * a 6th rung could never be attained.
 *
 * @param text - the raw editor content.
 * @returns the parsed ladder, in the shape `career.skills.levels` holds.
 */
export const parseSkillLevels = (text: string): Array<SkillLevelInput> => {
    const levels: Array<SkillLevelInput> = []
    for (const line of text.split("\n")) {
        const separator = line.indexOf("|")
        if (separator < 0) continue
        const name = line.slice(0, separator).trim()
        const threshold = Number(line.slice(separator + 1).trim())
        if (name.length === 0) continue
        if (!Number.isFinite(threshold) || threshold < 0) continue
        levels.push({ level: levels.length + 1, name, threshold })
    }
    return levels.slice(0, 5)
}

/** A roadmap created in this session, kept so its DRAFT can still be published. */
interface CreatedRoadmap {
    slug: string
    title: string
}

/** Props for {@link CareerAdminPanel}. */
export interface CareerAdminPanelProps {
    /** Revalidates the career tab so a successful write shows up immediately. */
    onChanged: () => void
}

/**
 * Toggle row standing in for a `<select>` over a small closed token set — the same
 * chip-button pattern the skill-graph domain filter uses.
 */
const TokenPicker = ({
    tokens,
    value,
    label,
    onSelect,
    isDisabled,
}: {
    tokens: ReadonlyArray<string>
    value: string | null
    label: (token: string) => string
    onSelect: (token: string) => void
    isDisabled: boolean
}) => (
    <div className="flex flex-wrap items-center gap-2">
        {tokens.map((token) => (
            <Button
                key={token}
                size="sm"
                variant={value === token ? "secondary" : "ghost"}
                aria-pressed={value === token}
                isDisabled={isDisabled}
                onPress={() => onSelect(token)}
            >
                {label(token)}
            </Button>
        ))}
    </div>
)

/**
 * Career authoring panel for the roles the BACKEND actually lets write.
 *
 * Every action below maps 1:1 onto an existing endpoint; nothing is invented:
 *
 * - `POST /career/skills` (`career.manage`) — a new skill + its level ladder,
 * - `POST` / `DELETE /career/skills/{slug}/subjects/{subjectId}` + `GET
 *   /career/skills/{slug}/subjects` (`career.manage`) — mapping a skill onto THIS
 *   subject, i.e. what fills the tab's "related skills" (see {@link SkillSubjectMapper}),
 * - `POST /career/roadmaps` (`career.manage`) + `PATCH /career/roadmaps/{slug}` — a roadmap
 *   is born `DRAFT` and only a `PUBLISHED` one is listed/enrollable, so the publish step is
 *   offered right next to the freshly created draft,
 * - `POST /career/opportunities` (`career.opportunity.manage`) + `PATCH
 *   /career/opportunities/{id}` — same DRAFT → `OPEN` lifecycle, with the outstanding
 *   drafts read back from the same list endpoint so they survive a reload.
 *
 * The two permissions are checked SEPARATELY because the backend gates them separately:
 * `career.manage` cannot post an opportunity and `career.opportunity.manage` cannot create
 * a skill or a roadmap. A viewer holding neither gets nothing at all (no dead buttons).
 *
 * NOT offered, because no write path exists: editing an opportunity's company / track /
 * location / deadline (the create body carries none of them and the PATCH body carries
 * `status` only).
 */
export const CareerAdminPanel = ({ onChanged }: CareerAdminPanelProps) => {
    const t = useTranslations("subjects")
    const runRest = useRestWithToast()
    const canManageCareer = useHasPermission("career.manage")
    const canManageOpportunity = useHasPermission("career.opportunity.manage")

    const createSkill = usePostCreateCareerSkillSwr()
    const createRoadmap = usePostCreateCareerRoadmapSwr()
    const patchRoadmap = usePostPatchCareerRoadmapSwr()
    const createOpportunity = usePostCreateCareerOpportunitySwr()
    const patchOpportunity = usePostPatchCareerOpportunitySwr()
    const draftsSwr = useQueryDraftOpportunitiesSwr(canManageOpportunity)

    const [skillSlug, setSkillSlug] = useState("")
    const [skillName, setSkillName] = useState("")
    const [skillCategory, setSkillCategory] = useState<string | null>(null)
    const [skillLevelsText, setSkillLevelsText] = useState("")

    const [roadmapSlug, setRoadmapSlug] = useState("")
    const [roadmapTitle, setRoadmapTitle] = useState("")
    const [roadmapTrack, setRoadmapTrack] = useState<string | null>(null)
    const [createdRoadmaps, setCreatedRoadmaps] = useState<Array<CreatedRoadmap>>([])

    const [opportunityType, setOpportunityType] = useState<string | null>(null)
    const [opportunityTitle, setOpportunityTitle] = useState("")
    const [opportunityDescription, setOpportunityDescription] = useState("")
    const [pendingOpportunity, setPendingOpportunity] = useState<string | null>(null)
    const [pendingRoadmap, setPendingRoadmap] = useState<string | null>(null)

    const busy =
        createSkill.isMutating ||
        createRoadmap.isMutating ||
        patchRoadmap.isMutating ||
        createOpportunity.isMutating ||
        patchOpportunity.isMutating

    const parsedLevels = parseSkillLevels(skillLevelsText)

    // Raw BE tokens -> reader labels, falling back to the TOKEN itself so a value we have
    // no translation for still reads as a word (house pattern, cf. CommunityModeration).
    const tokenLabel = (prefix: string, token: string) =>
        t.has(`career.${prefix}.${token}`) ? t(`career.${prefix}.${token}`) : token
    const categoryLabel = (token: string) => tokenLabel("skillCategories", token)
    const trackLabel = (token: string) => tokenLabel("tracks", token)
    const typeLabelOf = (token: string) =>
        t(`career.opportunityTypes.${OPPORTUNITY_TYPE_KEY[token] ?? "other"}`)

    /** `POST /career/skills` — the catalogue feeds the skill rows AND the skill graph. */
    const submitSkill = async () => {
        const slug = skillSlug.trim().toLowerCase()
        const name = skillName.trim()
        if (busy || slug.length === 0 || name.length === 0) return
        if (!skillCategory || parsedLevels.length === 0) return
        const created = await runRest(
            () =>
                createSkill.trigger({
                    slug,
                    name,
                    category: skillCategory,
                    levels: JSON.stringify(parsedLevels),
                }),
            { successMessage: t("career.admin.skillCreated") },
        )
        if (created) {
            setSkillSlug("")
            setSkillName("")
            setSkillLevelsText("")
            // Refetches `GET /career/skills`, so the new skill is in the catalogue the tab
            // names its rows from. It does NOT join this subject on its own — that is the
            // mapper below (`career.skill_subject_map`).
            onChanged()
        }
    }

    /** `POST /career/roadmaps` — lands as DRAFT; the row below publishes it. */
    const submitRoadmap = async () => {
        const slug = roadmapSlug.trim().toLowerCase()
        const title = roadmapTitle.trim()
        if (busy || slug.length === 0 || title.length === 0) return
        const created = await runRest(
            () =>
                createRoadmap.trigger({
                    slug,
                    title,
                    ...(roadmapTrack ? { track: roadmapTrack } : {}),
                }),
            { successMessage: t("career.admin.roadmapCreated") },
        )
        if (created) {
            setCreatedRoadmaps((current) => [
                { slug: created.slug || slug, title: created.title || title },
                ...current.filter((entry) => entry.slug !== slug),
            ])
            setRoadmapSlug("")
            setRoadmapTitle("")
        }
    }

    /** `PATCH /career/roadmaps/{slug}` `{status:"PUBLISHED"}` — makes it listed/enrollable. */
    const publishRoadmap = async (slug: string) => {
        if (busy) return
        setPendingRoadmap(slug)
        const published = await runRest(
            () => patchRoadmap.trigger({ slug, request: { status: "PUBLISHED" } }),
            { successMessage: t("career.admin.roadmapPublished") },
        )
        setPendingRoadmap(null)
        if (published) {
            setCreatedRoadmaps((current) => current.filter((entry) => entry.slug !== slug))
            onChanged()
        }
    }

    /** `POST /career/opportunities` — lands as DRAFT, so refresh the draft list. */
    const submitOpportunity = async () => {
        const title = opportunityTitle.trim()
        const description = opportunityDescription.trim()
        if (busy || !opportunityType || title.length === 0 || description.length === 0) return
        const created = await runRest(
            () =>
                createOpportunity.trigger({
                    type: opportunityType,
                    title,
                    description,
                }),
            { successMessage: t("career.admin.opportunityCreated") },
        )
        if (created) {
            setOpportunityTitle("")
            setOpportunityDescription("")
            void draftsSwr.mutate()
        }
    }

    /** `PATCH /career/opportunities/{id}` `{status:"OPEN"}` — makes it visible + appliable. */
    const publishOpportunity = async (id: string) => {
        if (busy) return
        setPendingOpportunity(id)
        const published = await runRest(
            () => patchOpportunity.trigger({ id, request: { status: "OPEN" } }),
            { successMessage: t("career.admin.opportunityPublished") },
        )
        setPendingOpportunity(null)
        if (published) {
            void draftsSwr.mutate()
            onChanged()
        }
    }

    // Nothing to author -> no panel at all (never a disabled shell that only 403s).
    if (!canManageCareer && !canManageOpportunity) {
        return null
    }

    return (
        <section className="flex flex-col gap-4 rounded-3xl border border-separator p-4">
            <div className="flex items-center gap-2">
                <ShieldCheckIcon
                    aria-hidden
                    focusable="false"
                    className="size-5 shrink-0 text-muted"
                />
                <div className="min-w-0">
                    <Typography type="body" weight="semibold">
                        {t("career.admin.title")}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                        {t("career.admin.hint")}
                    </Typography>
                </div>
            </div>

            {canManageCareer ? (
                <div className="flex flex-col gap-2 border-t border-separator pt-4">
                    <Typography type="body-sm" weight="semibold">
                        {t("career.admin.skillTitle")}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                        {t("career.admin.skillMapHint")}
                    </Typography>
                    <TextField className="w-full" aria-label={t("career.admin.slugLabel")}>
                        <Input
                            variant="secondary"
                            value={skillSlug}
                            onChange={(event) => setSkillSlug(event.target.value)}
                            placeholder={t("career.admin.slugLabel")}
                            aria-label={t("career.admin.slugLabel")}
                            disabled={busy}
                        />
                    </TextField>
                    <TextField className="w-full" aria-label={t("career.admin.skillNameLabel")}>
                        <Input
                            variant="secondary"
                            value={skillName}
                            onChange={(event) => setSkillName(event.target.value)}
                            placeholder={t("career.admin.skillNameLabel")}
                            aria-label={t("career.admin.skillNameLabel")}
                            disabled={busy}
                        />
                    </TextField>
                    <Typography type="body-xs" color="muted">
                        {t("career.admin.categoryLabel")}
                    </Typography>
                    <TokenPicker
                        tokens={SKILL_CATEGORIES}
                        value={skillCategory}
                        label={categoryLabel}
                        onSelect={setSkillCategory}
                        isDisabled={busy}
                    />
                    <Typography type="body-xs" color="muted">
                        {t("career.admin.levelsHint")}
                    </Typography>
                    <TextField variant="secondary" className="w-full">
                        <TextArea
                            rows={4}
                            value={skillLevelsText}
                            onChange={(event) => setSkillLevelsText(event.target.value)}
                            placeholder={t("career.admin.levelsPlaceholder")}
                            aria-label={t("career.admin.levelsLabel")}
                            className="resize-y"
                            disabled={busy}
                        />
                    </TextField>
                    <div className="flex flex-wrap items-center gap-2">
                        <Typography type="body-xs" color="muted" className="flex-1">
                            {t("career.admin.levelsParsed", { count: parsedLevels.length })}
                        </Typography>
                        <Button
                            size="sm"
                            variant="primary"
                            isPending={createSkill.isMutating}
                            isDisabled={
                                busy ||
                                skillSlug.trim().length === 0 ||
                                skillName.trim().length === 0 ||
                                !skillCategory ||
                                parsedLevels.length === 0
                            }
                            onPress={() => void submitSkill()}
                        >
                            <PlusIcon aria-hidden focusable="false" className="size-4" />
                            {t("career.admin.createSkill")}
                        </Button>
                    </div>
                </div>
            ) : null}

            {/* Mounted only for `career.manage` — the gate is this branch, not a second
              * check inside the mapper (which would 403-read for everyone else). */}
            {canManageCareer ? <SkillSubjectMapper onChanged={onChanged} /> : null}

            {canManageCareer ? (
                <div className="flex flex-col gap-2 border-t border-separator pt-4">
                    <Typography type="body-sm" weight="semibold">
                        {t("career.admin.roadmapTitle")}
                    </Typography>
                    <TextField className="w-full" aria-label={t("career.admin.slugLabel")}>
                        <Input
                            variant="secondary"
                            value={roadmapSlug}
                            onChange={(event) => setRoadmapSlug(event.target.value)}
                            placeholder={t("career.admin.slugLabel")}
                            aria-label={t("career.admin.slugLabel")}
                            disabled={busy}
                        />
                    </TextField>
                    <TextField className="w-full" aria-label={t("career.admin.roadmapTitleLabel")}>
                        <Input
                            variant="secondary"
                            value={roadmapTitle}
                            onChange={(event) => setRoadmapTitle(event.target.value)}
                            placeholder={t("career.admin.roadmapTitleLabel")}
                            aria-label={t("career.admin.roadmapTitleLabel")}
                            disabled={busy}
                        />
                    </TextField>
                    <Typography type="body-xs" color="muted">
                        {t("career.admin.trackLabel")}
                    </Typography>
                    <TokenPicker
                        tokens={ROADMAP_TRACKS}
                        value={roadmapTrack}
                        label={trackLabel}
                        onSelect={(token) =>
                            setRoadmapTrack((current) => (current === token ? null : token))
                        }
                        isDisabled={busy}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                        <Typography type="body-xs" color="muted" className="flex-1">
                            {t("career.admin.roadmapDraftHint")}
                        </Typography>
                        <Button
                            size="sm"
                            variant="primary"
                            isPending={createRoadmap.isMutating}
                            isDisabled={
                                busy ||
                                roadmapSlug.trim().length === 0 ||
                                roadmapTitle.trim().length === 0
                            }
                            onPress={() => void submitRoadmap()}
                        >
                            <PlusIcon aria-hidden focusable="false" className="size-4" />
                            {t("career.admin.createRoadmap")}
                        </Button>
                    </div>
                    {createdRoadmaps.map((draft) => (
                        <div
                            key={draft.slug}
                            className="flex flex-wrap items-center gap-2 rounded-2xl border border-separator p-3"
                        >
                            <div className="min-w-0 flex-1">
                                <Typography type="body-sm" weight="medium" truncate>
                                    {draft.title}
                                </Typography>
                                <Typography type="body-xs" color="muted" className="truncate">
                                    {t("career.admin.draftBadge")}
                                </Typography>
                            </div>
                            <Button
                                size="sm"
                                variant="secondary"
                                isPending={pendingRoadmap === draft.slug}
                                isDisabled={busy}
                                onPress={() => void publishRoadmap(draft.slug)}
                            >
                                {t("career.admin.publish")}
                            </Button>
                        </div>
                    ))}
                </div>
            ) : null}

            {canManageOpportunity ? (
                <div className="flex flex-col gap-2 border-t border-separator pt-4">
                    <Typography type="body-sm" weight="semibold">
                        {t("career.admin.opportunityTitle")}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                        {t("career.admin.opportunityFieldsHint")}
                    </Typography>
                    <TokenPicker
                        tokens={OPPORTUNITY_TYPES}
                        value={opportunityType}
                        label={typeLabelOf}
                        onSelect={setOpportunityType}
                        isDisabled={busy}
                    />
                    <TextField
                        className="w-full"
                        aria-label={t("career.admin.opportunityTitleLabel")}
                    >
                        <Input
                            variant="secondary"
                            value={opportunityTitle}
                            onChange={(event) => setOpportunityTitle(event.target.value)}
                            placeholder={t("career.admin.opportunityTitleLabel")}
                            aria-label={t("career.admin.opportunityTitleLabel")}
                            disabled={busy}
                        />
                    </TextField>
                    <TextField variant="secondary" className="w-full">
                        <TextArea
                            rows={4}
                            value={opportunityDescription}
                            onChange={(event) => setOpportunityDescription(event.target.value)}
                            placeholder={t("career.admin.opportunityDescriptionLabel")}
                            aria-label={t("career.admin.opportunityDescriptionLabel")}
                            className="resize-y"
                            disabled={busy}
                        />
                    </TextField>
                    <div className="flex flex-wrap items-center gap-2">
                        <Typography type="body-xs" color="muted" className="flex-1">
                            {t("career.admin.opportunityDraftHint")}
                        </Typography>
                        <Button
                            size="sm"
                            variant="primary"
                            isPending={createOpportunity.isMutating}
                            isDisabled={
                                busy ||
                                !opportunityType ||
                                opportunityTitle.trim().length === 0 ||
                                opportunityDescription.trim().length === 0
                            }
                            onPress={() => void submitOpportunity()}
                        >
                            <PlusIcon aria-hidden focusable="false" className="size-4" />
                            {t("career.admin.createOpportunity")}
                        </Button>
                    </div>

                    <Typography type="body-xs" color="muted">
                        {t("career.admin.draftsTitle")}
                    </Typography>
                    {draftsSwr.error ? (
                        <Typography type="body-xs" color="muted">
                            {t("career.admin.draftsError")}
                        </Typography>
                    ) : draftsSwr.drafts.length === 0 ? (
                        <Typography type="body-xs" color="muted">
                            {t("career.admin.draftsEmpty")}
                        </Typography>
                    ) : (
                        draftsSwr.drafts.map((draft) => (
                            <div
                                key={draft.id}
                                className="flex flex-wrap items-center gap-2 rounded-2xl border border-separator p-3"
                            >
                                <div className="min-w-0 flex-1">
                                    <Typography type="body-sm" weight="medium" truncate>
                                        {draft.title}
                                    </Typography>
                                    <Typography type="body-xs" color="muted" className="truncate">
                                        {typeLabelOf(draft.type)}
                                    </Typography>
                                </div>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    isPending={pendingOpportunity === draft.id}
                                    isDisabled={busy}
                                    onPress={() => void publishOpportunity(draft.id)}
                                >
                                    {t("career.admin.publish")}
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            ) : null}
        </section>
    )
}
