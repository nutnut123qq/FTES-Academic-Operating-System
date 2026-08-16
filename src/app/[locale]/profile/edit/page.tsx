"use client"

import React from "react"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
    Button,
    FieldError,
    Input,
    Label,
    TextField,
    Typography,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import { Controller, type Control } from "react-hook-form"
import { CameraIcon } from "@phosphor-icons/react"
import { useEditProfileForm, type EditProfileFormValues } from "@/hooks/rhf/useEditProfileForm"
import { CampusPicker } from "@/components/reuseable/CampusPicker"
import { MajorPicker } from "@/components/reuseable/MajorPicker"
import { useQueryCampusesSwr } from "@/components/features/community/hooks/useQueryCampusesSwr"
import { useQueryMajorsSwr, type Major } from "@/components/features/subject/hooks/useQueryMajorsSwr"
import type { CampusView } from "@/modules/api/rest/community"

/** The plain-text fields of the edit form (all seed/clear as strings). */
type TextFieldName = "displayName" | "bio" | "roleTitle" | "location" | "linkedinUrl" | "websiteUrl"

/** A labeled RHF-controlled text input row (mirrors the house `AdminLogin` pattern). */
const TextRow = ({
    control,
    name,
    label,
    placeholder,
}: {
    control: Control<EditProfileFormValues>
    name: TextFieldName
    label: string
    placeholder?: string
}) => (
    <Controller
        control={control}
        name={name}
        render={({ field, fieldState }) => (
            <TextField variant="secondary" isInvalid={fieldState.invalid && fieldState.isTouched}>
                <Label htmlFor={`edit-${name}`} className="text-sm">
                    {label}
                </Label>
                <Input
                    id={`edit-${name}`}
                    name={field.name}
                    ref={field.ref}
                    value={field.value}
                    placeholder={placeholder}
                    onChange={(event) => field.onChange(event.target.value)}
                    onBlur={field.onBlur}
                />
                <FieldError>{fieldState.error?.message}</FieldError>
            </TextField>
        )}
    />
)

/**
 * The campus row — a labeled RHF-controlled single-select (HeroUI `Dropdown` via
 * {@link CampusPicker}, not a raw `<select>`). The form value is a campus CODE ("" =
 * no campus); the placeholder entry clears it. Options come from the active-campus list,
 * which equals the BE `@Pattern` set, so any pick round-trips through `PATCH /me`.
 */
const CampusRow = ({
    control,
    label,
    placeholder,
    campuses,
}: {
    control: Control<EditProfileFormValues>
    label: string
    placeholder: string
    campuses: Array<CampusView>
}) => (
    <Controller
        control={control}
        name="campus"
        render={({ field }) => (
            <div className="flex flex-col gap-2">
                <Label className="text-sm">{label}</Label>
                <CampusPicker
                    campuses={campuses}
                    value={field.value || null}
                    onChange={(code) => field.onChange(code ?? "")}
                    placeholder={placeholder}
                    ariaLabel={label}
                    className="self-start"
                />
            </div>
        )}
    />
)

/**
 * The major row — same shape as {@link CampusRow}. The form value is a major CODE
 * ("" = not chosen).
 *
 * This row is what makes the profile's Skill-EXP panel work: that panel picks its skill
 * categories from the learner's major, and when none is set it prompts them here. A
 * prompt pointing at a form that cannot set the field is worse than no prompt.
 */
