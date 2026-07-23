"use client"

import React from "react"
import { Reorder, useDragControls } from "framer-motion"
import { Button } from "@heroui/react"
import { useTranslations } from "next-intl"
import {
    CaretDownIcon,
    CaretUpIcon,
    DotsSixVerticalIcon,
    PlusIcon,
    TrashIcon,
} from "@phosphor-icons/react"
import { InlineText, InlineTextArea } from "./InlineField"
import {
    accentColor,
    CV_INK,
    CV_INK_CONTACT,
    CV_INK_META,
    CV_INK_SUB,
    cssFontStack,
    densityScale,
    type CvDesign,
    type CvSectionKey,
} from "./layout"
import type { ArraySectionKey, CvDraft } from "./useCvDraft"

/** Live typography tokens derived from the density + accent + font design knobs. */
interface Tokens {
    accent: string
    fontFamily: string
    lineHeight: number
    /** Font size in px for a base size, scaled by density. */
    sz: (base: number) => string
    /** Spacing in px for a base gap, scaled by density. */
    sp: (base: number) => number
}

const buildTokens = (design: CvDesign): Tokens => {
    const scale = densityScale(design.density)
    return {
        accent: accentColor(design.accent) ?? CV_INK,
        fontFamily: cssFontStack(design.font),
        lineHeight: scale.lineHeight,
        sz: (base) => `${(base * scale.fontScale).toFixed(2)}px`,
        sp: (base) => Math.round(base * scale.gap),
    }
}

/** Id of the header-required error message, linked from the invalid name/email fields. */
export const CV_HEADER_ERROR_ID = "cv-header-required-msg"

const hasText = (value: string | undefined): boolean => !!value && value.trim().length > 0

// ---- small building blocks ----

/** A section heading with the accent-tinted rule (matches the PDF heading). */
const Heading = ({ label, tk }: { label: string; tk: Tokens }) => (
    <div
        role="heading"
        aria-level={3}
        style={{
            fontSize: tk.sz(11.5),
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: CV_INK,
            marginTop: tk.sp(16),
            marginBottom: tk.sp(5),
            paddingBottom: 2,
            borderBottom: `1px solid ${tk.accent}`,
        }}
    >
        {label}
    </div>
)

/** A per-line editable list (bullets / highlights / tech / skill items). */
const LineList = ({
    lines,
    onChange,
    tk,
    itemAria,
    addLabel,
    removeLabel,
    placeholder,
}: {
    lines: string[]
    onChange: (next: string[]) => void
    tk: Tokens
    itemAria: string
    addLabel: string
    removeLabel: string
    placeholder: string
}) => {
    const setLine = (index: number, value: string) =>
        onChange(lines.map((line, i) => (i === index ? value : line)))
    const removeLine = (index: number) => onChange(lines.filter((_, i) => i !== index))
    const addLine = () => onChange([...lines, ""])

    return (
        <div className="flex flex-col" style={{ marginTop: tk.sp(2) }}>
            {lines.map((line, index) => (
                <div key={index} className="group/line flex items-start" style={{ paddingLeft: tk.sp(8) }}>
                    <span aria-hidden className="shrink-0 select-none" style={{ width: tk.sp(10), fontSize: tk.sz(11) }}>
                        •
                    </span>
                    <InlineTextArea
                        value={line}
                        onChange={(value) => setLine(index, value)}
                        ariaLabel={`${itemAria} ${index + 1}`}
                        placeholder={placeholder}
                        style={{ fontSize: tk.sz(11) }}
                    />
                    <Button
                        isIconOnly
                        size="sm"
                        variant="tertiary"
                        aria-label={removeLabel}
                        className="ml-2 shrink-0 opacity-0 transition-opacity focus:opacity-100 group-hover/line:opacity-100"
                        onPress={() => removeLine(index)}
                    >
                        <TrashIcon aria-hidden focusable="false" className="size-4" />
                    </Button>
                </div>
            ))}
            <Button
                size="sm"
                variant="tertiary"
                className="mt-0.5 self-start px-1 text-black/50"
                style={{ marginLeft: tk.sp(8) }}
                onPress={addLine}
            >
                <PlusIcon aria-hidden focusable="false" className="size-4" />
                {addLabel}
            </Button>
        </div>
    )
}

