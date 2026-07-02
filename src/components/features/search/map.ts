import {
    GraduationCapIcon,
    StackIcon,
    FileTextIcon,
    VideoIcon,
    CodeIcon,
    FlagIcon,
    ListChecksIcon,
    CardsIcon,
    UserIcon,
    ChatCircleIcon,
    UsersThreeIcon,
    BookmarkSimpleIcon,
    type Icon,
} from "@phosphor-icons/react"
import type { SearchCategoryKind, SearchEntityDescriptor } from "./types"

/**
 * Icon + i18n heading key for every search category (real entity groups + mock
 * community groups), keyed by kind. `labelKey` is a dotted key under the `search`
 * namespace (`t("search.groups.<kind>")`).
 */
export const SEARCH_CATEGORY_MAP: Record<SearchCategoryKind, SearchEntityDescriptor> = {
    courses: { kind: "courses", icon: GraduationCapIcon, labelKey: "search.groups.courses" },
    modules: { kind: "modules", icon: StackIcon, labelKey: "search.groups.modules" },
    contents: { kind: "contents", icon: FileTextIcon, labelKey: "search.groups.contents" },
    lessonVideos: { kind: "lessonVideos", icon: VideoIcon, labelKey: "search.groups.lessonVideos" },
    challenges: { kind: "challenges", icon: CodeIcon, labelKey: "search.groups.challenges" },
    milestones: { kind: "milestones", icon: FlagIcon, labelKey: "search.groups.milestones" },
    milestoneTasks: { kind: "milestoneTasks", icon: ListChecksIcon, labelKey: "search.groups.milestoneTasks" },
    flashcardDecks: { kind: "flashcardDecks", icon: CardsIcon, labelKey: "search.groups.flashcardDecks" },
    users: { kind: "users", icon: UserIcon, labelKey: "search.groups.users" },
    posts: { kind: "posts", icon: ChatCircleIcon, labelKey: "search.groups.posts" },
    groups: { kind: "groups", icon: UsersThreeIcon, labelKey: "search.groups.groups" },
    resources: { kind: "resources", icon: BookmarkSimpleIcon, labelKey: "search.groups.resources" },
}

/** Icon component for a category kind. */
export const searchCategoryIcon = (kind: SearchCategoryKind): Icon => SEARCH_CATEGORY_MAP[kind].icon