const MajorRow = ({
    control,
    label,
    placeholder,
    hint,
    emptyHint,
    majors,
}: {
    control: Control<EditProfileFormValues>
    label: string
    placeholder: string
    hint: string
    emptyHint: string
    majors: Array<Major>
}) => (
    <Controller
        control={control}
        name="majorCode"
        render={({ field }) => (
            <div className="flex flex-col gap-2">
                <Label className="text-sm">{label}</Label>
                <MajorPicker
                    majors={majors}
                    value={field.value || null}
                    onChange={(code) => field.onChange(code ?? "")}
                    placeholder={placeholder}
                    ariaLabel={label}
                    // Danh mục ngành rỗng là trạng thái hợp lệ (BE chưa có `/majors`) — ô sẽ tự
                    // khoá, nên phải kèm câu nói VÌ SAO, nhất là khi người dùng vừa bấm lời mời
                    // "Chọn ngành" từ biểu đồ EXP và sang đây chỉ thấy một ô xám.
                    emptyHint={emptyHint}
                    className="self-start"
                />
                <Typography type="body-xs" color="muted">
                    {hint}
                </Typography>
            </div>
        )}
    />
)

/**
 * `/profile/edit` — edit-profile form. Reuses {@link useEditProfileForm} (the
 * real REST profile flow: seeds from `GET /api/v1/profiles/me`, saves via
 * `PATCH /me` + multipart avatar upload + `PUT /me/social-links`). Only fields
 * the BE profile contract carries are shown.
 */
const EditProfilePage = () => {
    const t = useTranslations()
    const { control, formState, onSubmit, fileInputRef, onPickAvatar, onAvatarChange, shownAvatar } =
        useEditProfileForm()
    const { campuses } = useQueryCampusesSwr()
    const { majors } = useQueryMajorsSwr()

    return (
        <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-6">
            <div className="flex flex-col gap-1">
                <Typography type="h5" weight="bold">
                    {t("profileEdit.title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("profileEdit.subtitle")}
                </Typography>
            </div>

            {/* avatar */}
            <div className="flex items-center gap-4">
                <Avatar className="size-20 rounded-full">
                    {shownAvatar ? <AvatarImage src={shownAvatar} alt="" /> : null}
                    <AvatarFallback className="bg-accent/10 text-xl font-bold text-accent">?</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start gap-1">
                    <Button type="button" variant="secondary" size="sm" onPress={onPickAvatar}>
                        <CameraIcon className="size-4" aria-hidden focusable="false" />
                        {t("profileEdit.changeAvatar")}
                    </Button>
                    <Typography type="body-xs" color="muted">
                        {t("profileEdit.avatarHint")}
                    </Typography>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={onAvatarChange}
                />
            </div>

            {/* text fields */}
            <TextRow control={control} name="displayName" label={t("profileEdit.displayName")} />
            <TextRow
                control={control}
                name="bio"
                label={t("profileEdit.bio")}
                placeholder={t("profileEdit.bioPlaceholder")}
            />
            <TextRow
                control={control}
                name="roleTitle"
                label={t("profileEdit.roleTitle")}
                placeholder={t("profileEdit.roleTitlePlaceholder")}
            />
            <TextRow
                control={control}
                name="location"
                label={t("profileEdit.location")}
                placeholder={t("profileEdit.locationPlaceholder")}
            />

            <CampusRow
                control={control}
                label={t("profile.academic.fields.campus")}
                placeholder={t("profileEdit.campusNone")}
                campuses={campuses}
            />

            <MajorRow
                control={control}
                label={t("profile.academic.fields.majorFromCatalog")}
                placeholder={t("profileEdit.majorNone")}
                hint={t("profileEdit.majorHint")}
                emptyHint={t("profileEdit.majorEmptyHint")}
                majors={majors}
            />

            <TextRow
                control={control}
                name="linkedinUrl"
                label={t("profileEdit.linkedinUrl")}
                placeholder={t("profileEdit.linkedinUrlPlaceholder")}
            />
            <TextRow
                control={control}
                name="websiteUrl"
                label={t("profileEdit.websiteUrl")}
                placeholder={t("profileEdit.websiteUrlPlaceholder")}
            />

            <div className="flex justify-end">
                <Button type="submit" variant="primary" isPending={formState.isSubmitting} isDisabled={formState.isSubmitting}>
                    {t("profileEdit.save")}
                </Button>
            </div>
        </form>
    )
}

export default EditProfilePage
