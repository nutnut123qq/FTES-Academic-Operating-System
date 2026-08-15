import { restRequest } from "@/modules/api/rest/client"
import type {
    AddFlashcardCardsRequest,
    ChangeRoleRequest,
    CreateFlashcardDeckRequest,
    CreateLinkRequest,
    CreateSubjectRequest,
    FlashcardCardView,
    FlashcardDeckView,
    FlashcardDecksView,
    JoinResponse,
    LinkView,
    MajorView,
    MemberView,
    MyMembershipView,
    PageResponse,
    PracticeQuizResultView,
    PracticeQuizView,
    PrerequisiteView,
    RelatedView,
    ReplacePrerequisitesRequest,
    ReplaceRelatedRequest,
    ReviewFlashcardRequest,
    ReviewFlashcardResultView,
    StatisticsView,
    SubjectDetail,
    SubjectSummary,
    SubmitPracticeQuizRequest,
    UpdateFlashcardCardRequest,
    UpdateFlashcardDeckRequest,
    UpdateLinkRequest,
    UpdateSubjectRequest,
    WorkspaceView,
} from "./types"

// ---------------------------------------------------------------- catalog

/**
 * Lists subjects with optional filters.
 *
 * `GET /api/v1/subjects?semester=&difficulty=&q=&page=&size=`
 */
export const listSubjects = async (params?: {
    semester?: number | null
    difficulty?: string | null
    /**
     * Mã ngành (BE V335) — chỉ trả môn thuộc ngành đó. Bỏ trống = TẤT CẢ ngành.
     * Mã không có trong danh mục bị BE trả 400 (cố ý: để mã gõ sai không trông giống
     * "ngành này chưa có môn nào").
     */
    major?: string | null
    q?: string | null
    page?: number
    size?: number
}): Promise<PageResponse<SubjectSummary>> => {
    return restRequest<PageResponse<SubjectSummary>>({
        method: "GET",
        url: "/subjects",
        params: {
            semester: params?.semester ?? undefined,
            difficulty: params?.difficulty ?? undefined,
            major: params?.major ?? undefined,
            q: params?.q ?? undefined,
            page: params?.page ?? 0,
            size: params?.size ?? 20,
        },
        authenticated: false,
    })
}

/**
 * Danh mục NGÀNH HỌC (BE V335).
 *
 * `GET /api/v1/majors` — PUBLIC, không cần token: màn chọn ngành lúc đăng ký lần đầu gọi nó khi
 * người dùng chưa có gì trong hồ sơ.
 */
export const listMajors = async (): Promise<Array<MajorView>> => {
    return restRequest<Array<MajorView>>({
        method: "GET",
        url: "/majors",
        authenticated: false,
    })
}

/**
 * Creates a new subject.
 *
 * `POST /api/v1/subjects`
 */
export const createSubject = async (
    request: CreateSubjectRequest,
): Promise<SubjectDetail> => {
    return restRequest<SubjectDetail>({
        method: "POST",
        url: "/subjects",
        data: request,
    })
}

/**
 * Returns a single subject by code.
 *
 * `GET /api/v1/subjects/{code}`
 */
export const getSubjectDetail = async (code: string): Promise<SubjectDetail> => {
    return restRequest<SubjectDetail>({
        method: "GET",
        url: `/subjects/${code}`,
        authenticated: false,
    })
}

/**
 * Updates subject metadata.
 *
 * `PATCH /api/v1/subjects/{code}`
 */
export const updateSubject = async (
    code: string,
    request: UpdateSubjectRequest,
): Promise<SubjectDetail> => {
    return restRequest<SubjectDetail>({
        method: "PATCH",
        url: `/subjects/${code}`,
        data: request,
    })
}

/**
 * Publishes a subject.
 *
 * `POST /api/v1/subjects/{code}/publish`
 */
export const publishSubject = async (code: string): Promise<SubjectDetail> => {
    return restRequest<SubjectDetail>({
        method: "POST",
        url: `/subjects/${code}/publish`,
    })
}

/**
 * Archives a subject.
 *
 * `POST /api/v1/subjects/{code}/archive`
 */
export const archiveSubject = async (code: string): Promise<SubjectDetail> => {
    return restRequest<SubjectDetail>({
        method: "POST",
        url: `/subjects/${code}/archive`,
    })
}

/**
 * Replaces the prerequisite list of a subject.
 *
 * `PUT /api/v1/subjects/{code}/prerequisites`
 */
export const replaceSubjectPrerequisites = async (
    code: string,
    request: ReplacePrerequisitesRequest,
): Promise<Array<PrerequisiteView>> => {
    return restRequest<Array<PrerequisiteView>>({
        method: "PUT",
        url: `/subjects/${code}/prerequisites`,
        data: request,
    })
}

/**
 * Replaces the related-subject list of a subject.
 *
 * `PUT /api/v1/subjects/{code}/related`
 */
export const replaceSubjectRelated = async (
    code: string,
    request: ReplaceRelatedRequest,
): Promise<Array<RelatedView>> => {
    return restRequest<Array<RelatedView>>({
        method: "PUT",
        url: `/subjects/${code}/related`,
        data: request,
    })
}

