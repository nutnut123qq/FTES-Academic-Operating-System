"use client"

import { Sliders as SlidersHorizontalIcon } from "@gravity-ui/icons"
import React, { useMemo } from "react"
import {
    Autocomplete,
    Button,
    cn,
    InputGroup,
    Label,
    ListBox,
    SearchField,
    TextField,
} from "@heroui/react"

import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"


/** One selectable row in the autocomplete list (demo data until search is API-driven). */
interface SearchSuggestionItem {
    /** Stable key forwarded to `ListBox.Item` `id`. */
    id: string
    /** i18n key under `search.suggestions`. */
    messageKey: string
}

/**
 * Props for the search bar.
 */
export interface SearchBarProps extends WithClassNames<undefined> {
    /** Optional class names on the root `TextField` wrapper. */
    className?: string
}

/**
 * Search field using HeroUI `TextField` + `InputGroup` with an `Autocomplete` on the left
 * and a filters icon button in the suffix (same composition pattern as InputGroup + suffix).
 *
 * @param props.className — Merged onto the root `TextField`.
 */
export const SearchBar = ({ className }: SearchBarProps) => {
    const t = useTranslations()

    const suggestionItems = useMemo<Array<SearchSuggestionItem>>(
        () => [
            { id: "courses", messageKey: "search.suggestions.courses" },
            { id: "modules", messageKey: "search.suggestions.modules" },
            { id: "videos", messageKey: "search.suggestions.videos" },
        ],
        []
    )

    return (
        <TextField className={cn("w-full", className)} fullWidth variant="secondary">
            <Label className="sr-only">{t("search.label")}</Label>
            <InputGroup className="w-full" variant="secondary">
                <div className="min-w-0 flex-1">
                    <Autocomplete
                        allowsEmptyCollection
                        className="w-full"
                        fullWidth
                        placeholder={t("search.placeholder")}
                        variant="secondary"
                    >
                        <Autocomplete.Trigger className="flex h-10 w-full min-w-0 items-center gap-1.5 rounded-r-none border-0 bg-transparent px-3 shadow-none ring-0">
                            <Autocomplete.Value />
                            <Autocomplete.ClearButton />
                            <Autocomplete.Indicator />
                        </Autocomplete.Trigger>
                        <Autocomplete.Popover>
                            <Autocomplete.Filter>
                                <SearchField className="px-2 pt-2">
                                    <SearchField.Group>
                                        <SearchField.SearchIcon />
                                        <SearchField.Input placeholder={t("search.placeholder")} />
                                    </SearchField.Group>
                                </SearchField>
                                <ListBox className="max-h-60 overflow-auto p-1">
                                    {suggestionItems.map((item) => (
                                        <ListBox.Item
                                            key={item.id}
                                            id={item.id}
                                            textValue={t(item.messageKey)}
                                        >
                                            {t(item.messageKey)}
                                        </ListBox.Item>
                                    ))}
                                </ListBox>
                            </Autocomplete.Filter>
                        </Autocomplete.Popover>
                    </Autocomplete>
                </div>
                <InputGroup.Suffix className="pr-0">
                    <Button
                        aria-label={t("search.filtersAria")}
                        isIconOnly
                        size="sm"
                        variant="ghost"
                    >
                        <SlidersHorizontalIcon className="size-5" />
                    </Button>
                </InputGroup.Suffix>
            </InputGroup>
        </TextField>
    )
}