/**
 * Wraps one repeater entry with screen-only chrome: a drag handle (pointer
 * reorder via framer `Reorder`), keyboard move up/down, and remove. None of this
 * chrome is in the exported PDF — the PDF is rendered from the CV data, not the
 * DOM.
 *
 * The action cluster lives in NORMAL FLOW as a `shrink-0` column to the right of
 * the content (it reserves its width even while opacity-0), NOT absolutely
 * positioned over the entry — an overlay would sit on top of the entry's own
 * top-right fields (end date / link / year) and a mis-aimed click could hit the
 * remove button and delete the whole entry.
 */
const EntryFrame = ({
    value,
    index,
    count,
    onMove,
    onRemove,
    dragLabel,
    moveUpLabel,
    moveDownLabel,
    removeLabel,
    children,
}: {
    value: object
    index: number
    count: number
    onMove: (dir: -1 | 1) => void
    onRemove: () => void
    dragLabel: string
    moveUpLabel: string
    moveDownLabel: string
    removeLabel: string
    children: React.ReactNode
}) => {
    const controls = useDragControls()
    return (
        <Reorder.Item
            as="div"
            value={value}
            dragListener={false}
            dragControls={controls}
            className="group/entry flex items-start gap-2 rounded-md"
        >
            <button
                type="button"
                tabIndex={-1}
                aria-label={dragLabel}
                onPointerDown={(event) => controls.start(event)}
                className="mt-0.5 shrink-0 cursor-grab touch-none rounded-sm text-black/30 opacity-0 transition-opacity active:cursor-grabbing group-hover/entry:opacity-100"
            >
                <DotsSixVerticalIcon aria-hidden focusable="false" className="size-4" />
            </button>
            <div className="min-w-0 flex-1">{children}</div>
            <div className="flex shrink-0 items-center opacity-0 transition-opacity focus-within:opacity-100 group-hover/entry:opacity-100">
                <Button
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    aria-label={moveUpLabel}
                    isDisabled={index === 0}
                    onPress={() => onMove(-1)}
                >
                    <CaretUpIcon aria-hidden focusable="false" className="size-4" />
                </Button>
                <Button
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    aria-label={moveDownLabel}
                    isDisabled={index === count - 1}
                    onPress={() => onMove(1)}
                >
                    <CaretDownIcon aria-hidden focusable="false" className="size-4" />
                </Button>
                <Button
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    aria-label={removeLabel}
                    onPress={onRemove}
                >
                    <TrashIcon aria-hidden focusable="false" className="size-4" />
                </Button>
            </div>
        </Reorder.Item>
    )
}

export interface A4PageProps {
    draft: CvDraft
    visibleKeys: CvSectionKey[]
    design: CvDesign
}

/**
 * The white A4 surface the user edits IN PLACE. Renders the always-first header
 * (name + contact + links) then the ordered, visible sections — each field is a
 * flat inline editor ({@link InlineText}/{@link InlineTextArea}) so the page on
 * screen mirrors the exported PDF. Section order, visibility and design come from
 * the shared `layout.ts` helpers so preview and PDF stay in parity.
 */
