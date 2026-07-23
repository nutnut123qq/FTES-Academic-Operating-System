"use client"

import { useEffect, useRef, useState } from "react"
import useSWR from "swr"
import { getMyCv, putMyCv } from "@/modules/api/rest/career"
import type {
    CvAwardItem,
    CvEducationItem,
    CvExperienceItem,
    CvHeaderLink,
    CvProjectItem,
    CvSections,
    CvSkillGroup,
    CvStatus,
} from "@/modules/api/rest/career"
import {
    cvHeaderErrors,
    emptyAward,
    emptyCvLink,
    emptyEducation,
    emptyExperience,
    emptyProject,
    emptySkillGroup,
    type CvHeaderErrorField,
} from "../sections"

/** SWR key for the caller's CV — re-exported so callers keep one source. */
export const MY_CV_SWR_KEY = "GET_MY_CV"

/** A transient client id, stripped before the CV is saved (BE rejects unknown keys). */
type WithId<T> = T & { _id: string }

/** Header link carrying a client id (for stable keys). */
export type DraftLink = WithId<CvHeaderLink>
/** Draft entry shapes (client id added; never persisted). */
export type DraftEducation = WithId<CvEducationItem>
export type DraftExperience = WithId<CvExperienceItem>
export type DraftProject = WithId<CvProjectItem>
export type DraftSkill = WithId<CvSkillGroup>
export type DraftAward = WithId<CvAwardItem>

/** The editor's working copy of the CV — same Harvard shape, plus client ids. */
export interface DraftSections {
    header: {
        fullName: string
        email: string
        phone: string
        location: string
        links: DraftLink[]
    }
    summary: string
    education: DraftEducation[]
    experience: DraftExperience[]
    projects: DraftProject[]
    skills: DraftSkill[]
    awards: DraftAward[]
}

/** The repeater sections keyed as arrays. */
export type ArraySectionKey = "education" | "experience" | "projects" | "skills" | "awards"

const newId = (): string => {
    try {
        if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
            return crypto.randomUUID()
        }
    } catch {
        // fall through
    }
    return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
}

const withId = <T,>(value: T): WithId<T> => ({ ...value, _id: newId() })

/** An empty draft (first-time user). */
const emptyDraft = (): DraftSections => ({
    header: { fullName: "", email: "", phone: "", location: "", links: [] },
    summary: "",
    education: [],
    experience: [],
    projects: [],
    skills: [],
    awards: [],
})

/** Hydrate a saved CV into a draft, tagging every entry with a client id. */
const toDraft = (sections: CvSections | undefined): DraftSections => {
    const header = sections?.header ?? {}
    return {
        header: {
            fullName: header.fullName ?? "",
            email: header.email ?? "",
            phone: header.phone ?? "",
            location: header.location ?? "",
            links: (header.links ?? []).map((link) => withId({ label: link.label ?? "", url: link.url ?? "" })),
        },
        summary: sections?.summary ?? "",
        education: (sections?.education ?? []).map((item) => withId({ ...emptyEducation(), ...item })),
        experience: (sections?.experience ?? []).map((item) => withId({ ...emptyExperience(), ...item })),
        projects: (sections?.projects ?? []).map((item) => withId({ ...emptyProject(), ...item })),
        skills: (sections?.skills ?? []).map((item) => withId({ ...emptySkillGroup(), ...item })),
        awards: (sections?.awards ?? []).map((item) => withId({ ...emptyAward(), ...item })),
    }
}

/** Drop blank / whitespace-only rows from a per-line list (bullets / tech / items).
 * In-progress empty rows live only in the client draft; they must never reach the
 * saved payload — otherwise they round-trip forever, accumulate on every reload,
 * count against the BE 64 KB cap, and pollute the AI-review input. Mirrors the old
 * `CvBuilderForm`'s `linesToList` saved-shape behaviour. */
const cleanLines = (lines: string[] | undefined): string[] =>
    (lines ?? []).filter((line) => line.trim().length > 0)

