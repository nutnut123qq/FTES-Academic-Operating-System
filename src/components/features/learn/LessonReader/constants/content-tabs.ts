import { ContentTab } from "@/redux/slices/tabs"

/**
 * Content detail tabs hidden for SCHEMA V2 lessons (`verified` set).
 * Code explainings are inlined in the per-language markdown body instead.
 */
export const SCHEMA_V2_HIDDEN_CONTENT_TABS: Array<ContentTab> = [
    ContentTab.CodeExplainings,
    ContentTab.LessonVideos,
    ContentTab.CodeImplementation,
]

/**
 * @param tab - Active or requested content tab.
 * @returns True when the tab must not be shown on SCHEMA V2 content.
 */
export const isSchemaV2HiddenContentTab = (tab: ContentTab): boolean =>
    SCHEMA_V2_HIDDEN_CONTENT_TABS.includes(tab)
