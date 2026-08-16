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
import { useSelfProfileKey } from "@/components/features/profile/hooks/useQueryProfileSwr"
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
    /** Campus CODE → BE academic `campus` (empty = clear / no campus). */
    campus: string
    /**
     * Major CODE → BE academic `majorCode` (empty = clear / not chosen).
     *
     * This is the field the profile Skill-EXP panel reads to work out which skill
     * categories to show; without a way to set it here, the panel's "pick your major"
     * prompt had nowhere to send anyone.
     */
    majorCode: string
    /** Public LinkedIn URL → BE social link `linkedin` (empty = clear). */
    linkedinUrl: string
    /** Personal website URL → BE social link `website` (empty = clear). */
    websiteUrl: string
}

/**
 * Giá trị `majorCode` gửi kèm `PATCH /profiles/me`, hoặc `null` = ĐỪNG ĐỤNG TỚI trường này.
 *
 * VÌ SAO không gửi vô điều kiện như mọi trường khác — trường này có ba thứ chồng lên nhau:
 *
 * 1. **Quy ước PATCH của nó ngược với phần còn lại**: `null` = giữ nguyên, chuỗi RỖNG = XOÁ
 *    (`UpdateProfileRequest#majorCode`; BE chỉ ghi khi `req.majorCode() != null`).
 * 2. **Giá trị seed đến từ một service KHÁC**: `ProfileMapper.academic` chỉ trả `majorCode` khi tra
 *    được mã qua `MajorCatalogApi` (danh mục ngành nằm ở Workspace), và bean RPC đó có đường lùi
 *    trả empty khi service kia không với tới ⇒ về tới FE thì "không đọc được danh mục" và "chưa
 *    chọn ngành" là CÙNG MỘT `null`.
 * 3. Gộp (1) với (2): Workspace nghẽn 30 giây → form seed `""` → người dùng chỉ sửa bio, bấm Lưu →
 *    gửi `majorCode: ""` → `profile.profiles.major_code` bị XOÁ vĩnh viễn, không một lời cảnh báo,
 *    và MajorPicker lúc đó cũng rỗng nên không đặt lại được ngay. Một lỗi ĐỌC biến thành một lệnh
 *    GHI XOÁ. Chiều ngược lại cũng hỏng: ngành bị chuyển INACTIVE thì đường đọc vẫn trả mã
 *    (`findAnyByCode`) còn đường ghi từ chối (`findActiveByCode`) ⇒ MỌI lần lưu hồ sơ đều 400
 *    `PROFILE_INVALID_MAJOR` ở một trường người dùng không hề đụng tới.
 *
 * Nên: chỉ gửi khi giá trị THẬT SỰ khác cái server vừa trả. Người dùng chủ động bỏ chọn ngành vẫn
 * gửi được `""` (khác giá trị seed), tức khả năng xoá có chủ đích không mất.
 *
 * @param seeded - `academic.majorCode` mà `GET /profiles/me` trả về (null khi không rõ).
 * @param edited - giá trị hiện tại trong form.
 * @returns mã ngành cần ghi, hoặc `null` khi không có gì để ghi.
 */
export const majorCodePatch = (seeded: string | null | undefined, edited: string): string | null => {
    const next = edited.trim()
    const current = (seeded ?? "").trim()
    return next === current ? null : next
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

    // shared per-viewer key → dedupes with the profile pages' `GET /profiles/me` fetch,
    // AND keeps the post-save `mutate()` pointed at the entry those pages actually read
    // (a hand-rebuilt key array would revalidate nothing and leave the pages stale)
    const { data: profile, mutate } = useSWR(useSelfProfileKey(), getSelfProfile)

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
            // campus CODE from the active-campus list (empty = clear); the picker only
            // ever emits a valid code or "", so no further constraint is needed here.
            campus: z.string(),
            // major CODE from the majors catalogue (empty = clear); the picker only ever
            // emits a real code or "", and the BE re-checks it against the catalogue.
            majorCode: z.string(),
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
            campus: profile?.academic?.campus ?? "",
            majorCode: profile?.academic?.majorCode ?? "",
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
                    // empty = clear the campus (a @Pattern-validated code otherwise)
                    campus: value.campus.trim() ? value.campus.trim() : null,
                    // KHÔNG gửi vô điều kiện: quy ước của trường này ngược với mọi trường trên
                    // (`null` = giữ nguyên, `""` = XOÁ) và giá trị seed phụ thuộc một service khác,
                    // nên gửi mù là biến lỗi đọc thành lệnh xoá ngành. Xem `majorCodePatch`.
                    majorCode: majorCodePatch(profile?.academic?.majorCode, value.majorCode),
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
