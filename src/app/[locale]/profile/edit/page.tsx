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
    Switch,
    TextField,
    Typography,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import { Controller, type Control } from "react-hook-form"
import { CameraIcon } from "@phosphor-icons/react"
import { useEditProfileForm, type EditProfileFormValues } from "@/hooks/rhf/useEditProfileForm"
import { WorkMode } from "@/modules/types/enums/work-mode"

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

/** A labeled toggle row for a boolean form field. */
const SwitchRow = ({
    control,
    name,
    label,
    hint,
}: {
    control: Control<EditProfileFormValues>
    name: "profileLocked" | "openToWork"
    label: string
    hint: string
}) => (
    <Controller
        control={control}
        name={name}
        render={({ field }) => (
            <div className="flex items-start justify-between gap-4 rounded-2xl border border-separator p-4">
                <div className="flex min-w-0 flex-col gap-1">
                    <Typography type="body-sm" weight="medium">
                        {label}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                        {hint}
                    </Typography>
                </div>
                <Switch isSelected={field.value} onChange={field.onChange} aria-label={label}>
                    <Switch.Control>
                        <Switch.Thumb />
                    </Switch.Control>
                </Switch>
            </div>
        )}
    />
)

const WORK_MODES: ReadonlyArray<WorkMode> = [WorkMode.Remote, WorkMode.Hybrid, WorkMode.Onsite]

/**
 * `/profile/edit` — edit-profile form. Reuses {@link useEditProfileForm} (the
 * real `updateProfile` GraphQL + avatar presigned-upload flow, seeded from the
 * redux auth user). FE surface only: without a signed-in user + backend the
 * fields seed empty and Save cannot persist.
 */
const EditProfilePage = () => {
    const t = useTranslations()
    const { control, formState, onSubmit, fileInputRef, onPickAvatar, onAvatarChange, shownAvatar } =
        useEditProfileForm()

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

            {/* work mode */}
            <Controller
                control={control}
                name="workMode"
                render={({ field }) => (
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="edit-workMode" className="text-sm">
                            {t("profileEdit.workMode")}
                        </Label>
                        <select
                            id="edit-workMode"
                            name={field.name}
                            ref={field.ref}
                            value={field.value}
                            onChange={(event) => field.onChange(event.target.value)}
                            onBlur={field.onBlur}
                            className="rounded-xl border border-separator bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                        >
                            <option value="">{t("profileEdit.workModeNone")}</option>
                            {WORK_MODES.map((mode) => (
                                <option key={mode} value={mode}>
                                    {t(`publicProfile.workMode.${mode}`)}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
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

            {/* toggles */}
            <SwitchRow
                control={control}
                name="openToWork"
                label={t("profileEdit.openToWork")}
                hint={t("profileEdit.openToWorkHint")}
            />
            <SwitchRow
                control={control}
                name="profileLocked"
                label={t("profileEdit.lockProfile")}
                hint={t("profileEdit.lockProfileHint")}
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
