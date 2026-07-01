"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "next-intl"
import axios from "axios"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setUser } from "@/redux/slices/user"
import { useMutateGenerateAvatarPresignUrlSwr } from "@/hooks/swr/api/graphql/mutations/useMutateGenerateAvatarPresignUrlSwr"
import { useMutateUpdateProfileSwr } from "@/hooks/swr/api/graphql/mutations/useMutateUpdateProfileSwr"
import { useMutateVerifyAvatarPresignUrlSwr } from "@/hooks/swr/api/graphql/mutations/useMutateVerifyAvatarPresignUrlSwr"
import { useGraphQLWithToast, useRestWithToast } from "@/modules/toast/hooks"
import { WorkMode } from "@/modules/types/enums/work-mode"

/** Max length of the display name (mirrors the `display_name` column). */
const DISPLAY_NAME_MAX = 100
/** Max length of the bio (mirrors the `bio` column). */
const BIO_MAX = 280
/** Max length of the role title (mirrors the `role_title` column). */
const ROLE_TITLE_MAX = 80
/** Max length of the location (mirrors the `location` column). */
const LOCATION_MAX = 100
/** Max length of a URL field (mirrors the `linkedin_url` / `website_url` columns). */
const URL_MAX = 255

/** Editable profile form values. */
export interface EditProfileFormValues {
    /** Display name (empty string = clear → falls back to username). */
    displayName: string
    /** Short bio / tagline (empty string = clear). */
    bio: string
    /** Lock profile (FB-style): when on, only the owner sees full content. */
    profileLocked: boolean
    /** Open to work: when on, the profile shows a hiring badge. */
    openToWork: boolean
    /** Professional headline / role title (empty string = clear). */
    roleTitle: string
    /** Free-text location (empty string = clear). */
    location: string
    /** Preferred work mode (empty string = no preference → clear). */
    workMode: WorkMode | ""
    /** Public LinkedIn URL (empty string = clear). */
    linkedinUrl: string
    /** Personal website URL (empty string = clear). */
    websiteUrl: string
}

/**
 * react-hook-form for the edit-profile form. Seeds values from the redux user
 * (re-seeds via `values`), owns the picked-avatar file state, and on submit runs
 * the avatar presigned-upload flow (when a new file is chosen) then the
 * `updateProfile` mutation, pushing the fresh user into redux so the header /
 * navbar update instantly. Toasts the result via `useGraphQLWithToast`.
 *
 * @returns the RHF methods + `onSubmit` and the avatar helpers (`fileInputRef`,
 * `onPickAvatar`, `onAvatarChange`, `shownAvatar`).
 */
