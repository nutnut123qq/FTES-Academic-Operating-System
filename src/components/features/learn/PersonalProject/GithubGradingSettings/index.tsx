"use client"

import React, { useState } from "react"
import {
    Button,
    cn,
    FieldError,
    Input,
    Label,
    Spinner,
    Tabs,
    TextField,
    Typography,
} from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { AutosaveStatus } from "../PersonalProjectSubmission"
import { GradeModelDropdown } from "@/components/blocks/grading/GradeModelDropdown"
import { AiModelCategory } from "@/modules/api/graphql/queries/query-ai-models"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { usePersonalProjectGithubForm } from "@/hooks/zustand/personalProjectGithub/usePersonalProjectGithubForm"

/** Props for {@link GithubGradingSettings}. */
export type GithubGradingSettingsProps = WithClassNames<undefined>

/**
 * Set-once grading config for the personal project — rendered inside the panel's settings Drawer
 * (progressive disclosure): the grading language, the branch to evaluate, and the optional
 * private-repo token. Reads the SHARED store but does NOT enable sync — the panel's
 * {@link import("../PersonalProjectSubmission").PersonalProjectSubmission} owns the debounced
 * url/branch sync, so the autosave status shown here comes from the same store.
 * @param props - {@link GithubGradingSettingsProps}
 */
export const GithubGradingSettings = ({ className }: GithubGradingSettingsProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const {
        branch,
        lang,
        errors,
        touched,
        autosaveStatus,
        gradeModels,
        gradeSelection,
        canPremium,
        setGradeSelection,
        setBranch,
        setLang,
        setTouchedBranch,
        setBranchError,
        saveGithubToken,
        clearGithubToken,
        tokenSaveStatus,
    } = usePersonalProjectGithubForm()
    /** Local write-only buffer for the private-repo token (never prefilled). */
    const [tokenInput, setTokenInput] = useState("")
    const isSavingToken = tokenSaveStatus === "saving"
    /** Languages the submission can be graded against (V2 per-language approach criteria). */
    const langOptions = [
        { id: "typescript", label: t("programmingLanguage.typescript") },
        { id: "java", label: t("programmingLanguage.java") },
        { id: "csharp", label: t("programmingLanguage.csharp") },
        { id: "go", label: t("programmingLanguage.go") },
    ]
    const branchInvalid = Boolean(touched.branch && errors.branch)

    return (
        <div className={cn("flex flex-col gap-6", className)}>
            <div className="flex flex-col gap-2">
                <Label>{t("finalProject.page.submitGithub.langFieldTitle")}</Label>
                <Tabs
                    selectedKey={lang}
                    variant="primary"
                    className="w-fit"
                    onSelectionChange={(key) => setLang(String(key))}
                >
                    <Tabs.ListContainer>
                        <Tabs.List aria-label={t("finalProject.page.submitGithub.langFieldTitle")}>
                            {langOptions.map((option) => (
                                <Tabs.Tab key={option.id} id={option.id}>
                                    {option.label}
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                            ))}
                        </Tabs.List>
                    </Tabs.ListContainer>
                </Tabs>
                <Typography type="body-sm" color="muted">
                    {t("finalProject.page.submitGithub.langFieldHint")}
                </Typography>
            </div>
            <div className="flex flex-col gap-2">
                <Label>{t("finalProject.page.submitGithub.modelFieldTitle")}</Label>
                <GradeModelDropdown
                    models={gradeModels}
                    selection={gradeSelection}
                    canPremium={canPremium}
                    showAutoLane={false}
                    floor={AiModelCategory.Economy}
                    onSelect={setGradeSelection}
                    onUpgrade={() => router.push(`/${locale}/profile/settings/ai-subscription`)}
                />
                <Typography type="body-sm" color="muted">
                    {t("finalProject.page.submitGithub.modelFieldHint")}
                </Typography>
            </div>
            <div className="flex flex-col gap-2">
                <Label>{t("finalProject.page.submitGithub.branchFieldTitle")}</Label>
                <TextField variant="secondary" isInvalid={branchInvalid} className="w-full">
                    <Input
                        className="w-full"
                        placeholder={t("finalProject.page.submitGithub.branchPlaceholder")}
                        name="branch"
                        value={branch}
                        onChange={(event) => setBranch(event.target.value)}
                        onBlur={() => setTouchedBranch(true)}
                    />
                    <FieldError>{errors.branch}</FieldError>
                </TextField>
                {/* autosave status + reset on ONE row so the button sits right under the field */}
                <div className="flex items-center justify-between gap-2">
                    <AutosaveStatus status={autosaveStatus.branch} />
                    <Button
                        variant="secondary"
                        size="sm"
                        isDisabled={autosaveStatus.branch === "saving"}
                        onPress={() => {
                            setBranch("main")
                            setBranchError(null)
                        }}
                    >
                        {t("finalProject.page.submitGithub.resetButton")}
                    </Button>
                </div>
            </div>
            {/* private repo (optional): a write-only GitHub token, encrypted server-side. Only needed
                when the repo is private — public repos grade with the org token. */}
            <div className="flex flex-col gap-2">
                <Label>{t("finalProject.page.submitGithub.privateTokenFieldTitle")}</Label>
                <TextField variant="secondary" className="w-full">
                    <Input
                        className="w-full"
                        type="password"
                        autoComplete="off"
                        placeholder={t("finalProject.page.submitGithub.privateTokenPlaceholder")}
                        name="githubToken"
                        value={tokenInput}
                        onChange={(event) => setTokenInput(event.target.value)}
                    />
                </TextField>
                <Typography type="body-sm" color="muted">
                    {t("finalProject.page.submitGithub.privateTokenHint")}
                </Typography>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="secondary"
                        isPending={isSavingToken}
                        isDisabled={isSavingToken || tokenInput.trim().length === 0}
                        onPress={() => {
                            void saveGithubToken(tokenInput).then(() => setTokenInput(""))
                        }}
                    >
                        {({ isPending }) => (
                            <>
                                {isPending ? <Spinner size="sm" color="current" /> : null}
                                {t("finalProject.page.submitGithub.privateTokenSaveButton")}
                            </>
                        )}
                    </Button>
                    <Button
                        variant="tertiary"
                        isDisabled={isSavingToken}
                        onPress={() => {
                            void clearGithubToken().then(() => setTokenInput(""))
                        }}
                    >
                        {t("finalProject.page.submitGithub.privateTokenRemoveButton")}
                    </Button>
                </div>
            </div>
        </div>
    )
}
