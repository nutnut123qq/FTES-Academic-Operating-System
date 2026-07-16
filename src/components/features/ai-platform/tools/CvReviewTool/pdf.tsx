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

/**
 * Client-side Harvard PDF export (spec: "export ... entirely client-side using
 * @react-pdf/renderer ... downloaded as a blob without any BE render endpoint").
 *
 * This module is only ever reached through a dynamic `import()` from the export
 * click handler, so the (heavy) renderer is code-split out of the page bundle and
 * never runs on the server.
 *
 * Fonts: the built-in Helvetica has poor Vietnamese diacritic coverage, so we try
 * to register Roboto (full Vietnamese) at first export and fall back to Helvetica
 * if the font fetch is unavailable — the export never hard-fails on the font.
 */

const ROBOTO_REGULAR =
    "https://cdn.jsdelivr.net/gh/google/fonts/apache/roboto/static/Roboto-Regular.ttf"
const ROBOTO_BOLD =
    "https://cdn.jsdelivr.net/gh/google/fonts/apache/roboto/static/Roboto-Bold.ttf"

let robotoRegistered = false

/** Register Roboto once; returns whether the custom family is available to use. */
const ensureRoboto = (): boolean => {
    if (robotoRegistered) return true
    try {
        Font.register({
            family: "Roboto",
            fonts: [
                { src: ROBOTO_REGULAR, fontWeight: 400 },
                { src: ROBOTO_BOLD, fontWeight: 700 },
            ],
        })
        // Harvard résumés wrap long tech/skill lines — disable hyphenation so words
        // are not broken mid-token.
        Font.registerHyphenationCallback((word) => [word])
        robotoRegistered = true
        return true
    } catch {
        return false
    }
}

const styles = StyleSheet.create({
    page: {
        paddingVertical: 40,
        paddingHorizontal: 48,
        fontSize: 10,
        lineHeight: 1.4,
        color: "#1a1a1a",
    },
    name: { fontSize: 20, fontWeight: 700, textAlign: "center", marginBottom: 4 },
    contact: { fontSize: 9, textAlign: "center", color: "#444" },
    sectionHeading: {
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1,
        marginTop: 14,
        marginBottom: 4,
        paddingBottom: 2,
        borderBottomWidth: 1,
        borderBottomColor: "#1a1a1a",
    },
    itemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 6,
    },
    itemTitle: { fontSize: 10, fontWeight: 700 },
    itemSub: { fontSize: 10, fontStyle: "italic", color: "#333" },
    itemDates: { fontSize: 9, color: "#555" },
    paragraph: { marginTop: 2 },
    bulletRow: { flexDirection: "row", marginTop: 1, paddingLeft: 8 },
    bulletDot: { width: 8 },
    bulletText: { flex: 1 },
    meta: { fontSize: 9, color: "#555", marginTop: 1 },
})

const hasText = (value: string | undefined): value is string =>
    !!value && value.trim().length > 0

const joinParts = (parts: Array<string | undefined>): string =>
    parts.filter((part) => hasText(part)).join("  ·  ")

/** A single "- text" bullet line. */
const Bullet = ({ children }: { children: string }) => (
    <View style={styles.bulletRow}>
        <Text style={styles.bulletDot}>•</Text>
        <Text style={styles.bulletText}>{children}</Text>
    </View>
)

const SectionHeading = ({ label }: { label: string }) => (
    <Text style={styles.sectionHeading}>{label.toUpperCase()}</Text>
)

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

interface CvPdfDocumentProps {
    title: string
    sections: CvSections
    labels: CvPdfLabels
    fontFamily: string
}

/** The Harvard single-column CV document. */
const CvPdfDocument = ({ title, sections, labels, fontFamily }: CvPdfDocumentProps) => {
    const header = sections.header ?? {}
    const links = (header.links ?? []).filter((link) => hasText(link.url))
    const education = (sections.education ?? []).filter(
        (item) => hasText(item.school) || hasText(item.degree) || hasText(item.major),
    )
    const experience = (sections.experience ?? []).filter(
        (item) => hasText(item.company) || hasText(item.title),
    )
    const projects = (sections.projects ?? []).filter((item) => hasText(item.name))
    const skills = (sections.skills ?? []).filter(
        (group) => (group.items ?? []).some((skill) => hasText(skill)),
    )
    const awards = (sections.awards ?? []).filter((item) => hasText(item.name))

    return (
        <Document title={title || labels.untitled}>
            <Page size="A4" style={{ ...styles.page, fontFamily }}>
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
                            .map((link) => (hasText(link.label) ? `${link.label}: ${link.url}` : link.url))
                            .join("  ·  ")}
                    </Text>
                ) : null}

                {hasText(sections.summary) ? (
                    <View>
                        <SectionHeading label={labels.summary} />
                        <Text style={styles.paragraph}>{sections.summary}</Text>
                    </View>
                ) : null}

                {education.length > 0 ? (
                    <View>
                        <SectionHeading label={labels.education} />
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
                                    <Bullet key={i}>{line}</Bullet>
                                ))}
                            </View>
                        ))}
                    </View>
                ) : null}

                {experience.length > 0 ? (
                    <View>
                        <SectionHeading label={labels.experience} />
                        {experience.map((item, index) => (
                            <View key={index} wrap={false}>
                                <View style={styles.itemRow}>
                                    <Text style={styles.itemTitle}>
                                        {joinParts([item.title, item.company])}
                                    </Text>
                                    <Text style={styles.itemDates}>{joinDates(item.start, item.end)}</Text>
                                </View>
                                {(item.bullets ?? []).filter(hasText).map((line, i) => (
                                    <Bullet key={i}>{line}</Bullet>
                                ))}
                            </View>
                        ))}
                    </View>
                ) : null}

                {projects.length > 0 ? (
                    <View>
                        <SectionHeading label={labels.projects} />
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
                                    <Bullet key={i}>{line}</Bullet>
                                ))}
                            </View>
                        ))}
                    </View>
                ) : null}

                {skills.length > 0 ? (
                    <View>
                        <SectionHeading label={labels.skills} />
                        {skills.map((group, index) => (
                            <Text key={index} style={styles.paragraph}>
                                {hasText(group.group) ? (
                                    <Text style={styles.itemTitle}>{group.group}: </Text>
                                ) : null}
                                {(group.items ?? []).filter(hasText).join(", ")}
                            </Text>
                        ))}
                    </View>
                ) : null}

                {awards.length > 0 ? (
                    <View>
                        <SectionHeading label={labels.awards} />
                        {awards.map((item, index) => (
                            <Bullet key={index}>{joinParts([item.name, item.by, item.year])}</Bullet>
                        ))}
                    </View>
                ) : null}
            </Page>
        </Document>
    )
}

const joinDates = (start: string | undefined, end: string | undefined): string =>
    [start, end].filter(hasText).join(" – ")

/**
 * Renders the CV to a PDF blob. Prefers the registered Roboto family; if the font
 * fetch fails at render time, retries once with built-in Helvetica so the export
 * always produces a file.
 */
export const renderCvPdfBlob = async (
    cv: Pick<CvProfileView, "title" | "sections">,
    labels: CvPdfLabels,
): Promise<Blob> => {
    const useRoboto = ensureRoboto()
    const build = (fontFamily: string) =>
        pdf(
            <CvPdfDocument
                title={cv.title}
                sections={cv.sections}
                labels={labels}
                fontFamily={fontFamily}
            />,
        ).toBlob()

    if (!useRoboto) return build("Helvetica")
    try {
        return await build("Roboto")
    } catch {
        return build("Helvetica")
    }
}