/**
 * Strip client ids and rebuild the exact Harvard-shape payload (only known keys)
 * so the BE never sees an unknown key (400 CV_PROFILE_INVALID). Blank list rows are
 * pruned here (not in the draft) so in-progress empty rows still render while editing.
 */
export const sanitizeSections = (draft: DraftSections): CvSections => ({
    header: {
        fullName: draft.header.fullName,
        email: draft.header.email,
        phone: draft.header.phone,
        location: draft.header.location,
        links: draft.header.links.map((link) => ({ label: link.label ?? "", url: link.url ?? "" })),
    },
    summary: draft.summary,
    education: draft.education.map((item) => ({
        school: item.school ?? "",
        degree: item.degree ?? "",
        major: item.major ?? "",
        start: item.start ?? "",
        end: item.end ?? "",
        gpa: item.gpa ?? "",
        highlights: cleanLines(item.highlights),
    })),
    experience: draft.experience.map((item) => ({
        company: item.company ?? "",
        title: item.title ?? "",
        start: item.start ?? "",
        end: item.end ?? "",
        bullets: cleanLines(item.bullets),
    })),
    projects: draft.projects.map((item) => ({
        name: item.name ?? "",
        role: item.role ?? "",
        tech: cleanLines(item.tech),
        bullets: cleanLines(item.bullets),
        link: item.link ?? "",
    })),
    skills: draft.skills.map((item) => ({ group: item.group ?? "", items: cleanLines(item.items) })),
    awards: draft.awards.map((item) => ({ name: item.name ?? "", by: item.by ?? "", year: item.year ?? "" })),
})

const FACTORIES: Record<ArraySectionKey, () => object> = {
    education: emptyEducation,
    experience: emptyExperience,
    projects: emptyProject,
    skills: emptySkillGroup,
    awards: emptyAward,
}

/** Everything the Live editor needs to load / edit / validate / save the CV. */
export interface CvDraft {
    isLoading: boolean
    loadError: unknown
    hasData: boolean
    reload: () => void

    title: string
    setTitle: (value: string) => void
    draft: DraftSections
    errors: CvHeaderErrorField[]
    saved: boolean
    saveError: string | null

    setSummary: (value: string) => void
    patchHeader: (patch: Partial<DraftSections["header"]>) => void
    addLink: () => void
    removeLink: (index: number) => void
    updateLink: (index: number, patch: Partial<CvHeaderLink>) => void

    addEntry: (key: ArraySectionKey) => void
    removeEntry: (key: ArraySectionKey, index: number) => void
    updateEntry: (key: ArraySectionKey, index: number, patch: Record<string, unknown>) => void
    reorderEntries: (key: ArraySectionKey, next: Array<Record<string, unknown>>) => void
    moveEntry: (key: ArraySectionKey, index: number, dir: -1 | 1) => void

    sanitized: () => CvSections
    /** Cv profile id once saved/loaded (used to scope FE-only prefs per user). */
    cvId: string | undefined
    /** Validate the header, set error flags, return the offending fields. */
    validateHeader: () => CvHeaderErrorField[]
    /** Validate + PUT; returns the saved profile id, or null on failure. */
    save: () => Promise<string | null>
}

/**
 * Loads, edits, validates and saves the caller's CV. Extracted from the old
 * `CvBuilderForm` so the Live editor and any future caller share one draft core;
 * the returned draft carries client ids for stable drag/keys that
 * {@link sanitizeSections} strips before the upsert.
 */
