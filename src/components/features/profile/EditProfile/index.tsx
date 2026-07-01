"use client"

import React from "react"
import {
    Button,
    Checkbox,
    Input,
    Label,
    ListBox,
    Select,
    Spinner,
    TextArea,
    TextField,
    Typography,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    SettingsBreadcrumb,
} from "../Settings/SettingsBreadcrumb"
import {
    AvatarUploadModal,
} from "./AvatarUploadModal"
import { useAppSelector } from "@/redux/hooks"
import { useAvatarUploadOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useEditProfileForm } from "@/hooks/rhf/useEditProfileForm"
import { AvatarUploadButton } from "@/components/blocks/identity/AvatarUploadButton"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
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
/** Sentinel key for the "no preference" work-mode option (maps to the empty form value). */
const WORK_MODE_NONE = "none"
/** Work-mode options + their i18n label keys (under `publicProfile.workMode`). */
const WORK_MODE_OPTIONS = [
    { value: WorkMode.Remote, labelKey: "publicProfile.workMode.remote" },
    { value: WorkMode.Hybrid, labelKey: "publicProfile.workMode.hybrid" },
    { value: WorkMode.Onsite, labelKey: "publicProfile.workMode.onsite" },
] as const

/**
 * Edit-profile feature container.
 *
 * Owns only the page chrome (breadcrumb + header) and the field markup — the form
 * itself (values, avatar file, validation, submit) lives in the `useEditProfileForm`
 * react-hook-form hook (per the form pattern; no scattered local state). On save the
 * hook uploads a freshly picked avatar then persists the text fields + lock flag and
 * pushes the fresh user into redux. Mounted by `/profile/edit`.
 */