// ---------------------------------------------------------------- workspace

/**
 * Returns the full workspace aggregate for a subject.
 *
 * `GET /api/v1/subjects/{code}/workspace`
 */
export const getSubjectWorkspace = async (
    code: string,
): Promise<WorkspaceView> => {
    return restRequest<WorkspaceView>({
        method: "GET",
        url: `/subjects/${code}/workspace`,
        authenticated: false,
    })
}

/**
 * Lists curated links for a subject, optionally filtered by tab.
 *
 * `GET /api/v1/subjects/{code}/links?tab=`
 */
export const getSubjectLinks = async (
    code: string,
    tab?: string | null,
): Promise<Array<LinkView>> => {
    return restRequest<Array<LinkView>>({
        method: "GET",
        url: `/subjects/${code}/links`,
        params: tab ? { tab } : undefined,
        authenticated: false,
    })
}

/**
 * Adds a curated link to a subject.
 *
 * `POST /api/v1/subjects/{code}/links`
 */
export const addSubjectLink = async (
    code: string,
    request: CreateLinkRequest,
): Promise<LinkView> => {
    return restRequest<LinkView>({
        method: "POST",
        url: `/subjects/${code}/links`,
        data: request,
    })
}

/**
 * Updates a curated link.
 *
 * `PATCH /api/v1/subjects/{code}/links/{id}`
 */
export const updateSubjectLink = async (
    code: string,
    id: string,
    request: UpdateLinkRequest,
): Promise<LinkView> => {
    return restRequest<LinkView>({
        method: "PATCH",
        url: `/subjects/${code}/links/${id}`,
        data: request,
    })
}

/**
 * Deletes a curated link.
 *
 * `DELETE /api/v1/subjects/{code}/links/{id}`
 */
export const deleteSubjectLink = async (
    code: string,
    id: string,
): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: `/subjects/${code}/links/${id}`,
    })
}

// ---------------------------------------------------------------- membership

/**
 * Lists the current user's subject memberships.
 *
 * `GET /api/v1/subjects/me`
 */
export const getMySubjects = async (): Promise<Array<MyMembershipView>> => {
    return restRequest<Array<MyMembershipView>>({
        method: "GET",
        url: "/subjects/me",
    })
}

/**
 * Joins a subject.
 *
 * `POST /api/v1/subjects/{code}/join`
 */
export const joinSubject = async (code: string): Promise<JoinResponse> => {
    return restRequest<JoinResponse>({
        method: "POST",
        url: `/subjects/${code}/join`,
    })
}

/**
 * Leaves a subject.
 *
 * `DELETE /api/v1/subjects/{code}/membership`
 */
export const leaveSubject = async (code: string): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: `/subjects/${code}/membership`,
    })
}

/**
 * Lists members of a subject.
 *
 * `GET /api/v1/subjects/{code}/members?role=&page=&size=`
 */
export const getSubjectMembers = async (
    code: string,
    params?: {
        role?: string | null
        page?: number
        size?: number
    },
): Promise<PageResponse<MemberView>> => {
    return restRequest<PageResponse<MemberView>>({
        method: "GET",
        url: `/subjects/${code}/members`,
        params: {
            role: params?.role ?? undefined,
            page: params?.page ?? 0,
            size: params?.size ?? 20,
        },
        authenticated: false,
    })
}

/**
 * Changes the role of a subject member.
 *
 * `PUT /api/v1/subjects/{code}/members/{userId}/role`
 */
export const changeSubjectMemberRole = async (
    code: string,
    userId: string,
    request: ChangeRoleRequest,
): Promise<void> => {
    return restRequest<void>({
        method: "PUT",
        url: `/subjects/${code}/members/${userId}/role`,
        data: request,
    })
}

/**
 * Bans a subject member.
 *
 * `POST /api/v1/subjects/{code}/members/{userId}/ban`
 */
export const banSubjectMember = async (
    code: string,
    userId: string,
): Promise<void> => {
    return restRequest<void>({
        method: "POST",
        url: `/subjects/${code}/members/${userId}/ban`,
    })
}

// ---------------------------------------------------------------- statistics

/**
 * Returns statistics for a subject.
 *
 * `GET /api/v1/subjects/{code}/statistics`
 */
export const getSubjectStatistics = async (
    code: string,
): Promise<StatisticsView> => {
    return restRequest<StatisticsView>({
        method: "GET",
        url: `/subjects/${code}/statistics`,
        authenticated: false,
    })
}

// ---------------------------------------------------------------- practice: quiz

/**
 * Draws random ready questions from the subject's question bank for a practice run —
 * WITHOUT the correct answers. Default 10, capped at 50 by the BE; a subject with no
 * ready questions answers `count: 0` + `questions: []` (render the empty state, not an
 * error). Authenticated: practice is always tied to a learner.
 *
 * `GET /api/v1/subjects/{code}/practice/quiz?count=N`
 */
