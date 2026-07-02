"use client"

import React from "react"
import type { Selection } from "@heroui/react"
import { Button, Dropdown, Label } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CaretDownIcon } from "@phosphor-icons/react"
import { SearchInput } from "@/components/reuseable/SearchInput"
import type { AdminRole, UserStatus } from "@/resources/constants/admin"

const ROLE_KEYS: Array<AdminRole> = ["member", "moderator", "admin", "superAdmin"]
const STATUS_KEYS: Array<UserStatus> = ["active", "suspended", "banned"]

/** Props for {@link UserFilterBar}. */
export interface UserFilterBarProps {
    /** Free-text query (controlled). */
    query: string
    onQueryChange: (query: string) => void
    /** Active role filter (`undefined` = all). */
    role: AdminRole | undefined
    onRoleChange: (role: AdminRole | undefined) => void
    /** Active status filter (`undefined` = all). */
    status: UserStatus | undefined
    onStatusChange: (status: UserStatus | undefined) => void
}

/** Single-select filter dropdown with an "all" row that clears the filter. */
const FilterDropdown = <T extends string>({
    label,
    allLabel,
    keys,
    value,
    onChange,
    optionLabel,
}: {
    /** Accessible label naming what the dropdown filters. */
    label: string
    /** Label of the clear-filter row. */
    allLabel: string
    keys: Array<T>
    value: T | undefined
    onChange: (value: T | undefined) => void
    /** Resolves the localized label for one option. */
    optionLabel: (key: T) => string
}) => {
    const onSelectionChange = (selection: Selection) => {
        if (selection === "all") return
        const next = [...selection][0]
        onChange(next === "__all" ? undefined : (String(next) as T))
    }
    return (
        <Dropdown>
            <Button variant="secondary" aria-label={label}>
                {value ? optionLabel(value) : allLabel}
                <CaretDownIcon className="size-4" aria-hidden focusable="false" />
            </Button>
            <Dropdown.Popover>
                <Dropdown.Menu
                    selectionMode="single"
                    selectedKeys={new Set([value ?? "__all"])}
                    onSelectionChange={onSelectionChange}
                >
                    <Dropdown.Section>
                        <Dropdown.Item key="__all" id="__all" textValue={allLabel}>
                            <Dropdown.ItemIndicator />
                            <Label>{allLabel}</Label>
                        </Dropdown.Item>
                        {keys.map((key) => (
                            <Dropdown.Item key={key} id={key} textValue={optionLabel(key)}>
                                <Dropdown.ItemIndicator />
                                <Label>{optionLabel(key)}</Label>
                            </Dropdown.Item>
                        ))}
                    </Dropdown.Section>
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown>
    )
}

/**
 * Search + role/status filter row for the user list. Controlled — the page owns
 * the filter state and feeds it to `useQueryAdminUsersSwr`.
 */
export const UserFilterBar = ({
    query,
    onQueryChange,
    role,
    onRoleChange,
    status,
    onStatusChange,
}: UserFilterBarProps) => {
    const t = useTranslations()
    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchInput
                value={query}
                onValueChange={onQueryChange}
                placeholder={t("admin.users.searchPlaceholder")}
                variant="secondary"
            />
            <div className="flex gap-2">
                <FilterDropdown
                    label={t("admin.users.filterRole")}
                    allLabel={t("admin.users.allRoles")}
                    keys={ROLE_KEYS}
                    value={role}
                    onChange={onRoleChange}
                    optionLabel={(key) => t(`admin.roles.${key}`)}
                />
                <FilterDropdown
                    label={t("admin.users.filterStatus")}
                    allLabel={t("admin.users.allStatuses")}
                    keys={STATUS_KEYS}
                    value={status}
                    onChange={onStatusChange}
                    optionLabel={(key) => t(`admin.users.status.${key}`)}
                />
            </div>
        </div>
    )
}
