import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

/**
 * The tabs for the authentication modal.
 */
export enum AuthenticationModalTab {
    SignIn = "signIn",
    SignUp = "signUp",
}

/**
 * The tabs for the learn page.
 */
export enum LearnTab {
    LessonVideos = "lessonVideos",
    Contents = "contents",
    Challenges = "challenges",
    TopAchievers = "topAchievers",
}

/**
 * The tabs for the content detail view.
 */
/**
 * Tabs inside the AI quota modal.
 */
export enum AiQuotaTab {
    Auto = "auto",
    Subscription = "subscription",
    History = "history",
}

export enum ContentTab {
    Content = "content",
    /** Code explaining + implementations (replaces legacy lesson videos tab). */
    CodeExplainings = "codeExplainings",
    /** @deprecated Use `CodeExplainings`. */
    LessonVideos = "lessonVideos",
    /** @deprecated Merged into `CodeExplainings`. */
    CodeImplementation = "codeImplementation",
    Challenges = "challenges",
    /** Live Sandpack sandbox — shown when content.isSandbox is true. */
    Sandbox = "sandbox",
    /** AI Lab playground — shown when the lesson has a backing AI Lab playground. */
    AILab = "aiLab",
    /** E2E test proof — shown when content.e2eFlows has captured flows. */
    E2e = "e2e",
}

/**
 * UI tab selection state (authentication modal, learn page, content detail).
 */
export interface TabsSlice {
    /** Currently active tab in the authentication modal. */
    authenticationModalTab: AuthenticationModalTab
    /** Currently active tab on the Learn page. */
    learnTab: LearnTab
    /** Currently active tab in the content detail view. */
    contentTab: ContentTab
    /** Currently active tab in the AI quota modal. */
    aiQuotaTab: AiQuotaTab
}

/**
 * The initial state of the authentication modal slice.
 */
const initialState: TabsSlice = {
    authenticationModalTab: AuthenticationModalTab.SignIn,
    learnTab: LearnTab.LessonVideos,
    contentTab: ContentTab.Content,
    aiQuotaTab: AiQuotaTab.Auto,
}

/**
 * Slice managing which tab is active in the auth modal, learn page, and content detail view.
 */
export const tabsSlice = createSlice({
    name: "tabs",
    initialState,
    reducers: {
        /** Set the active tab in the authentication modal. */
        setAuthenticationModalTab: (
            state,
            action: PayloadAction<AuthenticationModalTab>
        ) => {
            state.authenticationModalTab = action.payload
        },
        /** Reset the authentication modal tab to Sign In. */
        resetAuthenticationModalTab: (state) => {
            state.authenticationModalTab = AuthenticationModalTab.SignIn
        },
        /** Set the active tab on the Learn page. */
        setLearnTab: (
            state,
            action: PayloadAction<LearnTab>
        ) => {
            state.learnTab = action.payload
        },
        /** Reset the Learn page tab to Lesson Videos. */
        resetLearnTab: (state) => {
            state.learnTab = LearnTab.LessonVideos
        },
        /** Set the active tab in the content detail view. */
        setContentTab: (
            state,
            action: PayloadAction<ContentTab>
        ) => {
            state.contentTab = action.payload
        },
        /** Reset the content detail tab to Content. */
        resetContentTab: (state) => {
            state.contentTab = ContentTab.Content
        },
        /** Set the active tab in the AI quota modal. */
        setAiQuotaTab: (
            state,
            action: PayloadAction<AiQuotaTab>,
        ) => {
            state.aiQuotaTab = action.payload
        },
        /** Reset the AI quota modal tab to Auto. */
        resetAiQuotaTab: (state) => {
            state.aiQuotaTab = AiQuotaTab.Auto
        },
    },
})

/** Root reducer for the tabs slice. */
export const tabsReducer = tabsSlice.reducer

/** Actions exported from the tabs slice. */
export const {
    setAuthenticationModalTab,
    resetAuthenticationModalTab,
    setLearnTab,
    resetLearnTab,
    setContentTab,
    resetContentTab,
    setAiQuotaTab,
    resetAiQuotaTab,
} = tabsSlice.actions
