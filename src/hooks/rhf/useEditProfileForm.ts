"use client"

import { useCallback, useMemo, useRef, useState, type ChangeEvent } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import useSWR from "swr"
import {
    getSelfProfile,
    replaceSocialLinks,
    updateSelfProfile,
    uploadAvatar,
} from "@/modules/api/rest/profile"
import type { ProfileSocialLinkInput, SelfProfile } from "@/modules/api/rest/profile"
import { SELF_PROFILE_KEY } from "@/components/features/profile/hooks/useQueryProfileSwr"
import { useRestWithToast } from "@/modules/toast/hooks"

/** Max length of the display name (mirrors the BE `display_name` column). */
const DISPLAY_NAME_MAX = 100
/** Max length of the bio (mirrors the BE `bio` column). */
const BIO_MAX = 280
/** Max length of the role title (maps to the BE `job_title` column). */
const ROLE_TITLE_MAX = 80
/** Max length of the location (maps to the BE `address` column). */
const LOCATION_MAX = 100
/** Max length of a URL social link. */
const URL_MAX = 255

/** Editable profile form values (each maps 1:1 onto a BE profile field / social link). */
export interface EditProfileFormValues {
    /** Display name (empty = clear → BE falls back to username). */
    displayName: string
    /** Short bio / tagline (empty = clear). */
    bio: string
    /** Professional headline → BE `jobTitle` (empty = clear). */
    roleTitle: string
    /** Free-text location → BE `address` (empty = clear). */
    location: string
    /** Public LinkedIn URL → BE social link `linkedin` (empty = clear). */
    linkedinUrl: string
    /** Personal website URL → BE social link `website` (empty = clear). */
    websiteUrl: string
}

/** True when a BE social-link platform matches the "linkedin" slot. */
const isLinkedin = (platform: string): boolean => platform.toLowerCase().includes("linkedin")
/** True when a BE social-link platform matches the "website" slot. */
const isWebsite = (platform: string): boolean => {
    const p = platform.toLowerCase()
    return p === "website" || p.includes("web")
}

/** Reads the first URL of a matching social-link slot from a profile. */
const findLink = (profile: SelfProfile | undefined, match: (platform: string) => boolean): string =>
    profile?.socialLinks?.find((link) => match(link.platform))?.url ?? ""

/**
 * react-hook-form for the edit-profile form, wired to the real BE REST profile
 * endpoints. Seeds values from `GET /api/v1/profiles/me`, owns the picked-avatar
 * file state, and on submit runs (1) the avatar multipart upload (when a new file
 * is chosen), (2) `PATCH /me` for the text fields, then (3) `PUT /me/social-links`
 * (replace-all, preserving non-linkedin/website links). Revalidates the shared
 * self-profile SWR cache on success so the profile pages reflect the change.
 *
 * @returns the RHF methods + `onSubmit` and the avatar helpers (`fileInputRef`,
 * `onPickAvatar`, `onAvatarChange`, `shownAvatar`).
 */
export const useEditProfileForm = () => {
    const runRest = useRestWithToast()

    // shared key → dedupes with the profile pages' `GET /profiles/me` fetch
    const { data: profile, mutate } = useSWR(SELF_PROFILE_KEY, getSelfProfile)

    // hidden <input type=file>, opened by the avatar button
    const fileInputRef = useRef<HTMLInputElement>(null)
    // the freshly picked avatar file (null until the user chooses one) + its preview
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)

    const schema = useMemo(
        () => z.object({
            displayName: z.string().trim().max(DISPLAY_NAME_MAX),
            bio: z.string().trim().max(BIO_MAX),
            roleTitle: z.string().trim().max(ROLE_TITLE_MAX),
            location: z.string().trim().max(LOCATION_MAX),
            // empty = clear; otherwise must be a real URL within the length cap
            linkedinUrl: z.union([z.literal(""), z.string().trim().url().max(URL_MAX)]),
            websiteUrl: z.union([z.literal(""), z.string().trim().url().max(URL_MAX)]),
        }),
        [],
    )

    const form = useForm<EditProfileFormValues>({
        resolver: zodResolver(schema),
        // re-seed when the fetched profile changes (RHF `values` = controlled reinit)
        values: {
            displayName: profile?.displayName ?? "",
            bio: profile?.bio ?? "",
            roleTitle: profile?.jobTitle ?? "",
            location: profile?.address ?? "",
            linkedinUrl: findLink(profile, isLinkedin),
            websiteUrl: findLink(profile, isWebsite),
        },
    })

    /** Open the native file picker. */
    const onPickAvatar = useCallback(() => fileInputRef.current?.click(), [])

    /** Stage an avatar file + build a local preview URL (shared by picker + dropzone). */
    const onAvatarFile = useCallback((next: File) => {
        setFile(next)
        setPreview(URL.createObjectURL(next))
    }, [])

    /** Capture the chosen file from the native picker. */
    const onAvatarChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const next = event.target.files?.[0]
            // ignore an empty pick (user cancelled the dialog)
            if (!next) {
                return
            }
            onAvatarFile(next)
        },
        [onAvatarFile],
    )

    // the face shown: local preview while a new file is staged, else the saved avatar
    const shownAvatar = preview ?? profile?.avatarUrl ?? null

    const onSubmit = form.handleSubmit(async (value) => {
        const result = await runRest(
            async () => {
                // 1) upload the new avatar first (multipart PUT /me/avatar) so the URL
                // is persisted before the pages re-read the profile
                if (file) {
                    await uploadAvatar(file)
                }
                // 2) persist the editable text fields; empty string clears the column
                await updateSelfProfile({
                    displayName: value.displayName.trim() ? value.displayName.trim() : null,
                    bio: value.bio.trim() ? value.bio.trim() : null,
                    jobTitle: value.roleTitle.trim() ? value.roleTitle.trim() : null,
                    address: value.location.trim() ? value.location.trim() : null,
                })
                // 3) social links (replace-all): keep any non-linkedin/website links the
                // BE already stores, then re-add the two the form controls
                const preserved: Array<ProfileSocialLinkInput> = (profile?.socialLinks ?? [])
                    .filter((link) => !isLinkedin(link.platform) && !isWebsite(link.platform))
                    .map((link) => ({ platform: link.platform, url: link.url, sortOrder: link.sortOrder }))
                const edited: Array<ProfileSocialLinkInput> = []
                if (value.linkedinUrl.trim()) {
                    edited.push({ platform: "linkedin", url: value.linkedinUrl.trim(), sortOrder: preserved.length })
                }
                if (value.websiteUrl.trim()) {
                    edited.push({ platform: "website", url: value.websiteUrl.trim(), sortOrder: preserved.length + 1 })
                }
                const nextLinks = [...preserved, ...edited]
                // only touch social links when there is something to write or clear
                if (nextLinks.length > 0 || (profile?.socialLinks?.length ?? 0) > 0) {
                    await replaceSocialLinks({ links: nextLinks })
                }
                return true
            },
            { showSuccessToast: true, showErrorToast: true },
        )
        // on success clear the staged avatar + revalidate the shared profile cache
        if (result) {
            setFile(null)
            setPreview(null)
            await mutate()
        }
    })

    return {
        ...form,
        onSubmit,
        fileInputRef,
        onPickAvatar,
        onAvatarChange,
        onAvatarFile,
        shownAvatar,
    }
}