export const useEditProfileForm = () => {
    const t = useTranslations()
    const dispatch = useAppDispatch()
    const user = useAppSelector((state) => state.user.user)

    const runGraphQL = useGraphQLWithToast()
    const runRest = useRestWithToast()

    const updateProfileSwr = useMutateUpdateProfileSwr()
    // avatar upload is a presigned-URL flow: generate → PUT to MinIO → verify
    const generateAvatarPresignSwr = useMutateGenerateAvatarPresignUrlSwr()
    const verifyAvatarPresignSwr = useMutateVerifyAvatarPresignUrlSwr()

    // hidden <input type=file>, opened by the avatar button
    const fileInputRef = useRef<HTMLInputElement>(null)
    // the freshly picked avatar file (null until the user chooses one) + its preview
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)

    const schema = useMemo(
        () => z.object({
            displayName: z.string().trim().max(DISPLAY_NAME_MAX),
            bio: z.string().trim().max(BIO_MAX),
            profileLocked: z.boolean(),
            openToWork: z.boolean(),
            roleTitle: z.string().trim().max(ROLE_TITLE_MAX),
            location: z.string().trim().max(LOCATION_MAX),
            workMode: z.union([z.nativeEnum(WorkMode), z.literal("")]),
            // empty = clear; otherwise must be a real URL within the column cap
            linkedinUrl: z.union([z.literal(""), z.string().trim().url().max(URL_MAX)]),
            websiteUrl: z.union([z.literal(""), z.string().trim().url().max(URL_MAX)]),
        }),
        [],
    )

    const form = useForm<EditProfileFormValues>({
        resolver: zodResolver(schema),
        // re-seed when the redux user changes (replaces formik enableReinitialize)
        values: {
            displayName: user?.displayName ?? "",
            bio: user?.bio ?? "",
            profileLocked: user?.profileLocked ?? false,
            openToWork: user?.openToWork ?? false,
            roleTitle: user?.roleTitle ?? "",
            location: user?.location ?? "",
            workMode: user?.workMode ?? "",
            linkedinUrl: user?.linkedinUrl ?? "",
            websiteUrl: user?.websiteUrl ?? "",
        },
    })

    /** Open the native file picker. */
    const onPickAvatar = useCallback(
        () => fileInputRef.current?.click(),
        [],
    )

    /** Stage an avatar file + build a local preview URL (shared by picker + dropzone). */
    const onAvatarFile = useCallback(
        (next: File) => {
            setFile(next)
            setPreview(URL.createObjectURL(next))
        },
        [],
    )

    /** Capture the chosen file from the native picker. */
    const onAvatarChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
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
    const shownAvatar = preview ?? user?.avatar ?? null

    const onSubmit = form.handleSubmit(async (value) => {
        await runGraphQL(
            async () => {
                // 1) upload the new avatar first (presigned-URL flow) so the BE has
                // the URL persisted before re-reading the user
                if (file) {
                    // 1a) mint a presigned PUT URL for the picked image's type
                    const presign = await generateAvatarPresignSwr.trigger({
                        request: {
                            contentType: file.type,
                        },
                    })
                    const presignData = presign?.data?.generateAvatarPresignUrl?.data
                    if (!presignData?.url) {
                        throw new Error(t("profileEdit.uploadFailed"))
                    }
                    // 1b) upload the bytes straight to MinIO; Content-Type must match.
                    // the profile update toasts on success, so this upload toasts only on error
                    await runRest(
                        () => axios.put(presignData.url, file, {
                            headers: {
                                "Content-Type": file.type,
                            },
                        }),
                        { showSuccessToast: false },
                    )
                    // 1c) confirm → BE validates the key owner + persists the avatar URL
                    const verify = await verifyAvatarPresignSwr.trigger({
                        request: {
                            key: presignData.key,
                        },
                    })
                    if (!verify?.data?.verifyAvatarPresignUrl?.data?.uploaded) {
                        throw new Error(t("profileEdit.uploadFailed"))
                    }
                }

                // 2) persist the text fields + lock flag; empty string clears the column
                const result = await updateProfileSwr.trigger({
                    displayName: value.displayName.trim() ? value.displayName.trim() : null,
                    bio: value.bio.trim() ? value.bio.trim() : null,
                    profileLocked: value.profileLocked,
                    openToWork: value.openToWork,
                    roleTitle: value.roleTitle.trim() ? value.roleTitle.trim() : null,
                    location: value.location.trim() ? value.location.trim() : null,
                    workMode: value.workMode === "" ? null : value.workMode,
                    linkedinUrl: value.linkedinUrl.trim() ? value.linkedinUrl.trim() : null,
                    websiteUrl: value.websiteUrl.trim() ? value.websiteUrl.trim() : null,
                })
                const env = result?.data?.updateProfile
                if (!env) {
                    throw new Error(t("profileEdit.error"))
                }
                // 3) on success push the fresh user into redux so the header + navbar
                // reflect changes instantly, and clear the staged avatar
                if (env.success && env.data) {
                    dispatch(setUser(env.data))
                    setFile(null)
                    setPreview(null)
                }
                // returned envelope drives the success / error toast
                return env
            },
            {
                showErrorToast: true,
                showSuccessToast: true,
            },
        )
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