export const A4Page = ({ draft, visibleKeys, design }: A4PageProps) => {
    const t = useTranslations("aiPlatform.toolPages.cvReview")
    const tk = buildTokens(design)
    const d = draft.draft

    const hasError = (field: "fullName" | "email") => draft.errors.includes(field)

    // A generic repeater: framer Reorder over the entries + keyboard move + remove.
    const repeater = (
        key: ArraySectionKey,
        addLabel: string,
        renderEntry: (item: Record<string, unknown>, index: number) => React.ReactNode,
    ) => {
        const list = d[key] as unknown as Array<Record<string, unknown>>
        return (
            <Reorder.Group
                as="div"
                axis="y"
                values={list}
                onReorder={(next) => draft.reorderEntries(key, next)}
                className="flex flex-col"
                style={{ gap: tk.sp(4) }}
            >
                {list.map((item, index) => (
                    <EntryFrame
                        key={String(item._id)}
                        value={item}
                        index={index}
                        count={list.length}
                        onMove={(dir) => draft.moveEntry(key, index, dir)}
                        onRemove={() => draft.removeEntry(key, index)}
                        dragLabel={t("inline.dragEntry", { section: t(`sections.${key}`), index: index + 1 })}
                        moveUpLabel={t("inline.moveEntryUp", { section: t(`sections.${key}`), index: index + 1 })}
                        moveDownLabel={t("inline.moveEntryDown", { section: t(`sections.${key}`), index: index + 1 })}
                        removeLabel={t("inline.removeEntry", { section: t(`sections.${key}`), index: index + 1 })}
                    >
                        {renderEntry(item, index)}
                    </EntryFrame>
                ))}
                <Button
                    size="sm"
                    variant="tertiary"
                    className="self-start px-1 text-black/50"
                    onPress={() => draft.addEntry(key)}
                >
                    <PlusIcon aria-hidden focusable="false" className="size-4" />
                    {addLabel}
                </Button>
            </Reorder.Group>
        )
    }

    const itemTitleStyle: React.CSSProperties = { fontSize: tk.sz(11), fontWeight: 700 }
    const itemSubStyle: React.CSSProperties = { fontSize: tk.sz(11), fontStyle: "italic", color: CV_INK_SUB }
    const metaStyle: React.CSSProperties = { fontSize: tk.sz(10), color: CV_INK_META }

    const renderSection = (key: CvSectionKey): React.ReactNode => {
        switch (key) {
        case "summary":
            return (
                <section key={key} aria-label={t(`sections.${key}`)}>
                    <Heading label={t("sections.summary")} tk={tk} />
                    <InlineTextArea
                        value={d.summary}
                        onChange={draft.setSummary}
                        ariaLabel={t("sections.summary")}
                        placeholder={t("fields.summaryPlaceholder")}
                        style={{ fontSize: tk.sz(11) }}
                    />
                </section>
            )
        case "education":
            return (
                <section key={key} aria-label={t(`sections.${key}`)}>
                    <Heading label={t("sections.education")} tk={tk} />
                    {repeater("education", t("actions.addEducation"), (item, index) => (
                        <>
                            <div className="flex items-baseline justify-between gap-2">
                                <InlineText
                                    value={String(item.school ?? "")}
                                    onChange={(v) => draft.updateEntry("education", index, { school: v })}
                                    ariaLabel={`${t("fields.school")} ${index + 1}`}
                                    placeholder={t("fields.school")}
                                    style={itemTitleStyle}
                                />
                                <div className="flex shrink-0 items-baseline gap-1" style={metaStyle}>
                                    <InlineText
                                        value={String(item.start ?? "")}
                                        onChange={(v) => draft.updateEntry("education", index, { start: v })}
                                        ariaLabel={`${t("fields.start")} ${index + 1}`}
                                        placeholder={t("fields.start")}
                                        align="center"
                                        className="w-16"
                                        style={metaStyle}
                                    />
                                    <span aria-hidden>–</span>
                                    <InlineText
                                        value={String(item.end ?? "")}
                                        onChange={(v) => draft.updateEntry("education", index, { end: v })}
                                        ariaLabel={`${t("fields.end")} ${index + 1}`}
                                        placeholder={t("fields.end")}
                                        align="center"
                                        className="w-16"
                                        style={metaStyle}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap items-baseline gap-x-1" style={itemSubStyle}>
                                <InlineText
                                    value={String(item.degree ?? "")}
                                    onChange={(v) => draft.updateEntry("education", index, { degree: v })}
                                    ariaLabel={`${t("fields.degree")} ${index + 1}`}
                                    placeholder={t("fields.degree")}
                                    className="w-auto flex-1"
                                    style={itemSubStyle}
                                />
                                <InlineText
                                    value={String(item.major ?? "")}
                                    onChange={(v) => draft.updateEntry("education", index, { major: v })}
                                    ariaLabel={`${t("fields.major")} ${index + 1}`}
                                    placeholder={t("fields.major")}
                                    className="w-auto flex-1"
                                    style={itemSubStyle}
                                />
                                <InlineText
                                    value={String(item.gpa ?? "")}
                                    onChange={(v) => draft.updateEntry("education", index, { gpa: v })}
                                    ariaLabel={`${t("fields.gpa")} ${index + 1}`}
                                    placeholder={t("fields.gpa")}
                                    className="w-20"
                                    style={itemSubStyle}
                                />
                            </div>
                            <LineList
                                lines={(item.highlights as string[]) ?? []}
                                onChange={(next) => draft.updateEntry("education", index, { highlights: next })}
                                tk={tk}
                                itemAria={t("fields.highlights")}
                                addLabel={t("inline.addBullet")}
                                removeLabel={t("inline.removeBullet")}
                                placeholder={t("fields.highlights")}
                            />
                        </>
                    ))}
                </section>
            )
        case "experience":
            return (
                <section key={key} aria-label={t(`sections.${key}`)}>
                    <Heading label={t("sections.experience")} tk={tk} />
                    {repeater("experience", t("actions.addExperience"), (item, index) => (
                        <>
                            <div className="flex items-baseline justify-between gap-2">
                                <div className="flex flex-1 flex-wrap items-baseline gap-x-1" style={itemTitleStyle}>
                                    <InlineText
                                        value={String(item.title ?? "")}
                                        onChange={(v) => draft.updateEntry("experience", index, { title: v })}
                                        ariaLabel={`${t("fields.jobTitle")} ${index + 1}`}
                                        placeholder={t("fields.jobTitle")}
                                        className="w-auto flex-1"
                                        style={itemTitleStyle}
                                    />
                                    <InlineText
                                        value={String(item.company ?? "")}
                                        onChange={(v) => draft.updateEntry("experience", index, { company: v })}
                                        ariaLabel={`${t("fields.company")} ${index + 1}`}
                                        placeholder={t("fields.company")}
                                        className="w-auto flex-1"
                                        style={itemTitleStyle}
                                    />
                                </div>
                                <div className="flex shrink-0 items-baseline gap-1" style={metaStyle}>
                                    <InlineText
                                        value={String(item.start ?? "")}
                                        onChange={(v) => draft.updateEntry("experience", index, { start: v })}
                                        ariaLabel={`${t("fields.start")} ${index + 1}`}
                                        placeholder={t("fields.start")}
                                        align="center"
                                        className="w-16"
                                        style={metaStyle}
                                    />
                                    <span aria-hidden>–</span>
                                    <InlineText
                                        value={String(item.end ?? "")}
                                        onChange={(v) => draft.updateEntry("experience", index, { end: v })}
                                        ariaLabel={`${t("fields.end")} ${index + 1}`}
                                        placeholder={t("fields.end")}
                                        align="center"
                                        className="w-16"
                                        style={metaStyle}
                                    />
                                </div>
                            </div>
                            <LineList
                                lines={(item.bullets as string[]) ?? []}
                                onChange={(next) => draft.updateEntry("experience", index, { bullets: next })}
                                tk={tk}
                                itemAria={t("fields.bullets")}
                                addLabel={t("inline.addBullet")}
                                removeLabel={t("inline.removeBullet")}
                                placeholder={t("fields.bullets")}
                            />
                        </>
                    ))}
                </section>
            )
        case "projects":
            return (
                <section key={key} aria-label={t(`sections.${key}`)}>
                    <Heading label={t("sections.projects")} tk={tk} />
                    {repeater("projects", t("actions.addProject"), (item, index) => (
                        <>
                            <div className="flex items-baseline justify-between gap-2">
                                <div className="flex flex-1 flex-wrap items-baseline gap-x-1" style={itemTitleStyle}>
                                    <InlineText
                                        value={String(item.name ?? "")}
                                        onChange={(v) => draft.updateEntry("projects", index, { name: v })}
                                        ariaLabel={`${t("fields.projectName")} ${index + 1}`}
                                        placeholder={t("fields.projectName")}
                                        className="w-auto flex-1"
                                        style={itemTitleStyle}
                                    />
                                    <InlineText
                                        value={String(item.role ?? "")}
                                        onChange={(v) => draft.updateEntry("projects", index, { role: v })}
                                        ariaLabel={`${t("fields.role")} ${index + 1}`}
                                        placeholder={t("fields.role")}
                                        className="w-auto flex-1"
                                        style={itemTitleStyle}
                                    />
                                </div>
                                <InlineText
                                    value={String(item.link ?? "")}
                                    onChange={(v) => draft.updateEntry("projects", index, { link: v })}
                                    ariaLabel={`${t("fields.link")} ${index + 1}`}
                                    placeholder={t("fields.link")}
                                    className="w-40 shrink-0"
                                    style={metaStyle}
                                />
                            </div>
                            <LineList
                                lines={(item.tech as string[]) ?? []}
                                onChange={(next) => draft.updateEntry("projects", index, { tech: next })}
                                tk={tk}
                                itemAria={t("fields.tech")}
                                addLabel={t("inline.addTech")}
                                removeLabel={t("inline.removeBullet")}
                                placeholder={t("fields.tech")}
                            />
                            <LineList
                                lines={(item.bullets as string[]) ?? []}
                                onChange={(next) => draft.updateEntry("projects", index, { bullets: next })}
                                tk={tk}
                                itemAria={t("fields.bullets")}
                                addLabel={t("inline.addBullet")}
                                removeLabel={t("inline.removeBullet")}
                                placeholder={t("fields.bullets")}
                            />
                        </>
                    ))}
                </section>
            )
        case "skills":
            return (
                <section key={key} aria-label={t(`sections.${key}`)}>
                    <Heading label={t("sections.skills")} tk={tk} />
                    {repeater("skills", t("actions.addSkill"), (item, index) => (
                        <>
                            <InlineText
                                value={String(item.group ?? "")}
                                onChange={(v) => draft.updateEntry("skills", index, { group: v })}
                                ariaLabel={`${t("fields.skillGroup")} ${index + 1}`}
                                placeholder={t("fields.skillGroup")}
                                style={itemTitleStyle}
                            />
                            <LineList
                                lines={(item.items as string[]) ?? []}
                                onChange={(next) => draft.updateEntry("skills", index, { items: next })}
                                tk={tk}
                                itemAria={t("fields.skillItems")}
                                addLabel={t("inline.addSkill")}
                                removeLabel={t("inline.removeBullet")}
                                placeholder={t("fields.skillItems")}
                            />
                        </>
                    ))}
                </section>
            )
        case "awards":
            return (
                <section key={key} aria-label={t(`sections.${key}`)}>
                    <Heading label={t("sections.awards")} tk={tk} />
                    {repeater("awards", t("actions.addAward"), (item, index) => (
                        <div className="flex flex-wrap items-baseline gap-x-1" style={{ paddingLeft: tk.sp(8) }}>
                            <span aria-hidden className="shrink-0 select-none" style={{ width: tk.sp(10), fontSize: tk.sz(11) }}>
                                    •
                            </span>
                            <InlineText
                                value={String(item.name ?? "")}
                                onChange={(v) => draft.updateEntry("awards", index, { name: v })}
                                ariaLabel={`${t("fields.awardName")} ${index + 1}`}
                                placeholder={t("fields.awardName")}
                                className="w-auto flex-1"
                                style={{ fontSize: tk.sz(11) }}
                            />
                            <InlineText
                                value={String(item.by ?? "")}
                                onChange={(v) => draft.updateEntry("awards", index, { by: v })}
                                ariaLabel={`${t("fields.awardBy")} ${index + 1}`}
                                placeholder={t("fields.awardBy")}
                                className="w-auto flex-1"
                                style={{ fontSize: tk.sz(11) }}
                            />
                            <InlineText
                                value={String(item.year ?? "")}
                                onChange={(v) => draft.updateEntry("awards", index, { year: v })}
                                ariaLabel={`${t("fields.awardYear")} ${index + 1}`}
                                placeholder={t("fields.awardYear")}
                                className="w-20"
                                style={{ fontSize: tk.sz(11) }}
                            />
                        </div>
                    ))}
                </section>
            )
        default:
            return null
        }
    }

    return (
        <div className="w-full overflow-x-auto">
            <div
                className="mx-auto w-[210mm] max-w-full bg-white text-[#1a1a1a] shadow-lg"
                style={{
                    minHeight: "297mm",
                    paddingTop: "40px",
                    paddingBottom: "40px",
                    paddingLeft: "48px",
                    paddingRight: "48px",
                    fontFamily: tk.fontFamily,
                    lineHeight: tk.lineHeight,
                    fontSize: tk.sz(11),
                }}
            >
                {/* Header — always first, never reorderable / hideable. */}
                <InlineText
                    value={d.header.fullName}
                    onChange={(v) => draft.patchHeader({ fullName: v })}
                    ariaLabel={t("fields.fullName")}
                    placeholder={t("fields.fullName")}
                    invalid={hasError("fullName")}
                    describedBy={CV_HEADER_ERROR_ID}
                    align="center"
                    style={{ fontSize: tk.sz(21), fontWeight: 700, color: tk.accent, textAlign: "center" }}
                />
                <div className="mx-auto flex max-w-full flex-wrap items-baseline justify-center gap-x-1" style={{ fontSize: tk.sz(9), color: CV_INK_CONTACT }}>
                    <InlineText
                        value={d.header.email}
                        onChange={(v) => draft.patchHeader({ email: v })}
                        ariaLabel={t("fields.email")}
                        placeholder={t("fields.email")}
                        invalid={hasError("email")}
                        describedBy={CV_HEADER_ERROR_ID}
                        type="email"
                        align="center"
                        className="w-48"
                        style={{ fontSize: tk.sz(9), color: CV_INK_CONTACT }}
                    />
                    {/* Separators mirror the PDF: shown only between two present fields. */}
                    {hasText(d.header.email) && hasText(d.header.phone) ? <span aria-hidden>·</span> : null}
                    <InlineText
                        value={d.header.phone}
                        onChange={(v) => draft.patchHeader({ phone: v })}
                        ariaLabel={t("fields.phone")}
                        placeholder={t("fields.phone")}
                        align="center"
                        className="w-36"
                        style={{ fontSize: tk.sz(9), color: CV_INK_CONTACT }}
                    />
                    {hasText(d.header.location) && (hasText(d.header.email) || hasText(d.header.phone)) ? (
                        <span aria-hidden>·</span>
                    ) : null}
                    <InlineText
                        value={d.header.location}
                        onChange={(v) => draft.patchHeader({ location: v })}
                        ariaLabel={t("fields.location")}
                        placeholder={t("fields.location")}
                        align="center"
                        className="w-40"
                        style={{ fontSize: tk.sz(9), color: CV_INK_CONTACT }}
                    />
                </div>
                {/* Header links */}
                <div className="mt-0.5 flex flex-col items-center" style={{ fontSize: tk.sz(9), color: CV_INK_CONTACT }}>
                    {d.header.links.map((link, index) => (
                        <div key={link._id} className="group/link flex items-baseline gap-1">
                            <InlineText
                                value={link.label ?? ""}
                                onChange={(v) => draft.updateLink(index, { label: v })}
                                ariaLabel={`${t("fields.linkLabel")} ${index + 1}`}
                                placeholder={t("fields.linkLabel")}
                                align="center"
                                className="w-24"
                                style={{ fontSize: tk.sz(9), color: CV_INK_CONTACT }}
                            />
                            <span aria-hidden>:</span>
                            <InlineText
                                value={link.url ?? ""}
                                onChange={(v) => draft.updateLink(index, { url: v })}
                                ariaLabel={`${t("fields.linkUrl")} ${index + 1}`}
                                placeholder={t("fields.linkUrl")}
                                align="center"
                                className="w-48"
                                style={{ fontSize: tk.sz(9), color: CV_INK_CONTACT }}
                            />
                            <Button
                                isIconOnly
                                size="sm"
                                variant="tertiary"
                                aria-label={`${t("actions.remove")} ${index + 1}`}
                                className="opacity-0 transition-opacity focus:opacity-100 group-hover/link:opacity-100"
                                onPress={() => draft.removeLink(index)}
                            >
                                <TrashIcon aria-hidden focusable="false" className="size-4" />
                            </Button>
                        </div>
                    ))}
                    <Button
                        size="sm"
                        variant="tertiary"
                        className="mt-0.5 px-1 text-black/50"
                        onPress={draft.addLink}
                    >
                        <PlusIcon aria-hidden focusable="false" className="size-4" />
                        {t("actions.addLink")}
                    </Button>
                </div>

                {visibleKeys.map((key) => renderSection(key))}
            </div>
        </div>
    )
}
