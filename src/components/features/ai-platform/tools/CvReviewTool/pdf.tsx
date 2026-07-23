"use client"

import React from "react"
import {
    Document,
    Font,
    Page,
    StyleSheet,
    Text,
    View,
    pdf,
} from "@react-pdf/renderer"
import type { CvProfileView, CvSections } from "@/modules/api/rest/career"
import {
    accentColor,
    CV_INK,
    CV_INK_CONTACT,
    CV_INK_META,
    CV_INK_SUB,
    densityScale,
    orderedVisibleKeys,
    type CvDesign,
    type CvLayout,
    type CvSectionKey,
} from "./CvLiveEditor/layout"

/**
 * Client-side Harvard PDF export (spec: "export ... entirely client-side using
 * @react-pdf/renderer ... downloaded as a blob without any BE render endpoint").
 *
 * This module is only ever reached through a dynamic `import()` from the export
 * click handler, so the (heavy) renderer is code-split out of the page bundle and
 * never runs on the server.
 *
 * ★ Parity: the section ORDER + HIDDEN set + DESIGN options come from the SAME
 * `layout.ts` helpers the on-screen A4 preview uses ({@link orderedVisibleKeys},
 * {@link densityScale}, {@link accentColor}), so the exported PDF matches the
 * screen exactly — same order, same visibility, same density / accent / font.
 *
 * Fonts: the built-in Helvetica/Times have poor Vietnamese diacritic coverage, so
 * we register Roboto (sans) and Roboto Slab (serif) — both full Vietnamese — and
 * fall back through Roboto → Helvetica if a font fetch is unavailable, so the
 * export never hard-fails on the font.
 */

const ROBOTO_REGULAR =
    "https://cdn.jsdelivr.net/gh/google/fonts/apache/roboto/static/Roboto-Regular.ttf"
const ROBOTO_BOLD =
    "https://cdn.jsdelivr.net/gh/google/fonts/apache/roboto/static/Roboto-Bold.ttf"
const ROBOTO_SLAB_REGULAR =
    "https://cdn.jsdelivr.net/gh/google/fonts/apache/robotoslab/static/RobotoSlab-Regular.ttf"
const ROBOTO_SLAB_BOLD =
    "https://cdn.jsdelivr.net/gh/google/fonts/apache/robotoslab/static/RobotoSlab-Bold.ttf"

let fontsRegistered = false

/** Register the Vietnamese-capable families once (fetch happens lazily at render). */
const ensureFonts = (): void => {
    if (fontsRegistered) return
    try {
        Font.register({
            family: "Roboto",
            fonts: [
                { src: ROBOTO_REGULAR, fontWeight: 400 },
                { src: ROBOTO_BOLD, fontWeight: 700 },
            ],
        })
    } catch {
        // ignore — the render falls back to a builtin family
    }
    try {
        Font.register({
            family: "Roboto Slab",
            fonts: [
                { src: ROBOTO_SLAB_REGULAR, fontWeight: 400 },
                { src: ROBOTO_SLAB_BOLD, fontWeight: 700 },
            ],
        })
    } catch {
        // ignore
    }
    try {
        // Harvard résumés wrap long tech/skill lines — disable hyphenation so words
        // are not broken mid-token.
        Font.registerHyphenationCallback((word) => [word])
    } catch {
        // ignore
    }
    fontsRegistered = true
}

const hasText = (value: string | undefined): value is string =>
    !!value && value.trim().length > 0

/** True if any of the given strings has content. */
const anyText = (...values: Array<string | undefined>): boolean => values.some(hasText)

/** True if a per-line list has any non-blank row. */
const anyLine = (lines: string[] | undefined): boolean => (lines ?? []).some(hasText)

/*
 * Entry-emptiness filters below use `anyText`/`anyLine` so an entry exports when
 * the user typed content into ANY field — not only the title field. The on-screen
 * A4 renders every draft entry, so filtering on title alone used to silently drop
 * entries the user could see (a bullets-only experience, a dates+GPA education
 * row, a tech-only project), breaking preview↔PDF parity.
 */

const joinParts = (parts: Array<string | undefined>): string =>
    parts.filter((part) => hasText(part)).join("  ·  ")

const joinDates = (start: string | undefined, end: string | undefined): string =>
    [start, end].filter(hasText).join(" – ")

/** Copy passed in from the caller so the PDF text follows the app locale. */
export interface CvPdfLabels {
    summary: string
    education: string
    experience: string
    projects: string
    skills: string
    awards: string
    untitled: string
}

