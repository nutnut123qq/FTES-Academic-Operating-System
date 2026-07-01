import { configureStore } from "@reduxjs/toolkit"
import {
    tabsReducer,
    stateReducer,
    courseReducer,
    userReducer,
    modalReducer,
    moduleReducer,
    contentReducer,
    challengeReducer,
    lessonVideoReducer,
    livestreamSessionReducer,
    submissionAttemptReducer,
    submissionFeedbackReducer,
    sidebarReducer,
    socketIoReducer,
    systemReducer,
    jobReducer,
    keycloakReducer,
    searchReducer,
    adminReducer,
    personalProjectTaskReducer,
    milestoneReducer,
    aiModelsReducer,
    publicContentReducer,
    cvUrlReducer,
    cvReviewLevelReducer,
    templateCvsReducer,
    cvSubmissionAttemptAnalysisReducer,
    foundationReducer,
    headhunterReducer,
} from "./slices"

/**
 * The central Redux store. Registers all feature slice reducers.
 * `serializableCheck` is disabled to allow non-serializable values where needed.
 */
export const store = configureStore({
    reducer: {
        tabs: tabsReducer,
        state: stateReducer,
        course: courseReducer,
        user: userReducer,
        modal: modalReducer,
        module: moduleReducer,
        content: contentReducer,
        challenge: challengeReducer,
        lessonVideo: lessonVideoReducer,
        livestreamSession: livestreamSessionReducer,
        submissionAttempt: submissionAttemptReducer,
        submissionFeedback: submissionFeedbackReducer,
        sidebar: sidebarReducer,
        socketIo: socketIoReducer,
        system: systemReducer,
        job: jobReducer,
        keycloak: keycloakReducer,
        search: searchReducer,
        admin: adminReducer,
        personalProjectTask: personalProjectTaskReducer,
        milestone: milestoneReducer,
        aiModels: aiModelsReducer,
        publicContent: publicContentReducer,
        cvUrl: cvUrlReducer,
        cvReviewLevel: cvReviewLevelReducer,
        templateCvs: templateCvsReducer,
        cvSubmissionAttemptAnalysis: cvSubmissionAttemptAnalysisReducer,
        foundation: foundationReducer,
        headhunter: headhunterReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false,
    }),
})

/** Inferred root state type — use with `useAppSelector`. */
export type RootState = ReturnType<typeof store.getState>;
/** Inferred dispatch type — use with `useAppDispatch`. */
export type AppDispatch = typeof store.dispatch;
/** The configured store type. */
export type AppStore = typeof store;