export const EditProfile = () => {
    const t = useTranslations()
    const user = useAppSelector((state) => state.user.user)

    // the form (values + avatar file + submit) is owned by the RHF hook
    const {
        watch,
        setValue,
        onSubmit,
        formState: {
            isSubmitting,
        },
        onAvatarFile,
        shownAvatar,
    } = useEditProfileForm()
    // avatar-upload modal (dropzone) open-state — shared zustand overlay
    const { open: openAvatarUpload } = useAvatarUploadOverlayState()

    // controlled bindings read straight from the form state (no component useState)
    const displayName = watch("displayName")
    const bio = watch("bio")
    const profileLocked = watch("profileLocked")
    const openToWork = watch("openToWork")
    const roleTitle = watch("roleTitle")
    const location = watch("location")
    const workMode = watch("workMode")
    const linkedinUrl = watch("linkedinUrl")
    const websiteUrl = watch("websiteUrl")

    // signed-out guard
    if (!user) {
        return (
            <div className="flex flex-col items-center gap-2 py-12">
                <Typography type="h5" weight="semibold" align="center">
                    {t("profile.signedOut.title")}
                </Typography>
                <Typography type="body-sm" color="muted" align="center">
                    {t("profile.signedOut.desc")}
                </Typography>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-10">
            <PageHeader
                breadcrumb={<SettingsBreadcrumb current={t("profileEdit.title")} />}
                title={t("profileEdit.title")}
                description={t("profileEdit.subtitle")}
            />
            <div className="flex flex-col gap-6">

                {/* avatar — face + change button; the button opens the upload modal (dropzone) */}
                <div className="flex items-center gap-3">
                    <AvatarUploadButton
                        avatar={shownAvatar}
                        displayName={user.displayName ?? user.username}
                        seed={user.email ?? user.username}
                        label={t("profileEdit.changeAvatar")}
                        onPress={openAvatarUpload}
                    />
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onPress={openAvatarUpload}
                        >
                            {t("profileEdit.changeAvatar")}
                        </Button>
                        <Typography type="body-xs" color="muted">
                            {t("profileEdit.avatarHint")}
                        </Typography>
                    </div>
                </div>
                <AvatarUploadModal onFile={onAvatarFile} />

                {/* display name */}
                <TextField variant="secondary">
                    <Label htmlFor="profile-display-name">{t("profileEdit.displayName")}</Label>
                    <Input
                        id="profile-display-name"
                        placeholder={user.username}
                        maxLength={DISPLAY_NAME_MAX}
                        value={displayName}
                        onChange={(event) => setValue("displayName", event.target.value)}
                    />
                </TextField>

                {/* bio */}
                <TextField variant="secondary">
                    <Label htmlFor="profile-bio">{t("profileEdit.bio")}</Label>
                    <TextArea
                        id="profile-bio"
                        rows={3}
                        placeholder={t("profileEdit.bioPlaceholder")}
                        maxLength={BIO_MAX}
                        value={bio}
                        onChange={(event) => setValue("bio", event.target.value)}
                        className="resize-none"
                    />
                    <Typography slot="description" type="body-xs" color="muted" className="self-end">
                        {`${bio.length}/${BIO_MAX}`}
                    </Typography>
                </TextField>

                {/* role title (professional headline) */}
                <TextField variant="secondary">
                    <Label htmlFor="profile-role-title">{t("profileEdit.roleTitle")}</Label>
                    <Input
                        id="profile-role-title"
                        placeholder={t("profileEdit.roleTitlePlaceholder")}
                        maxLength={ROLE_TITLE_MAX}
                        value={roleTitle}
                        onChange={(event) => setValue("roleTitle", event.target.value)}
                    />
                </TextField>

                {/* location */}
                <TextField variant="secondary">
                    <Label htmlFor="profile-location">{t("profileEdit.location")}</Label>
                    <Input
                        id="profile-location"
                        placeholder={t("profileEdit.locationPlaceholder")}
                        maxLength={LOCATION_MAX}
                        value={location}
                        onChange={(event) => setValue("location", event.target.value)}
                    />
                </TextField>

                {/* preferred work mode */}
                <div className="flex flex-col gap-2">
                    <Label htmlFor="profile-work-mode">{t("profileEdit.workMode")}</Label>
                    <Select.Root<{ id: string }, "single">
                        id="profile-work-mode"
                        aria-label={t("profileEdit.workMode")}
                        selectedKey={workMode === "" ? WORK_MODE_NONE : workMode}
                        onSelectionChange={(key) =>
                            setValue(
                                "workMode",
                                key === WORK_MODE_NONE ? "" : (String(key) as WorkMode),
                            )
                        }
                    >
                        <Select.Trigger aria-label={t("profileEdit.workMode")}>
                            <Select.Value>
                                {() => {
                                    const found = WORK_MODE_OPTIONS.find(
                                        (option) => option.value === workMode,
                                    )
                                    return (
                                        <Typography type="body-sm">
                                            {found ? t(found.labelKey) : t("profileEdit.workModeNone")}
                                        </Typography>
                                    )
                                }}
                            </Select.Value>
                            <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                            <ListBox.Root aria-label={t("profileEdit.workMode")}>
                                <ListBox.Item
                                    id={WORK_MODE_NONE}
                                    textValue={t("profileEdit.workModeNone")}
                                >
                                    {t("profileEdit.workModeNone")}
                                </ListBox.Item>
                                {WORK_MODE_OPTIONS.map((option) => (
                                    <ListBox.Item
                                        key={option.value}
                                        id={option.value}
                                        textValue={t(option.labelKey)}
                                    >
                                        {t(option.labelKey)}
                                    </ListBox.Item>
                                ))}
                            </ListBox.Root>
                        </Select.Popover>
                    </Select.Root>
                </div>

                {/* LinkedIn URL */}
                <TextField variant="secondary">
                    <Label htmlFor="profile-linkedin">{t("profileEdit.linkedinUrl")}</Label>
                    <Input
                        id="profile-linkedin"
                        type="url"
                        inputMode="url"
                        placeholder={t("profileEdit.linkedinUrlPlaceholder")}
                        maxLength={URL_MAX}
                        value={linkedinUrl}
                        onChange={(event) => setValue("linkedinUrl", event.target.value)}
                    />
                </TextField>

                {/* website URL */}
                <TextField variant="secondary">
                    <Label htmlFor="profile-website">{t("profileEdit.websiteUrl")}</Label>
                    <Input
                        id="profile-website"
                        type="url"
                        inputMode="url"
                        placeholder={t("profileEdit.websiteUrlPlaceholder")}
                        maxLength={URL_MAX}
                        value={websiteUrl}
                        onChange={(event) => setValue("websiteUrl", event.target.value)}
                    />
                </TextField>

                {/* privacy: lock profile (FB-style) */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-0">
                        <Label htmlFor="profile-locked">{t("profileEdit.lockProfile")}</Label>
                        <Typography type="body-xs" color="muted">
                            {t("profileEdit.lockProfileHint")}
                        </Typography>
                    </div>
                    <Checkbox
                        id="profile-locked"
                        className="shrink-0"
                        isSelected={profileLocked}
                        onChange={(selected) => setValue("profileLocked", selected)}
                        aria-label={t("profileEdit.lockProfile")}
                    >
                        <Checkbox.Content>
                            <Checkbox.Control>
                                <Checkbox.Indicator />
                            </Checkbox.Control>
                        </Checkbox.Content>
                    </Checkbox>
                </div>

                {/* hiring: open to work */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-0">
                        <Label htmlFor="profile-open-to-work">{t("profileEdit.openToWork")}</Label>
                        <Typography type="body-xs" color="muted">
                            {t("profileEdit.openToWorkHint")}
                        </Typography>
                    </div>
                    <Checkbox
                        id="profile-open-to-work"
                        className="shrink-0"
                        isSelected={openToWork}
                        onChange={(selected) => setValue("openToWork", selected)}
                        aria-label={t("profileEdit.openToWork")}
                    >
                        <Checkbox.Content>
                            <Checkbox.Control>
                                <Checkbox.Indicator />
                            </Checkbox.Control>
                        </Checkbox.Content>
                    </Checkbox>
                </div>

                <Button
                    variant="primary"
                    className="self-end"
                    isDisabled={isSubmitting}
                    isPending={isSubmitting}
                    onPress={() => onSubmit()}
                >
                    {({ isPending }) => (
                        <>
                            {isPending ? (
                                <Spinner
                                    color="current"
                                    size="sm"
                                />
                            ) : null}
                            {t("profileEdit.save")}
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