/** Build the density/accent-aware stylesheet (mirrors the A4 preview tokens). */
const buildStyles = (design: CvDesign, fontFamily: string) => {
    const scale = densityScale(design.density)
    const accent = accentColor(design.accent) ?? CV_INK
    const s = (base: number) => base * scale.fontScale
    return StyleSheet.create({
        page: {
            paddingVertical: 40,
            paddingHorizontal: 48,
            fontSize: s(10),
            lineHeight: scale.lineHeight,
            color: CV_INK,
            fontFamily,
        },
        name: { fontSize: s(20), fontWeight: 700, textAlign: "center", marginBottom: 4, color: accent },
        contact: { fontSize: s(9), textAlign: "center", color: CV_INK_CONTACT },
        sectionHeading: {
            fontSize: s(11),
            fontWeight: 700,
            letterSpacing: 1,
            marginTop: 14 * scale.gap,
            marginBottom: 4,
            paddingBottom: 2,
            borderBottomWidth: 1,
            borderBottomColor: accent,
        },
        itemRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 * scale.gap },
        itemTitle: { fontSize: s(10), fontWeight: 700 },
        // No `fontStyle: "italic"`: the registered Roboto/Roboto Slab families have
        // only normal cuts, and @react-pdf's font resolver THROWS when asked for an
        // italic it can't find — aborting the whole render and silently dropping the
        // export to Helvetica (which loses Vietnamese glyphs and the font knob). The
        // sub-line is distinguished by colour instead.
        itemSub: { fontSize: s(10), color: CV_INK_SUB },
        itemDates: { fontSize: s(9), color: CV_INK_META },
        paragraph: { marginTop: 2 },
        bulletRow: { flexDirection: "row", marginTop: 1, paddingLeft: 8 },
        bulletDot: { width: 8 },
        bulletText: { flex: 1 },
        meta: { fontSize: s(9), color: CV_INK_META, marginTop: 1 },
    })
}

type Styles = ReturnType<typeof buildStyles>

const Bullet = ({ children, styles }: { children: string; styles: Styles }) => (
    <View style={styles.bulletRow}>
        <Text style={styles.bulletDot}>•</Text>
        <Text style={styles.bulletText}>{children}</Text>
    </View>
)

const SectionHeading = ({ label, styles }: { label: string; styles: Styles }) => (
    <Text style={styles.sectionHeading}>{label.toUpperCase()}</Text>
)

// ---- per-section renderers (return null when the section has no content) ----

const SummarySection = ({ sections, labels, styles }: SectionProps) =>
    hasText(sections.summary) ? (
        <View>
            <SectionHeading label={labels.summary} styles={styles} />
            <Text style={styles.paragraph}>{sections.summary}</Text>
        </View>
    ) : null

const EducationSection = ({ sections, labels, styles }: SectionProps) => {
    const education = (sections.education ?? []).filter(
        (item) =>
            anyText(item.school, item.degree, item.major, item.start, item.end, item.gpa) ||
            anyLine(item.highlights),
    )
    if (education.length === 0) return null
    return (
        <View>
            <SectionHeading label={labels.education} styles={styles} />
            {education.map((item, index) => (
                <View key={index} wrap={false}>
                    <View style={styles.itemRow}>
                        <Text style={styles.itemTitle}>{item.school}</Text>
                        <Text style={styles.itemDates}>{joinDates(item.start, item.end)}</Text>
                    </View>
                    {joinParts([item.degree, item.major, item.gpa ? `GPA ${item.gpa}` : undefined]) ? (
                        <Text style={styles.itemSub}>
                            {joinParts([item.degree, item.major, item.gpa ? `GPA ${item.gpa}` : undefined])}
                        </Text>
                    ) : null}
                    {(item.highlights ?? []).filter(hasText).map((line, i) => (
                        <Bullet key={i} styles={styles}>
                            {line}
                        </Bullet>
                    ))}
                </View>
            ))}
        </View>
    )
}

const ExperienceSection = ({ sections, labels, styles }: SectionProps) => {
    const experience = (sections.experience ?? []).filter(
        (item) => anyText(item.company, item.title, item.start, item.end) || anyLine(item.bullets),
    )
    if (experience.length === 0) return null
    return (
        <View>
            <SectionHeading label={labels.experience} styles={styles} />
            {experience.map((item, index) => (
                <View key={index} wrap={false}>
                    <View style={styles.itemRow}>
                        <Text style={styles.itemTitle}>{joinParts([item.title, item.company])}</Text>
                        <Text style={styles.itemDates}>{joinDates(item.start, item.end)}</Text>
                    </View>
                    {(item.bullets ?? []).filter(hasText).map((line, i) => (
                        <Bullet key={i} styles={styles}>
                            {line}
                        </Bullet>
                    ))}
                </View>
            ))}
        </View>
    )
}

const ProjectsSection = ({ sections, labels, styles }: SectionProps) => {
    const projects = (sections.projects ?? []).filter(
        (item) => anyText(item.name, item.role, item.link) || anyLine(item.tech) || anyLine(item.bullets),
    )
    if (projects.length === 0) return null
    return (
        <View>
            <SectionHeading label={labels.projects} styles={styles} />
            {projects.map((item, index) => (
                <View key={index} wrap={false}>
                    <View style={styles.itemRow}>
                        <Text style={styles.itemTitle}>{joinParts([item.name, item.role])}</Text>
                        {hasText(item.link) ? <Text style={styles.itemDates}>{item.link}</Text> : null}
                    </View>
                    {(item.tech ?? []).filter(hasText).length > 0 ? (
                        <Text style={styles.meta}>{(item.tech ?? []).filter(hasText).join(", ")}</Text>
                    ) : null}
                    {(item.bullets ?? []).filter(hasText).map((line, i) => (
                        <Bullet key={i} styles={styles}>
                            {line}
                        </Bullet>
                    ))}
                </View>
            ))}
        </View>
    )
}

