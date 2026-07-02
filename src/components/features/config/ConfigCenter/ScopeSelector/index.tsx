"use client"

import React from "react"
import {
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownPopover,
    DropdownTrigger,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import { CaretDownIcon, GlobeIcon } from "@phosphor-icons/react"
import { CONFIG_SCOPES } from "@/resources/constants/config"
import type { ConfigScope } from "@/resources/constants/config"
import { useConfigStore } from "@/hooks/zustand/config"

/** i18n key (under `admin.config.scope`) per scope. */
const SCOPE_LABEL_KEY: Record<ConfigScope, string> = {
    global: "admin.config.scope.global",
    production: "admin.config.scope.production",
    staging: "admin.config.scope.staging",
}

/**
 * ScopeSelector — the Global / Production / Staging picker at the top of the
 * Config Center shell. A forward-looking STUB: only `Global` carries real data;
 * picking an environment swaps the panel for a "coming soon" state (the shell
 * owns that branch). Selection persists in the config store.
 */
export const ScopeSelector = () => {
    const t = useTranslations()
    const scope = useConfigStore((state) => state.scope)
    const setScope = useConfigStore((state) => state.setScope)

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-muted" id="config-scope-label">
                {t("admin.config.scope.label")}
            </span>
            <Dropdown>
                <DropdownTrigger
                    aria-labelledby="config-scope-label"
                    className="cursor-pointer rounded-large border border-separator px-3 py-2"
                >
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <GlobeIcon aria-hidden focusable="false" className="size-4" />
                        {t(SCOPE_LABEL_KEY[scope])}
                        <CaretDownIcon aria-hidden focusable="false" className="size-4" />
                    </div>
                </DropdownTrigger>
                <DropdownPopover className="min-w-48">
                    <DropdownMenu aria-label={t("admin.config.scope.label")}>
                        {CONFIG_SCOPES.map((option) => (
                            <DropdownItem
                                key={option}
                                textValue={t(SCOPE_LABEL_KEY[option])}
                                onPress={() => setScope(option)}
                            >
                                {t(SCOPE_LABEL_KEY[option])}
                            </DropdownItem>
                        ))}
                    </DropdownMenu>
                </DropdownPopover>
            </Dropdown>
        </div>
    )
}