export const getPracticeQuiz = async (
    code: string,
    params?: { count?: number },
): Promise<PracticeQuizView> => {
    return restRequest<PracticeQuizView>({
        method: "GET",
        url: `/subjects/${code}/practice/quiz`,
        params: { count: params?.count ?? undefined },
        authenticated: true,
    })
}

/**
 * Submits a practice attempt — graded server-side. Only the response carries
 * `correctKeys` + `explanation`. Nothing is written to the transcript, so retaking is
 * free.
 *
 * `POST /api/v1/subjects/{code}/practice/quiz/submit`
 */
export const submitPracticeQuiz = async (
    code: string,
    request: SubmitPracticeQuizRequest,
): Promise<PracticeQuizResultView> => {
    return restRequest<PracticeQuizResultView>({
        method: "POST",
        url: `/subjects/${code}/practice/quiz/submit`,
        data: request,
    })
}

// ---------------------------------------------------------------- practice: flashcards

/**
 * Returns every flashcard deck of a subject with all its cards AND the caller's SM-2
 * progress in one batched read — enough to run a whole review session offline of
 * further requests. `canManage` tells whether to show the deck/card CRUD affordances.
 *
 * `GET /api/v1/subjects/{code}/practice/flashcards`
 */
export const getSubjectFlashcards = async (
    code: string,
): Promise<FlashcardDecksView> => {
    return restRequest<FlashcardDecksView>({
        method: "GET",
        url: `/subjects/${code}/practice/flashcards`,
        authenticated: true,
    })
}

/**
 * Records one review of a card (self-grade 0..5). The server runs SM-2, persists the
 * new state and returns it together with the deck's remaining due count, so the badge
 * can be updated without refetching the deck.
 *
 * `POST /api/v1/subjects/{code}/practice/flashcards/{cardId}/review`
 */
export const reviewFlashcard = async (
    code: string,
    cardId: string,
    request: ReviewFlashcardRequest,
): Promise<ReviewFlashcardResultView> => {
    return restRequest<ReviewFlashcardResultView>({
        method: "POST",
        url: `/subjects/${code}/practice/flashcards/${cardId}/review`,
        data: request,
    })
}

// ------------------------------------------------- practice: flashcard CRUD (curators)

/**
 * Creates a deck, optionally with its cards in the same request (bulk import).
 * Requires curate rights on the subject (`FlashcardDecksView.canManage`) → `403`
 * otherwise.
 *
 * `POST /api/v1/subjects/{code}/practice/flashcards/decks`
 */
export const createFlashcardDeck = async (
    code: string,
    request: CreateFlashcardDeckRequest,
): Promise<FlashcardDeckView> => {
    return restRequest<FlashcardDeckView>({
        method: "POST",
        url: `/subjects/${code}/practice/flashcards/decks`,
        data: request,
    })
}

/**
 * Patches a deck — an omitted field keeps its current value.
 *
 * `PATCH /api/v1/subjects/{code}/practice/flashcards/decks/{deckId}`
 */
export const updateFlashcardDeck = async (
    code: string,
    deckId: string,
    request: UpdateFlashcardDeckRequest,
): Promise<FlashcardDeckView> => {
    return restRequest<FlashcardDeckView>({
        method: "PATCH",
        url: `/subjects/${code}/practice/flashcards/decks/${deckId}`,
        data: request,
    })
}

/**
 * Deletes a deck together with its cards and every learner's progress on them. Keep
 * the history instead by patching `status = ARCHIVED`.
 *
 * `DELETE /api/v1/subjects/{code}/practice/flashcards/decks/{deckId}`
 */
export const deleteFlashcardDeck = async (
    code: string,
    deckId: string,
): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: `/subjects/${code}/practice/flashcards/decks/${deckId}`,
    })
}

/**
 * Appends 1..500 cards to the end of a deck.
 *
 * `POST /api/v1/subjects/{code}/practice/flashcards/decks/{deckId}/cards`
 */
export const addFlashcardCards = async (
    code: string,
    deckId: string,
    request: AddFlashcardCardsRequest,
): Promise<Array<FlashcardCardView>> => {
    return restRequest<Array<FlashcardCardView>>({
        method: "POST",
        url: `/subjects/${code}/practice/flashcards/decks/${deckId}/cards`,
        data: request,
    })
}

/**
 * Patches one card — an omitted field keeps its current value.
 *
 * `PATCH /api/v1/subjects/{code}/practice/flashcards/cards/{cardId}`
 */
export const updateFlashcardCard = async (
    code: string,
    cardId: string,
    request: UpdateFlashcardCardRequest,
): Promise<FlashcardCardView> => {
    return restRequest<FlashcardCardView>({
        method: "PATCH",
        url: `/subjects/${code}/practice/flashcards/cards/${cardId}`,
        data: request,
    })
}

/**
 * Deletes one card (and the learners' progress on it).
 *
 * `DELETE /api/v1/subjects/{code}/practice/flashcards/cards/{cardId}`
 */
export const deleteFlashcardCard = async (
    code: string,
    cardId: string,
): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: `/subjects/${code}/practice/flashcards/cards/${cardId}`,
    })
}