export const useCvDraft = (): CvDraft => {
    const swr = useSWR(MY_CV_SWR_KEY, getMyCv)

    const [title, setTitle] = useState("")
    const [status, setStatus] = useState<CvStatus>("DRAFT")
    const [draft, setDraft] = useState<DraftSections>(emptyDraft)
    const [errors, setErrors] = useState<CvHeaderErrorField[]>([])
    const [saveError, setSaveError] = useState<string | null>(null)
    const [saved, setSaved] = useState(false)

    // Hydrate once from the loaded CV (or leave the empty draft for a first-time user).
    const hydratedRef = useRef(false)
    useEffect(() => {
        if (hydratedRef.current || swr.data === undefined) return
        hydratedRef.current = true
        if (swr.data) {
            setTitle(swr.data.title ?? "")
            setStatus(swr.data.status ?? "DRAFT")
            setDraft(toDraft(swr.data.sections))
        }
    }, [swr.data])

    const touch = () => setSaved(false)

    const setSummary = (value: string) => {
        setDraft((prev) => ({ ...prev, summary: value }))
        touch()
    }

    const patchHeader = (patch: Partial<DraftSections["header"]>) => {
        setDraft((prev) => ({ ...prev, header: { ...prev.header, ...patch } }))
        touch()
    }

    const addLink = () => {
        setDraft((prev) => ({
            ...prev,
            header: { ...prev.header, links: [...prev.header.links, withId(emptyCvLink())] },
        }))
        touch()
    }
    const removeLink = (index: number) => {
        setDraft((prev) => ({
            ...prev,
            header: { ...prev.header, links: prev.header.links.filter((_, i) => i !== index) },
        }))
        touch()
    }
    const updateLink = (index: number, patch: Partial<CvHeaderLink>) => {
        setDraft((prev) => ({
            ...prev,
            header: {
                ...prev.header,
                links: prev.header.links.map((link, i) => (i === index ? { ...link, ...patch } : link)),
            },
        }))
        touch()
    }

    const addEntry = (key: ArraySectionKey) => {
        setDraft((prev) => ({ ...prev, [key]: [...prev[key], withId(FACTORIES[key]())] }))
        touch()
    }
    const removeEntry = (key: ArraySectionKey, index: number) => {
        setDraft((prev) => ({ ...prev, [key]: prev[key].filter((_, i) => i !== index) }))
        touch()
    }
    const updateEntry = (key: ArraySectionKey, index: number, patch: Record<string, unknown>) => {
        setDraft((prev) => ({
            ...prev,
            [key]: prev[key].map((item, i) => (i === index ? { ...item, ...patch } : item)),
        }))
        touch()
    }
    const reorderEntries = (key: ArraySectionKey, next: Array<Record<string, unknown>>) => {
        setDraft((prev) => ({ ...prev, [key]: next as unknown as DraftSections[ArraySectionKey] }))
        touch()
    }
    const moveEntry = (key: ArraySectionKey, index: number, dir: -1 | 1) => {
        setDraft((prev) => {
            const list = [...prev[key]]
            const target = index + dir
            if (target < 0 || target >= list.length) return prev
            const [moved] = list.splice(index, 1)
            list.splice(target, 0, moved)
            return { ...prev, [key]: list as DraftSections[ArraySectionKey] }
        })
        touch()
    }

    const validateHeader = (): CvHeaderErrorField[] => {
        const found = cvHeaderErrors(sanitizeSections(draft))
        setErrors(found)
        return found
    }

    const save = async (): Promise<string | null> => {
        const found = validateHeader()
        if (found.length > 0) return null
        setSaveError(null)
        try {
            const sections = sanitizeSections(draft)
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

    return {
        isLoading: swr.isLoading && !swr.data,
        loadError: !swr.data ? swr.error : undefined,
        hasData: swr.data !== undefined,
        reload: () => void swr.mutate(),

        title,
        setTitle: (value: string) => {
            setTitle(value)
            touch()
        },
        draft,
        errors,
        saved,
        saveError,

        setSummary,
        patchHeader,
        addLink,
        removeLink,
        updateLink,

        addEntry,
        removeEntry,
        updateEntry,
        reorderEntries,
        moveEntry,

        sanitized: () => sanitizeSections(draft),
        cvId: swr.data?.id,
        validateHeader,
        save,
    }
}