const SkillsSection = ({ sections, labels, styles }: SectionProps) => {
    const skills = (sections.skills ?? []).filter(
        (group) => anyText(group.group) || anyLine(group.items),
    )
    if (skills.length === 0) return null
    return (
        <View>
            <SectionHeading label={labels.skills} styles={styles} />
            {skills.map((group, index) => (
                <Text key={index} style={styles.paragraph}>
                    {hasText(group.group) ? <Text style={styles.itemTitle}>{group.group}: </Text> : null}
                    {(group.items ?? []).filter(hasText).join(", ")}
                </Text>
            ))}
        </View>
    )
}

const AwardsSection = ({ sections, labels, styles }: SectionProps) => {
    const awards = (sections.awards ?? []).filter((item) => anyText(item.name, item.by, item.year))
    if (awards.length === 0) return null
    return (
        <View>
            <SectionHeading label={labels.awards} styles={styles} />
            {awards.map((item, index) => (
                <Bullet key={index} styles={styles}>
                    {joinParts([item.name, item.by, item.year])}
                </Bullet>
            ))}
        </View>
    )
}

interface SectionProps {
    sections: CvSections
    labels: CvPdfLabels
    styles: Styles
}

const SECTION_RENDERERS: Record<CvSectionKey, (props: SectionProps) => React.ReactElement | null> = {
    summary: SummarySection,
    education: EducationSection,
    experience: ExperienceSection,
    projects: ProjectsSection,
    skills: SkillsSection,
    awards: AwardsSection,
}

interface CvPdfDocumentProps {
    title: string
    sections: CvSections
    labels: CvPdfLabels
    layout: CvLayout
    design: CvDesign
    fontFamily: string
}

/** The Harvard single-column CV document, sections in the chosen order. */
const CvPdfDocument = ({ title, sections, labels, layout, design, fontFamily }: CvPdfDocumentProps) => {
    const styles = buildStyles(design, fontFamily)
    const header = sections.header ?? {}
    // Keep a link the user filled in either field (matches the A4, which shows both
    // the label and url inputs); a label-only link used to vanish from the export.
    const links = (header.links ?? []).filter((link) => anyText(link.url, link.label))
    const visibleKeys = orderedVisibleKeys(layout)

    return (
        <Document title={title || labels.untitled}>
            <Page size="A4" style={styles.page}>
                <Text style={styles.name}>
                    {hasText(header.fullName) ? header.fullName : title || labels.untitled}
                </Text>
                {joinParts([header.email, header.phone, header.location]) ? (
                    <Text style={styles.contact}>
                        {joinParts([header.email, header.phone, header.location])}
                    </Text>
                ) : null}
                {links.length > 0 ? (
                    <Text style={styles.contact}>
                        {links
                            .map((link) =>
                                hasText(link.label) && hasText(link.url)
                                    ? `${link.label}: ${link.url}`
                                    : (link.url || link.label),
                            )
                            .join("  ·  ")}
                    </Text>
                ) : null}

                {visibleKeys.map((key) => {
                    const Renderer = SECTION_RENDERERS[key]
                    return <Renderer key={key} sections={sections} labels={labels} styles={styles} />
                })}
            </Page>
        </Document>
    )
}

/**
 * Renders the CV to a PDF blob honouring the section order + visibility + design.
 * Tries the design's font family first (Roboto Slab for serif, Roboto for sans),
 * then falls back through Roboto → Helvetica if a font fetch fails, so the export
 * always produces a file.
 */
export const renderCvPdfBlob = async (
    cv: Pick<CvProfileView, "title" | "sections">,
    labels: CvPdfLabels,
    layout: CvLayout,
    design: CvDesign,
): Promise<Blob> => {
    ensureFonts()
    // Fallback chains keep the chosen classification if a CDN font fetch fails:
    // serif degrades to the builtin serif Times-Roman (not sans Helvetica). Builtin
    // families lack Vietnamese diacritics, so they are last-resort only.
    const families =
        design.font === "serif"
            ? ["Roboto Slab", "Roboto", "Times-Roman"]
            : ["Roboto", "Helvetica"]

    let lastError: unknown
    for (const fontFamily of families) {
        try {
            return await pdf(
                <CvPdfDocument
                    title={cv.title}
                    sections={cv.sections}
                    labels={labels}
                    layout={layout}
                    design={design}
                    fontFamily={fontFamily}
                />,
            ).toBlob()
        } catch (error) {
            lastError = error
        }
    }
    throw lastError
}
